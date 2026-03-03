from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from forecast_engine import generate_forecast

app = FastAPI(
    title="AdBoostAI Forecast Engine",
    description="Financial intelligence backend for campaign budget forecasting",
    version="1.0.0",
)

# CORS – allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/forecast")
def forecast(data: dict):
    campaign_id = data.get("campaign_id")
    if not campaign_id:
        return {"error": "campaign_id is required"}, 400

    result = generate_forecast(campaign_id)
    return result
