import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from fastapi import APIRouter, Query
from pydantic import BaseModel
from limx_robotics_mcp.server import sim_status, start_sim, stop_sim, sim_jobs

router = APIRouter(tags=["Simulation"], prefix="/api/sim")


class StartSimBody(BaseModel):
    platform: str = "tron1"
    robot_type: str = "PF_TRON1A"


class StopSimBody(BaseModel):
    job_id: str


@router.get("/status")
async def get_sim_status():
    return await sim_status()


@router.post("/start")
async def post_start_sim(body: StartSimBody):
    return await start_sim(platform=body.platform, robot_type=body.robot_type)


@router.post("/stop")
async def post_stop_sim(body: StopSimBody):
    return await stop_sim(job_id=body.job_id)


@router.get("/jobs")
async def get_sim_jobs(
    job_id: str | None = Query(None),
    log_tail_lines: int = Query(25, ge=0, le=200),
):
    return await sim_jobs(job_id=job_id, log_tail_lines=log_tail_lines)
