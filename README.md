# Stop Detection using RoboFlow Inference

My partner and I live on a busy intersection here in Denver – over the years we've observed a lot of people in a hurry (delivery drivers, exotic cars, out-of-towners, etc), being that our corner is right next to a park where small children play as well as a few very popular restaurant/bars we were always concerned with the number of violators.

![Happy Camper brake lights](/assets/happy_camper.jpg)

The goal of this project is to use object detection to detect and classify drivers that **stop** and **don't stop** at our stop signs, giving us some concrete numbers behind the number of drivers that might be putting our neighborhood foot traffic at risk.

## Backend

Python with FastAPI, located in the `./backend` folder

### Requirements

These instructions assume you have a [RoboFlow inference](https://github.com/roboflow/inference) server running on http://localhost:9001/ (`pip install inference-cli && inference server start`)

### Setup

```shell
cd backend
conda create -n stop-detection
conda activate stop-detection
pip install "fastapi[standard]" uvicorn inference_sdk supervision opencv-python
```

### Run

```shell
fastapi dev
```

## Frontend

ReactJS, located in the `./frontend` folder

### Setup

In a separate terminal...

```shell
cd frontend
npm install
```

### Run

```shell
npm run dev
```

### Usage

Use the **Upload Footage** button at the upper right corner OR click the **upload** button in the video preview area then choose your video file.

[📹 5 Minute Sample Video](https://drive.google.com/file/d/1fBfy1sYsoifJxRmHl52urRcpY5lhbH58/view?usp=sharing)

After the video appears, click the **Process** button to call the backend inference API endpoint.

On my Macbook Pro (M1 Pro, 16gb) the server is able to process at just about real time (a 5 min. video typically takes about 5 minutes to process).

You can use the play button to start the video or click anywhere on the timeline (including on detections) to jump to a point in the video.

RED signifies stop sign violators and BLUE signifies vehicles that stopped appropriately

The **Reset** button will clear your video and results

---

## Video

https://github.com/user-attachments/assets/10a16304-7aae-4510-8a0c-a586f8f08775

## Final Results

In a 5 minute period, in the middle of the afternoon on a Tuesday, I observed only 20% of vehicles properly stop at stop signs in our intersection
