# un-Happy Camper(s)

My partner and I live on a very busy intersection here in Denver, there's a local bar that attracts a lot of out of towners, delivery drivers, fast cars, etc... we see a lot of people in a hurry.

The bar in question is **[Happy Camper](https://happycamper.pizza/denver/)** – my partner on the other hand... is an un-happy camper... with all the drivers that barrel through our stop signs.

![Happy Camper brake lights](/assets/happy_camper.jpg)

This project's main goal is to document some real traffic numbers using [RoboFlow's Inference SDK](https://roboflow.com/?ref=unhappy-camper) so we can get an idea of just how many drivers **stop** at our stop signs and how many simply roll on through.

## Backend

Python with FastAPI, located in the `./backend` folder

### Setup

```shell
cd backend
conda create -n unhappy-campers
conda activate unhappy-campers
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

On my M1 Macbook Pro (16gb) the server is able to process at just about real time (a 5 min. video typically takes about 5 minutes to process).

You can use the play button to start the video or click anywhere on the timeline (including on detections) to jump to a point in the video.

RED signifies stop sign violators and BLUE signifies vehicles that stopped appropriately

The **Reset** button will clear your video and results

---

## Brief Tour

https://github.com/user-attachments/assets/10a16304-7aae-4510-8a0c-a586f8f08775

## Tools & Models

I used RoboFlow's awesome [PolygonZone](https://polygonzone.roboflow.com/) tool to draw my two target zones (stop areas) and trained my own Car + Wheel object detection model through RoboFlow's web interface.

To perform inference on video footage we call our object detection model through [RoboFlow's Inference SDK]() on individual video frames at a fixed frame rate that balances performance and accuracy.

The frontend is a simple React application and our backend uses FastAPI in conjunction with OpenCV, [roboflow/inference](https://github.com/roboflow/inference), and [roboflow/supervision](https://github.com/roboflow/supervision) (which we use for unique vehicle identification and tracking).

## Notes

Building this required some architectural tradeoffs – processing video can be computationally taxing, I worked to balance accuracy with the user's experience (latency and time to process footage).

I experimented early with lots of RoboFlow products and models and landed on an approach that first (v0) re-used a wheel detection model someone else had built. This would allow me to start building right away without having to worry about annotating and building a fine tuned model.

It worked okay – detecting wheels primarily at the bottom of the scene (where they were bigger and better matched the model's original dataset) – and allowed me to build an algorithm that calculated wheel speed and dwell time in our stop zone (S-T-O-P as my partner always reminds me...).

This worked well enough to get the UI to ~75% while letting me make good progress testing out my API endpoint; dialing in it's response, trying out different processing frame rates, determining dwell time and wheel speeds we'd consider 'stopped', etc.

The algorithm was promising but the model was missing the smaller wheels in the scene so it was time to upload some frames (~80), annotate them up, and train our own model.

During the process of training my own model (v1), I tried several of the models RoboFlow offers –  starting with RF-DETR, then RoboFlow Instant, and finally settling on RoboFlow 3.0 Object Detection (Fast).

_On my little Macbook Pro M1 I needed all the speed I could get. RF-DETR and Instant produced great results but the amount of time per frame made it unusable for anything over a few seconds of video footage._

## The Final Result

In a 5 minute period, in the middle of the afternoon on a Tuesday, I observed only 20% of vehicles properly stop at stop signs in our intersection. My partner was right – we had a problem...

## Running into issues

During my early testing, I tried **Workflows**, unfortunately after getting a local inference server up and running on my Mac (Macbook Pro M1) and connecting through RoboFlow's web app, I was unable to evaluate workflows with video inputs for some reason (it would just hang in the UI). Not wanting to waste too much time, I decided to move to an approach I was more confident with so I could keep making progress: individual frame processing using a small model with downstream evaluation.

trackers / supervision libraries: early in development I ran into a conflict where importing the supervision library (/trackers library) would cause an error with FastAPI/Uvicorn. When I discovered the issue I decided to move forward without a tracker (again to keep making progress) and use more rudimentary methods to identify and follow unique vehicles. After building out the other aspects of the project I revisited the issue and after a few searches determined there was a conflict with `uvloop` – the fix was as simple as uninstalling that package (`pip uninstall uvloop`). After gaining this new, final piece of the CV pipeline I was able to add much more robust vehicle identification, tracking, and stop/no-stop detection.

## Future Features

The area I'm most excited about! Here are some future features we could add to enhance the experience...

### Live Video Stream Processing

The obvious next step would be to add a way to persistently store data (SQL database) and enable the app to process a live video feed in the background (RTSP or otherwise).

To meet the short timeline of the project, I simply recorded an hour of my intersection (plenty of violators!) and fed curated sections of the video into the app for development.

### Automatic Car Spotter & Tracker

We get a lot of exotics and supercars through our intersection (Mclaren's, Lamborghini's, etc) – personally, I'd love to see those tracked so I could scroll back through.

This should be able to be accomplished using a vLLM relatively easily nowadays; "Identify the make and model of this vehicle, reply only with the make and model..."

### Enhanced Violator Tracking

It would be nice to able to extend the data to see if we're dealing with a wide-spread problem or if there's a relatively few number of persistent violators; uber eats drivers, out of towners, etc. My hypothesis is it's wide spread but I do also think there are a few neighbors that persistently roll on through the stop signs.

- v0: Long time frame resilient tracker (KeepTrack?), CLIP similarity, other embedding approaches
- v1+: Higher resolution camera(s) with license plate identification might be an option

### Noise Violation Tracker

As alluded to above – lots of exotics == lots of high revving engines and show offs, it would be a nice addition to have analytics on noise pollution, repeat offenders, etc.

### Custom Zone Drawing

For the purposes of this short exercise I ended up hard coding our two stop zones into the backend, obviously for this to be useful to others I'd need to remove that and enable the user to define their own zones.

v0 would be to incorpoate PolygonZone-like drawing into our frontend OR simply pointing the users to that tool and allowing them to paste in their polygons array

A much more advanced version would be to use an image generation model or possibly an image segmentation model to get a starting point then letting the user edit and finalize the mask specific to their scene.

I experimented early with using `gpt-image-1` just to see if it might be able to automatically generate stop zones on it's own. While it produced some convincing images (it seemed to at least understand what I was asking for), it still wasn't quite ready for prime time...

![gpt-image-1 attempt at stop zones](/assets/gpt-image-1_stopzones.png)

### Better Visuals

This one you could work on till the end of time but a few that come to mind are better object visualization – showing wheels that are actively violating a stop as red for example. Showing an emoji at or near the stop zone when a car is violating a stop. The results log could show thumbnails of the vehicles.

### More Testing

The model was trained only in daylight conditions over 1 afternoon, while it should be pretty good, I also would expect it to perform less-good during heavily overcast or with various weather conditions (we get some wild ones up here) and at night.

## Retrospect

This was a really fun exercise – I definitely spent a good majority of the time getting to learn RoboFlow's libaries and training + annotation platform. It was really satisfying developing the application the way I did: starting with a model that was okay, setting up a basic endpoint, building the UI, going back to the model, finally adding vehicle id + tracking. It felt like nice solid chunks of progression as I watched the interface take shape while the model and algorithm just got better and better, RoboFlow honestly made the CV side of things really seamless... I'd guess the model training pipeline saved me at least 2 hours of wrangling on my local machine.

All in, I'm really happy I undertook this project – long before this assignment I felt compelled to build this exact thing. My partner would regularly extoll to me as people blew through the stop signs – "another one...", "oh, there's another" – in the back of my mind I knew she was right but what could I do about it...

The idea had been percolating to count violators using CV, to validate her, to give her some concrete #s behind it so maybe she would find some peace with it – when I saw the assignment come through I knew there was only 1 project I could work on... un-Happy Camper(s).
