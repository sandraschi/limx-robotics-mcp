import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from fastapi import APIRouter, Query
from pydantic import BaseModel
from limx_robotics_mcp.server import list_policies, run_deployed_policy, RL_DEPLOY

router = APIRouter(tags=["Policies"], prefix="/api/policies")


class RunPolicyBody(BaseModel):
    platform: str = "tron1"
    policy_name: str = ""
    robot_type: str = "PF_TRON1A"


@router.get("")
async def get_policies(platform: str = Query("tron1")):
    return await list_policies(platform=platform)


@router.post("/run")
async def post_run_policy(body: RunPolicyBody):
    return await run_deployed_policy(
        platform=body.platform,
        policy_name=body.policy_name,
        robot_type=body.robot_type,
    )


@router.get("/depot")
async def get_policy_depot():
    results = {}
    for platform, deploy in RL_DEPLOY.items():
        controllers_dir = deploy["repo"] / "controllers"
        if not controllers_dir.exists():
            results[platform] = {"error": f"controllers/ not found at {controllers_dir}"}
            continue
        entries = []
        for child in sorted(controllers_dir.iterdir()):
            if child.is_dir():
                size = sum(f.stat().st_size for f in child.rglob("*") if f.is_file())
                entries.append({"name": child.name, "type": "dir", "size_bytes": size})
            elif child.suffix == ".py":
                entries.append({"name": child.stem, "type": "script", "size_bytes": child.stat().st_size})
        results[platform] = entries
    return {"success": True, "data": results}
