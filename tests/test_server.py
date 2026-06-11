"""Tests for limx-robotics-mcp MCP tools (server.py).

Each test imports the server module after setting up sys.path, mocks
subprocess/file-system dependencies, and asserts return dict keys.
"""

from pathlib import Path

import pytest


@pytest.fixture
def all_paths_exist(mocker):
    """Make Path.exists/mkdir and time.sleep harmless."""
    mocker.patch("pathlib.Path.exists", return_value=True)
    mocker.patch("pathlib.Path.mkdir", return_value=None)
    mocker.patch("time.sleep", return_value=None)


@pytest.fixture
def mock_rglob(mocker):
    """Patch Path.rglob to return a list of mock file paths."""
    fakes = []

    def _make(name: str, stem: str, suffix: str = ".urdf", size: int = 1024, content: str = ""):
        m = mocker.MagicMock(spec=Path)
        m.name = name
        m.stem = stem
        m.suffix = suffix
        m.__str__.return_value = f"D:/fake/path/{name}"
        m.stat.return_value.st_size = size
        m.read_text.return_value = content
        fakes.append(m)
        return m

    yield _make
    mocker.stopall()


# ---------------------------------------------------------------------------
# start_sim
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_start_sim_success(mocker, all_paths_exist, mock_subprocess):
    """Mock Popen, verify job_id returned, status=running."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch.object(server_mod, "_tron1_variants", return_value=["PF_TRON1A"])

    result = await server_mod.start_sim(platform="tron1", robot_type="PF_TRON1A")
    assert result["success"] is True
    assert "job_id" in result
    assert result["status"] == "running"


@pytest.mark.asyncio
async def test_start_sim_unknown_platform():
    """Unknown platform returns error."""
    import limx_robotics_mcp.server as server_mod

    result = await server_mod.start_sim(platform="mars", robot_type="PF_TRON1A")
    assert result["success"] is False
    assert "mars" in result["message"]


@pytest.mark.asyncio
async def test_start_sim_missing_model(mocker, all_paths_exist):
    """Invalid robot_type returns error with valid alternatives."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch("subprocess.Popen")
    mocker.patch.object(server_mod, "_tron1_variants", return_value=["PF_TRON1A", "SF_TRON1A"])
    fake_model = mocker.MagicMock(spec=Path)
    fake_model.exists.return_value = False
    mocker.patch.object(server_mod, "_model_path_for", return_value=fake_model)

    result = await server_mod.start_sim(platform="tron1", robot_type="NONEXISTENT")
    assert result["success"] is False
    assert "not found" in result["message"].lower() or "NONEXISTENT" in result["message"]
    assert "valid_robot_types" in result


# ---------------------------------------------------------------------------
# stop_sim
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_stop_sim_unknown_job(mocker):
    """Unknown job_id returns error."""
    import limx_robotics_mcp.server as server_mod

    result = await server_mod.stop_sim(job_id="no-such-job")
    assert result["success"] is False
    assert "unknown job" in result["message"].lower()


# ---------------------------------------------------------------------------
# sim_jobs
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_sim_jobs_empty():
    """No jobs returns empty list."""
    import limx_robotics_mcp.server as server_mod

    result = await server_mod.sim_jobs()
    assert result["success"] is True
    assert result["jobs"] == []


# ---------------------------------------------------------------------------
# list_robot_variants
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_robot_variants_tron1(mocker):
    """tron1 variants discovered from mock directories."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch.object(server_mod, "_tron1_variants", return_value=["PF_TRON1A", "SF_TRON1A", "WF_TRON1A"])

    result = await server_mod.list_robot_variants(platform="tron1")
    assert result["success"] is True
    assert "PF_TRON1A" in result["variants"]


@pytest.mark.asyncio
async def test_list_robot_variants_oli(mocker):
    """oli variants discovered from mock directories."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch.object(server_mod, "_oli_variants", return_value=["HU_D03_03", "HU_D04_01"])

    result = await server_mod.list_robot_variants(platform="oli")
    assert result["success"] is True
    assert "HU_D04_01" in result["variants"]


# ---------------------------------------------------------------------------
# get_robot_description
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_robot_description_success(mocker, all_paths_exist, mock_rglob):
    """Mock file read, verify content returned."""
    import limx_robotics_mcp.server as server_mod

    mock_rglob("HU_D04_01.urdf", stem="HU_D04_01", suffix=".urdf", size=2048, content="<robot><link>...</link></robot>")
    mocker.patch("pathlib.Path.rglob", return_value=mock_rglob._make.__self__ if hasattr(mock_rglob, '_make') else [])

    # Re-patch rglob more directly
    fake_file = mocker.MagicMock(spec=Path)
    fake_file.name = "HU_D04_01.urdf"
    fake_file.stem = "HU_D04_01"
    fake_file.suffix = ".urdf"
    fake_file.__str__.return_value = "D:/fake/path/HU_D04_01.urdf"
    fake_file.stat.return_value.st_size = 2048
    fake_file.read_text.return_value = "<robot><link>...</link></robot>"
    mocker.patch("pathlib.Path.rglob", return_value=[fake_file])

    result = await server_mod.get_robot_description(platform="oli", variant="HU_D04_01", include_content=True)
    assert result["success"] is True
    assert result["format"] == "urdf"
    assert len(result["files"]) >= 1
    assert "content" in result


@pytest.mark.asyncio
async def test_get_robot_description_not_found(mocker):
    """Bad variant returns error with valid alternatives."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch.object(server_mod, "_oli_variants", return_value=["HU_D03_03", "HU_D04_01"])

    result = await server_mod.get_robot_description(platform="oli", variant="BAD_VARIANT")
    assert result["success"] is False
    assert "valid_variants" in result


# ---------------------------------------------------------------------------
# sim_status
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_sim_status_all_ready(mocker, all_paths_exist, mock_subprocess):
    """All repos exist, submodules populated, sim env OK."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch.object(server_mod, "_tron1_variants", return_value=["PF_TRON1A"])
    mocker.patch.object(server_mod, "_oli_variants", return_value=["HU_D04_01"])

    mock_run = mocker.MagicMock()
    mock_run.returncode = 0
    mock_run.stdout = "3.11 OK"
    mock_run.stderr = ""
    mocker.patch("subprocess.run", return_value=mock_run)

    result = await server_mod.sim_status()
    assert result["success"] is True
    assert result["ready"] is True


@pytest.mark.asyncio
async def test_sim_status_missing_repo(mocker, all_paths_exist):
    """One repo missing → ready=False."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch.object(server_mod, "_tron1_variants", return_value=["PF_TRON1A"])
    mocker.patch.object(server_mod, "_oli_variants", return_value=["HU_D04_01"])

    mock_run = mocker.MagicMock()
    mock_run.returncode = 0
    mock_run.stdout = "3.11 OK"
    mocker.patch("subprocess.run", return_value=mock_run)

    missing = mocker.MagicMock(spec=Path)
    missing.exists.return_value = False
    mocker.patch.object(server_mod, "TRON1_MUJOCO", missing)

    result = await server_mod.sim_status()
    assert result["success"] is True
    assert result["ready"] is False
    assert result["repos"]["tron1-mujoco-sim"] is False


@pytest.mark.asyncio
async def test_sim_status_bad_sim_python(mocker, all_paths_exist):
    """Sim interpreter not found → ready=False."""
    import limx_robotics_mcp.server as server_mod

    mocker.patch.object(server_mod, "_tron1_variants", return_value=["PF_TRON1A"])
    mocker.patch.object(server_mod, "_oli_variants", return_value=["HU_D04_01"])

    mock_run = mocker.MagicMock()
    mock_run.returncode = 0
    mocker.patch("subprocess.run", return_value=mock_run)

    bad_python = mocker.MagicMock(spec=Path)
    bad_python.exists.return_value = False
    mocker.patch.object(server_mod, "SIM_PYTHON", bad_python)

    result = await server_mod.sim_status()
    assert result["success"] is True
    assert result["ready"] is False
    assert result["sim_environment"]["exists"] is False
