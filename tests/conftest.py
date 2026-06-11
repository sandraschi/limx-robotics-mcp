import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))


@pytest.fixture
def mock_subprocess(mocker):
    """Mock subprocess.Popen to return a fake process."""
    mock_proc = mocker.MagicMock()
    mock_proc.poll.return_value = None
    mock_proc.pid = 12345
    mock_proc.returncode = 0
    mock_proc.communicate.return_value = (b"mock output", b"")
    mocker.patch("subprocess.Popen", return_value=mock_proc)
    return mock_proc


@pytest.fixture(autouse=True)
def clear_jobs():
    """Clear the global JOBS dict before each test."""
    import limx_robotics_mcp.server as server_mod

    server_mod.JOBS.clear()
    yield
    server_mod.JOBS.clear()
