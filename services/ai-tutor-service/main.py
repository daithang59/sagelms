from fastapi import FastAPI

app = FastAPI(title="SageLMS AI Tutor", version="0.0.1")


@app.get("/health")
def health():
    return {"status": "UP"}


@app.get("/ping")
def ping():
    return "ok"
