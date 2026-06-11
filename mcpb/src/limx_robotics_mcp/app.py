"""FastAPI + MCP HTTP server for the limx-robotics-mcp web dashboard."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from limx_robotics_mcp.server import mcp, sim_status as _sim_status

app = FastAPI(title="limx-robotics-mcp")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    result = await _sim_status()
    return result


@app.get("/api/health")
async def api_health():
    return await health()


# Mount MCP HTTP transport
app.mount("/mcp", mcp.http_app())


def run_dev():
    import uvicorn
    uvicorn.run("limx_robotics_mcp.app:app", host="127.0.0.1", port=11044, log_level="info")
