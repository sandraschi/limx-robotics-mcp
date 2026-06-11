import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from fastapi import APIRouter, Query
from limx_robotics_mcp.server import LOG_DIR

router = APIRouter(tags=["Logging"], prefix="/api/logs")


def _tail_file(path: Path, lines: int) -> list[str]:
    if not path.exists():
        return []
    content = path.read_text(encoding="utf-8", errors="replace")
    all_lines = content.splitlines()
    return all_lines[-lines:]


@router.get("")
async def get_logs(
    lines: int = Query(200, ge=1, le=5000),
    level: str = Query("INFO"),
    search: str | None = Query(None),
):
    log_file = LOG_DIR / "server.log"
    if not log_file.exists():
        return {"success": True, "message": "No server.log found.", "lines": []}
    tail = _tail_file(log_file, lines)
    if search:
        tail = [line for line in tail if search.lower() in line.lower()]
    if level.upper() != "INFO":
        tail = [line for line in tail if level.upper() in line]
    return {"success": True, "file": str(log_file), "lines": tail, "count": len(tail)}


@router.get("/files")
async def get_log_files():
    if not LOG_DIR.exists():
        return {"success": True, "files": []}
    files = []
    for f in sorted(LOG_DIR.iterdir()):
        if f.suffix == ".log" and f.is_file():
            files.append({
                "name": f.name,
                "size_bytes": f.stat().st_size,
                "modified": f.stat().st_mtime,
            })
    return {"success": True, "files": files, "dir": str(LOG_DIR)}


@router.get("/file")
async def get_log_file(
    path: str = Query(...),
    lines: int = Query(200, ge=1, le=5000),
):
    log_path = Path(path)
    if not log_path.is_absolute():
        log_path = LOG_DIR / log_path
    if not log_path.exists() or not log_path.is_file():
        return {"success": False, "message": f"File not found: {log_path}"}
    if log_path.suffix != ".log":
        return {"success": False, "message": "Only .log files are supported."}
    tail = _tail_file(log_path, lines)
    return {"success": True, "file": str(log_path), "lines": tail, "count": len(tail)}
