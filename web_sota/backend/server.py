"""FastAPI backend for the limx-robotics-mcp web dashboard."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "src"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from web_sota.backend.routes.sim import router as sim_router
from web_sota.backend.routes.models import router as models_router
from web_sota.backend.routes.policies import router as policies_router
from web_sota.backend.routes.logging import router as logging_router
from web_sota.backend.routes.llm import router as llm_router
from web_sota.backend.routes.settings import router as settings_router

app = FastAPI(title="limx-robotics-mcp")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sim_router)
app.include_router(models_router)
app.include_router(policies_router)
app.include_router(logging_router)
app.include_router(llm_router)
app.include_router(settings_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "limx-robotics-mcp"}


@app.get("/api/health")
async def api_health():
    return {"status": "ok"}


# Serve the built React app
dist_dir = Path(__file__).resolve().parents[1] / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")


def run_dev() -> None:
    import uvicorn
    uvicorn.run("web_sota.backend.server:app", host="127.0.0.1", port=11044, log_level="info", reload=True)


if __name__ == "__main__":
    run_dev()
