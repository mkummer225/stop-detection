from fastapi import FastAPI, Form, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from inference_sdk import InferenceHTTPClient, InferenceConfiguration
import os
from datetime import datetime
import cv2
import numpy as np

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

        # def stream_frames():
        # Track the current frame position
        current_frame = 0

        # House a buffer of frames of size (fps/PROCESS_EVERY_N) that get's processed for
        # every 1 second of video time
        frame_buffer = []
        frames_per_batch = int(fps / PROCESS_EVERY_N)

        print(f"Processing frames...")
        while cap.isOpened():
            ret, frame = cap.read()
            
            if not ret:
                break

            # Build up our buffer and bulk process once per second of video time
            if (current_frame % PROCESS_EVERY_N == 0):
                print(f"Add frame to buffer: #{current_frame}")
                frame_buffer.append(frame)

                # if len(frame_buffer) >= 100:
                #     print(f"Process buffer")

                #     # Process this batch of images then perform our analysis whether
                #     # or not the vehicle(s) stopped
                #     results = client.infer(frame_buffer, model_id="wheel-detection-0mkax/2")
                #     print(results)
                #     resultsArray.append([{"frame": i, "predictions": res["predictions"]} for i, res in enumerate(results)])

                #     # Reset buffer...
                #     frame_buffer = []
            
            current_frame += 1
        
        # Process all results at once for now (let RoboFlow handle the queue and getting us our results)
        if len(frame_buffer) > 0:
            print(f"Flush remaining buffer")

            # Process this batch of images then perform our analysis whether
            # or not the vehicle(s) stopped
            results = client.infer(frame_buffer, model_id="wheel-detection-0mkax/2")

            # Filter results to only include frames with at least 1 detection
            predictions_with_detections = []
            
            # Track vehicles across frames (simple tracking by proximity)
            vehicle_tracks = {}
            track_id_counter = 0

            for frame_idx, res in enumerate(results):
                # Add to predictions if there are any detections (wheel or car)
                if len(res["predictions"]) > 0:
                    predictions_with_detections.append({
                        "frame": frame_idx * PROCESS_EVERY_N,
                        "predictions": res["predictions"]
                    })

                # Filter for only wheel detections for vehicle tracking
                wheel_detections = [det for det in res["predictions"] if det.get("class", "").lower() == "wheel"]
                
                if len(wheel_detections) < 1:
                    continue

                print(f"Wheels detected in frame #{frame_idx}")

                for detection in wheel_detections:
                    wheel_x = detection["x"]
                    wheel_y = detection["y"]
                    wheel_center = np.array([wheel_x, wheel_y])

                    # Check if wheel is in any stopzone
                    in_stopzone = False
                    for poly in HARDCODED_STOPZONE_POLYS:
                        if cv2.pointPolygonTest(poly, (wheel_x, wheel_y), False) >= 0:
                            in_stopzone = True
                            break

                    if in_stopzone:
                        # Simple tracking: find closest existing track or create new one
                        closest_track_id = None
                        min_distance = float('inf')
                        
                        for track_id, track_data in vehicle_tracks.items():
                            if len(track_data['positions']) > 0:
                                last_pos = track_data['positions'][-1]
                                distance = np.linalg.norm(wheel_center - last_pos)
                                if distance < 100 and distance < min_distance:  # 100 pixel threshold
                                    min_distance = distance
                                    closest_track_id = track_id

                        # Assign to existing track or create new one
                        if closest_track_id is not None:
                            current_track_id = closest_track_id
                        else:
                            current_track_id = track_id_counter
                            track_id_counter += 1
                            vehicle_tracks[current_track_id] = {
                                'positions': [],
                                'frame_indices': [],
                                'stopped': False,
                                'start_frame': frame_idx * PROCESS_EVERY_N,
                                'end_frame': frame_idx * PROCESS_EVERY_N
                            }

                        # Add current position to track
                        vehicle_tracks[current_track_id]['positions'].append(wheel_center)
                        vehicle_tracks[current_track_id]['frame_indices'].append(frame_idx)
                        vehicle_tracks[current_track_id]['end_frame'] = frame_idx * PROCESS_EVERY_N

            # Analyze each vehicle track to determine if they stopped
            for track_id, track_data in vehicle_tracks.items():
                positions = np.array(track_data['positions'])
                frame_indices = track_data['frame_indices']
                
                if len(positions) < 3:  # Need at least 3 points to determine stopping
                    continue

                # Calculate speeds between consecutive positions
                speeds = []
                for i in range(1, len(positions)):
                    distance = np.linalg.norm(positions[i] - positions[i-1])
                    frame_diff = frame_indices[i] - frame_indices[i-1]
                    if frame_diff > 0:
                        # Speed in pixels per frame (could convert to real units if needed)
                        speed = distance / frame_diff
                        speeds.append(speed)

                if len(speeds) < 2:
                    continue

                # Check if vehicle came to a stop (speed below threshold for consecutive frames)
                # 24 pixels is 24 inches in our image
                STOP_THRESHOLD = 48 * (PROCESS_EVERY_N/fps) # 12 pixels (inches) per second is considered a stop
                MIN_STOP_DURATION = (fps/PROCESS_EVERY_N) # 1 full second of stoppage

                consecutive_low_speeds = 0
                max_consecutive_low_speeds = 0
                
                for speed in speeds:
                    if speed < STOP_THRESHOLD:
                        consecutive_low_speeds += 1
                        max_consecutive_low_speeds = max(max_consecutive_low_speeds, consecutive_low_speeds)
                    else:
                        consecutive_low_speeds = 0

                if max_consecutive_low_speeds >= MIN_STOP_DURATION:
                    print(f"Vehicle {track_id} STOPPED in stopzone (stopped for {max_consecutive_low_speeds} frame intervals)")
                    track_data['stopped'] = True
                else:
                    print(f"Vehicle {track_id} did NOT stop in stopzone (max consecutive low speeds: {max_consecutive_low_speeds})")

            # Prepare vehicle tracking results
            vehicle_results = []
            for track_id, track_data in vehicle_tracks.items():
                vehicle_results.append({
                    "track_id": track_id,
                    "stopped": track_data["stopped"],
                    "start_frame": track_data["start_frame"],
                    "end_frame": track_data["end_frame"],
                    "frames_detected": [i * PROCESS_EVERY_N for i in track_data["frame_indices"]]
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
        print(resultsArray)
        return { "result": resultsArray }
    except Exception as e:
        # Clean up the temporary file
        os.unlink(temp_file_path)

        return { "result": "error", "message": f"{e}" }
