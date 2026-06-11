bootstrap:
    pwsh -NoProfile -File ./setup-sim-env.ps1

serve:
    uv run python -m limx_robotics_mcp

lint:
    ruff check src/

fix:
    ruff check --fix src/

submodules:
    cd D:\Dev\repos\external\tron1-mujoco-sim && git submodule update --init --recursive
    cd D:\Dev\repos\external\humanoid-mujoco-sim && git submodule update --init --recursive

status:
    pwsh -NoProfile -c "uv run --directory . python -c "import sys; sys.path.insert(0, 'src'); from limx_robotics_mcp.server import mcp; print(f'Server: {mcp.name}')""
