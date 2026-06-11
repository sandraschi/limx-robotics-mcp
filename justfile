# === Fleet-standard ===
bootstrap:
    pwsh -NoProfile -File ./setup-sim-env.ps1

serve:
    uv run python -m limx_robotics_mcp

lint:
    ruff check src/ web_sota/backend/

fix:
    ruff check --fix src/ web_sota/backend/

test:
    uv run pytest tests/ -q

e2e:
    cd web_sota && npx playwright test

web:
    pwsh -NoProfile -File ./web_sota/start.ps1

mcpb-pack:
    pwsh -NoProfile -File ./mcpb/pack.ps1

clean:
    pwsh -NoProfile -c "Remove-Item -Recurse -Force -Path dist,.venv,.venv-sim38,__pycache__ -ErrorAction SilentlyContinue"

# === Repo-specific ===
submodules:
    cd D:\Dev\repos\external\tron1-mujoco-sim && git submodule update --init --recursive
    cd D:\Dev\repos\external\humanoid-mujoco-sim && git submodule update --init --recursive

sim-env:
    pwsh -NoProfile -c "& 'D:\Dev\repos\limx-robotics-mcp\.venv-sim38\python.exe' -c 'import sys,mujoco,limxsdk; print(f\"Py{sys.version.split()[0]} mujoco{mujoco.__version__} SDK OK\")' 2>&1"

variants:
    uv run python -c "import sys; sys.path.insert(0,'src'); from limx_robotics_mcp.server import _tron1_variants, _oli_variants; print('TRON 1:', _tron1_variants()); print('Oli:', _oli_variants())"

policies:
    uv run python -c "from pathlib import Path; p = Path('D:/Dev/repos/external/tron1-rl-deploy-python/controllers'); print('Policies:', [d.name for d in p.iterdir()]) if p.exists() else print('no deploy repo')"