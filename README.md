# unhappy-campers.co

My partner and I live on a very busy corner here in Denver, there's a local bar that attracts a lot of out of towners, delivery drivers, etc... 

The bar in question is called **[Happy Camper](https://happycamper.pizza/denver/)** – my partner on the other hand... is an un-happy camper... with all the drivers that barrel through our stop signs.

This project serves to document some real traffic numbers using [RoboFlow's Inference SDK](https://roboflow.com/?ref=unhappy-camper) so we can get an idea of just how many drivers **stop** at our stop signs and how many simply roll on through.

## Backend
Python with FastAPI, located in the `./backend` folder

### Setup
```shell
pip install "fastapi[standard]" uvicorn inference_sdk
```

### Run
```shell
cd backend
fastapi dev
```


## Frontend
ReactJS, located in the `./frontend` folder

### Setup
```shell
cd frontend
npm i
```

### Run
```shell
npm run dev
```
