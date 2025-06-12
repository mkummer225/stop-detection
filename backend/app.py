from fastapi import FastAPI, Form, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from inference_sdk import InferenceHTTPClient, InferenceConfiguration
import os
from datetime import datetime
import cv2
import numpy as np

# Import supervision for tracking
import supervision as sv

FPS=30
PROCESS_EVERY_N = 10 # process every n number of frames (ie, 10 means every 10 frames process a frame)

HARDCODED_STOPZONE_POLYS=[
    np.array([[657, 435], [829, 453], [822, 487], [678, 474]]), # more northern
    np.array([[946, 598], [822, 640], [807, 661], [851, 717], [1057, 675]])
]

HARDCODED_STOPZONE_LINES=[
    np.array([[837, 451], [828, 489]]), # more northern
    np.array([[1055, 663], [1027, 640]])
]

# Create temp_footage directory if it doesn't exist
os.makedirs("temp_footage", exist_ok=True)

origins = [
    "http://localhost",
    "http://localhost:5173",
]

app = FastAPI(debug=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

inference_config = InferenceConfiguration(confidence_threshold=0.05)

# Initialize the InferenceHTTPClient
client = InferenceHTTPClient(api_url="http://localhost:9001",
                             api_key="xvBNtZrVRoYKrwQcUakx")

# Initialize tracker
tracker = sv.ByteTrack(frame_rate=FPS/PROCESS_EVERY_N)

# Recieve frames from a video and process it for stop sign violators
# TODO: receive and process a RTSP stream
@app.post("/api/get_violators")
async def inference(video: UploadFile = Form(...), fps: float = Form(...)):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Create filename with timestamp prefix
    filename = f"{timestamp}_{video.filename}"
    temp_file_path = os.path.join("temp_footage", filename)

    try:
        print(f"Reading video contents: {video.filename}")

        contents = await video.read()
        
        # Save the video file
        with open(temp_file_path, "wb") as f:
            f.write(contents)

        cap = cv2.VideoCapture(temp_file_path)

        resultsArray = []

        # Track the current frame position
        current_frame = 0

        # House a buffer of frames of size (fps/PROCESS_EVERY_N) that get's processed for
        # every 1 second of video time
        frame_buffer = []

        # Store all tracking data
        vehicle_tracks = {}

        print(f"Processing frames...")
        while cap.isOpened():
            ret, frame = cap.read()
            
            if not ret:
                break

            # Build up our buffer and bulk process once per second of video time
            if (current_frame % PROCESS_EVERY_N == 0):
                print(f"Add frame to buffer: #{current_frame}")
                frame_buffer.append(frame)
            
            current_frame += 1
        
        # Process all results at once for now (let RoboFlow handle the queue and getting us our results)
        if len(frame_buffer) > 0:
            print(f"Flush remaining buffer")

            # Process this batch of images then perform our analysis whether
            # or not the vehicle(s) stopped
            results = client.infer(frame_buffer, model_id="wheel-detection-0mkax/2")

            # Filter results to only include frames with at least 1 detection
            predictions_with_detections = []

            for frame_idx, res in enumerate(results):
                # Add to predictions if there are any detections (wheel or car)
                if len(res["predictions"]) > 0:
                    predictions_with_detections.append({
                        "frame": frame_idx * PROCESS_EVERY_N,
                        "predictions": res["predictions"]
                    })

                # Separate car and wheel detections
                car_detections = [det for det in res["predictions"] if det.get("class", "").lower() == "car"]
                wheel_detections = [det for det in res["predictions"] if det.get("class", "").lower() == "wheel"]
                
                # First, track cars to get consistent vehicle IDs
                tracked_cars = {}
                if len(car_detections) > 0:
                    print(f"Cars detected in frame #{frame_idx}")
                    
                    # Convert car detections to supervision format for tracking
                    xyxy = []
                    confidences = []
                    class_ids = []
                    
                    for detection in car_detections:
                        # Convert from center format to xyxy format
                        x_center = detection["x"]
                        y_center = detection["y"]
                        width = detection["width"]
                        height = detection["height"]
                        
                        x1 = x_center - width / 2
                        y1 = y_center - height / 2
                        x2 = x_center + width / 2
                        y2 = y_center + height / 2
                        
                        xyxy.append([x1, y1, x2, y2])
                        confidences.append(detection["confidence"])
                        class_ids.append(0)  # Car class
                    
                    # Create supervision Detections object
                    detections = sv.Detections(
                        xyxy=np.array(xyxy),
                        confidence=np.array(confidences),
                        class_id=np.array(class_ids)
                    )
                    
                    # Update tracker
                    tracked_detections = tracker.update_with_detections(detections)
                    
                    # Store tracked car positions for wheel association
                    for i, bbox in enumerate(tracked_detections.xyxy):
                        track_id = tracked_detections.tracker_id[i]
                        confidence = tracked_detections.confidence[i]
                        
                        x1, y1, x2, y2 = bbox
                        car_center = np.array([(x1 + x2) / 2, (y1 + y2) / 2])
                        
                        tracked_cars[track_id] = {
                            'bbox': bbox,
                            'center': car_center,
                            'confidence': confidence
                        }

                # Now process wheels and associate them with tracked cars
                if len(wheel_detections) > 0:
                    print(f"Wheels detected in frame #{frame_idx}")
                    
                    for wheel_det in wheel_detections:
                        wheel_x = wheel_det["x"]
                        wheel_y = wheel_det["y"]
                        wheel_center = np.array([wheel_x, wheel_y])

                        # Check if wheel is in any stopzone
                        in_stopzone = False
                        for poly in HARDCODED_STOPZONE_POLYS:
                            if cv2.pointPolygonTest(poly, (wheel_x, wheel_y), False) >= 0:
                                in_stopzone = True
                                break

                        if in_stopzone:
                            # Find the closest tracked car to this wheel
                            closest_car_id = None
                            min_distance = float('inf')
                            
                            for track_id, car_data in tracked_cars.items():
                                # Calculate distance from wheel to car center
                                distance = np.linalg.norm(wheel_center - car_data['center'])
                                
                                # Check if wheel is within reasonable distance of car
                                # (adjust threshold based on your video scale)
                                if distance < 200 and distance < min_distance:  # 200 pixel threshold
                                    min_distance = distance
                                    closest_car_id = track_id

                            # If we found a car associated with this wheel in stopzone
                            if closest_car_id is not None:
                                # Initialize track if not exists
                                if closest_car_id not in vehicle_tracks:
                                    vehicle_tracks[closest_car_id] = {
                                        'wheel_positions': [],
                                        'car_positions': [],
                                        'frame_indices': [],
                                        'confidences': [],
                                        'stopped': False,
                                        'start_frame': frame_idx * PROCESS_EVERY_N,
                                        'end_frame': frame_idx * PROCESS_EVERY_N
                                    }

                                # Add wheel position (for stopzone analysis) and car position (for reference)
                                vehicle_tracks[closest_car_id]['wheel_positions'].append(wheel_center)
                                vehicle_tracks[closest_car_id]['car_positions'].append(tracked_cars[closest_car_id]['center'])
                                vehicle_tracks[closest_car_id]['frame_indices'].append(frame_idx)
                                vehicle_tracks[closest_car_id]['confidences'].append(tracked_cars[closest_car_id]['confidence'])
                                vehicle_tracks[closest_car_id]['end_frame'] = frame_idx * PROCESS_EVERY_N

            # Analyze each vehicle track using WHEEL positions to determine if they stopped
            for track_id, track_data in vehicle_tracks.items():
                wheel_positions = np.array(track_data['wheel_positions'])
                frame_indices = track_data['frame_indices']
                
                if len(wheel_positions) < 3:  # Need at least 3 points to determine stopping
                    continue

                # Calculate speeds between consecutive WHEEL positions
                speeds = []
                for i in range(1, len(wheel_positions)):
                    distance = np.linalg.norm(wheel_positions[i] - wheel_positions[i-1])
                    frame_diff = frame_indices[i] - frame_indices[i-1]
                    if frame_diff > 0:
                        # Speed in pixels per frame
                        speed = distance / frame_diff
                        speeds.append(speed)

                if len(speeds) < 2:
                    continue

                # Check if vehicle came to a stop based on WHEEL movement
                STOP_THRESHOLD = 48 * (PROCESS_EVERY_N/fps) # 48 pixels per second is considered a stop
                MIN_STOP_DURATION = int((fps/PROCESS_EVERY_N)/2) # 1 full second of stoppage

                consecutive_low_speeds = 0
                max_consecutive_low_speeds = 0
                
                for speed in speeds:
                    if speed < STOP_THRESHOLD:
                        consecutive_low_speeds += 1
                        max_consecutive_low_speeds = max(max_consecutive_low_speeds, consecutive_low_speeds)
                    else:
                        consecutive_low_speeds = 0

                if max_consecutive_low_speeds >= MIN_STOP_DURATION:
                    print(f"Vehicle {track_id} STOPPED in stopzone (wheel stopped for {max_consecutive_low_speeds} frame intervals)")
                    track_data['stopped'] = True
                else:
                    print(f"Vehicle {track_id} did NOT stop in stopzone (wheel max consecutive low speeds: {max_consecutive_low_speeds})")

            # Prepare vehicle tracking results
            vehicle_results = []
            for track_id, track_data in vehicle_tracks.items():
                vehicle_results.append({
                    "track_id": int(track_id),
                    "stopped": track_data["stopped"],
                    "start_frame": track_data["start_frame"],
                    "end_frame": track_data["end_frame"],
                    "frames_detected": [i * PROCESS_EVERY_N for i in track_data["frame_indices"]],
                    "avg_confidence": float(np.mean(track_data["confidences"])) if track_data["confidences"] else 0.0,
                    "wheel_detections": len(track_data["wheel_positions"])
                })

            resultsArray = {
                "predictions": predictions_with_detections,
                "vehicles": vehicle_results
            }

            # Reset buffer...
            frame_buffer = []

        cap.release()

        # Clean up the temporary file
        os.unlink(temp_file_path)
        # print(resultsArray)
        return { "result": resultsArray }
    except Exception as e:
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

        return { "result": "error", "message": f"{e}" }
