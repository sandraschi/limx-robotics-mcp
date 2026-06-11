"""Tests for the FastAPI backend routes (web_sota/backend/server.py).

Mocks the MCP tool functions at the route-module level so each
endpoint returns a controlled response without needing real repos.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def mock_routes(mocker):
    """Patch the MCP functions imported by each route module."""
    import web_sota.backend.routes.sim as sim_mod
    import web_sota.backend.routes.models as models_mod
    import web_sota.backend.routes.policies as policies_mod

    mocker.patch.object(sim_mod, "sim_status",
                        return_value={"success": True, "ready": True, "message": "mock"})
    mocker.patch.object(sim_mod, "start_sim",
                        return_value={"success": True, "job_id": "test123", "status": "running", "message": "mock"})
    mocker.patch.object(sim_mod, "stop_sim",
                        return_value={"success": True, "message": "mock"})
    mocker.patch.object(sim_mod, "sim_jobs",
                        return_value={"success": True, "jobs": [], "message": "0 jobs"})

    mocker.patch.object(models_mod, "list_robot_variants",
                        return_value={"success": True, "variants": ["PF_TRON1A", "SF_TRON1A"], "message": "mock"})
    mocker.patch.object(models_mod, "get_robot_description",
                        return_value={"success": True, "files": [], "message": "mock"})
    mocker.patch.object(models_mod, "export_model_for_fleet",
                        return_value={"success": True, "path": "mock.glb", "message": "mock"})

    mocker.patch.object(policies_mod, "list_policies",
                        return_value={"success": True, "policies": [], "message": "mock"})
    mocker.patch.object(policies_mod, "run_deployed_policy",
                        return_value={"success": True, "exit_code": 0, "message": "mock"})


@pytest.fixture
def client():
    from web_sota.backend.server import app
    return TestClient(app)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


# ---------------------------------------------------------------------------
# Simulation routes
# ---------------------------------------------------------------------------


def test_sim_status_route(client):
    resp = client.get("/api/sim/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


def test_sim_start_route(client):
    resp = client.post("/api/sim/start", json={"platform": "tron1", "robot_type": "PF_TRON1A"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["job_id"] == "test123"


def test_sim_jobs_route(client):
    resp = client.get("/api/sim/jobs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True


# ---------------------------------------------------------------------------
# Model routes
# ---------------------------------------------------------------------------


def test_variants_route(client):
    resp = client.get("/api/models/variants?platform=tron1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "PF_TRON1A" in data["variants"]


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


def test_settings_route(client):
    resp = client.get("/api/settings")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "settings" in data


# ---------------------------------------------------------------------------
# LLM providers
# ---------------------------------------------------------------------------


def test_llm_providers(client):
    """Both Ollama and LM Studio are likely not running in test → both unavailable."""
    resp = client.get("/api/llm/providers")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "providers" in data
    assert "ollama" in data["providers"]
    # Both typically down in test; no assertion on availability


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------


def test_logs_route(client):
    resp = client.get("/api/logs")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
