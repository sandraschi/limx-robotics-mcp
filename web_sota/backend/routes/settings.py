import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "src"))

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Settings"], prefix="/api/settings")

REPO_ROOT = Path(__file__).resolve().parents[3]
ENV_PATH = REPO_ROOT / ".env"
CONFIG_YAML = REPO_ROOT / "config.yaml"


def _read_settings() -> dict:
    if CONFIG_YAML.exists():
        raw = CONFIG_YAML.read_text(encoding="utf-8")
        data = yaml.safe_load(raw) or {}
        return {"source": "config.yaml", "data": data}
    if ENV_PATH.exists():
        env_vars = {}
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env_vars[key.strip()] = value.strip().strip("\"'")
        return {"source": ".env", "data": env_vars}
    return {"source": "defaults", "data": {
        "LIMX_EXTERNAL_DIR": "D:/Dev/repos/external",
        "LIMX_SIM_PYTHON": str(REPO_ROOT / ".venv-sim38" / "Scripts" / "python.exe"),
        "FLEET_EXCHANGE_ROOT": "D:/Dev/repos/_exchange",
    }}


def _write_env(data: dict) -> None:
    lines = []
    for key, value in data.items():
        lines.append(f"{key}={value}")
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _write_yaml(data: dict) -> None:
    CONFIG_YAML.write_text(yaml.dump(data, default_flow_style=False), encoding="utf-8")


@router.get("")
async def get_settings():
    return {"success": True, **{"settings": _read_settings()}}


class SettingsBody(BaseModel):
    data: dict
    format: str = "env"


@router.post("")
async def post_settings(body: SettingsBody):
    if body.format == "yaml":
        _write_yaml(body.data)
    else:
        _write_env(body.data)
    return {"success": True, "message": f"Settings saved to .{body.format}.", "settings": _read_settings()}
