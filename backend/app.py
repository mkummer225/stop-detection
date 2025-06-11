from fastapi import FastAPI, Form, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from inference_sdk import InferenceHTTPClient
import os
from datetime import datetime
import cv2

PROCESS_FPS = 5 # number of frames to process every second

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

# Initialize the InferenceHTTPClient
# client = InferenceHTTPClient(api_url="https://serverless.roboflow.com",
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

        # House a buffer of frames of size (fps/PROCESS_FPS) that get's processed for
        # every 1 second of video time
        frame_buffer = []
        frames_per_batch = int(fps / PROCESS_FPS)

        print(f"Processing frames...")
        while cap.isOpened():
            ret, frame = cap.read()
            
            if not ret:
                break

            # Build up our buffer and bulk process once per second of video time
            if (current_frame % (frames_per_batch) == 0):
                print(f"Add frame to buffer: #{current_frame}")
                # _, buffer = cv2.imencode('.jpg', frame)
                frame_buffer.append(frame)

                # if len(frame_buffer) >= 100:
                #     print(f"Process buffer")

                #     # Process this batch of images then perform our analysis whether
                #     # or not the vehicle(s) stopped
                #     results = client.infer(frame_buffer, model_id="wheels-detection-fgbtv/1")
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
            results = client.infer(frame_buffer, model_id="wheels-detection-fgbtv/1")
            print(results)
            resultsArray = [{"frame": (i * frames_per_batch), "predictions": res["predictions"]} for i, res in enumerate(results)]

            # Reset buffer...
            frame_buffer = []

        cap.release()

        # Clean up the temporary file
        os.unlink(temp_file_path)

        return { "result": resultsArray }
        # return StreamingResponse(stream_frames(), media_type="multipart/x-mixed-replace;boundary=frame")
    except Exception as e:
        # Clean up the temporary file
        os.unlink(temp_file_path)

        return { "result": "error", "message": f"{e}" }
