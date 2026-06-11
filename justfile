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

submodules:
    cd D:\Dev\repos\external\tron1-mujoco-sim && git submodule update --init --recursive
    cd D:\Dev\repos\external\humanoid-mujoco-sim && git submodule update --init --recursive

clean:
    pwsh -NoProfile -c "Remove-Item -Recurse -Force -Path dist,.venv,.venv-sim38,__pycache__ -ErrorAction SilentlyContinue"
