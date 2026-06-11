import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from fastapi import APIRouter, Query
from pydantic import BaseModel
from limx_robotics_mcp.server import (
    list_robot_variants,
    get_robot_description,
    export_model_for_fleet,
    FLEET_EXCHANGE,
)

router = APIRouter(tags=["Models"], prefix="/api/models")


class ExportBody(BaseModel):
    platform: str = "oli"
    variant: str = "HU_D04_01"
    format: str = "glb"


@router.get("/variants")
async def get_variants(platform: str = Query("tron1")):
    return await list_robot_variants(platform=platform)


@router.get("/descriptions")
async def get_descriptions(
    platform: str = Query("oli"),
    variant: str | None = Query(None),
    format: str = Query("urdf"),
    include_content: bool = Query(False),
):
    return await get_robot_description(
        platform=platform,
        variant=variant,
        format=format,
        include_content=include_content,
    )


@router.post("/export")
async def post_export(body: ExportBody):
    return await export_model_for_fleet(
        platform=body.platform,
        variant=body.variant,
        format=body.format,
    )


@router.get("/depot")
async def get_depot():
    limx_exchange = FLEET_EXCHANGE / "models" / "limx"
    if not limx_exchange.exists():
        return {"success": True, "files": [], "path": str(limx_exchange)}
    files = []
    for child in sorted(limx_exchange.iterdir()):
        if child.is_file():
            files.append({
                "name": child.name,
                "size_bytes": child.stat().st_size,
                "modified": child.stat().st_mtime,
            })
    return {"success": True, "files": files, "path": str(limx_exchange)}
