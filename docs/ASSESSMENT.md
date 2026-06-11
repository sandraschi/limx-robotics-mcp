# limx-robotics-mcp — Post-Fix Assessment

**Date:** 2026-06-11 | **Version:** 0.2.0 | **Status:** Functional core, pre-git, pre-fleet-standards

## Summary

Rebuilt from the initial one-session skeleton (0.1.0) into a working server. All P1 bugs
from the initial assessment are fixed; the simulation runner was redesigned from a broken
blocking pattern to a managed job model. The major discovery during the fix was that the
LimX Windows SDK wheels are Python 3.8-only despite their `py3-none-any` tag, forcing a
split-interpreter architecture.

## Fixed (was P1)

| Issue | Resolution |
|---|---|
| Console-script ImportError (`limx_robotics_mcp:main` vs empty `__init__.py`) | `__init__.py` re-exports `main`; pyproject points to `limx_robotics_mcp.server:main` |
| `get_robot_description` looked for nonexistent `oli`/`tron1` dirs | Correct mapping: oli → `HU_D03/HU_D04_description`, tron1 → `tron1-mujoco-sim/robot-description/pointfoot/{variant}`; content opt-in, 200 KB cap |
| Submodules uninitialized (empty `limxsdk-lowlevel`, `robot-description`, etc.) | `git submodule update --init --recursive` run in both sim repos |
| `ROBOT_TYPE` never set → simulator exits immediately | Per-job env injection; variants validated against disk before launch, invalid input returns the valid list |
| Wrong script model (`stand.py`/`walk.py` fiction) | Single upstream `simulator.py` per platform; `list_sim_scripts` replaced by `list_robot_variants` |

## Redesigned (was P2)

- **Blocking 120 s `subprocess.run` → job manager.** `start_sim`/`stop_sim`/`sim_jobs` with
  Popen, per-job log files (`logs/`, override `LIMX_LOG_DIR`), 2 s fail-fast poll with log
  tail on immediate exit. The upstream simulator is a GUI MuJoCo viewer running until
  closed — the old design could never have returned success.
- **`uv run` in dependency-less external repos → explicit interpreters.** Sims launch under
  a dedicated interpreter (`LIMX_SIM_PYTHON`).
- **Hardcoded external path → `LIMX_EXTERNAL_DIR`** (default `D:/Dev/repos/external`).

## Key finding: split-interpreter requirement

The Windows limxsdk wheels (3.4.0 and 3.4.2) contain a `_robot.pyd` linked against
**python38.dll**, mislabeled `py3-none-any`. FastMCP 3.2 requires ≥3.11. Therefore:

- **Server venv:** `.venv`, Python 3.12.9 (3.13 also ruled out by limxsdk's numpy 1.26.3 pin)
- **Sim venv:** `.venv-sim38`, Python 3.8.20 + mujoco 3.1.6 (last cp38 release) +
  numpy 1.24.4 + limxsdk 3.4.2 installed `--no-deps` (its numpy pin doesn't exist for 3.8;
  the pyd has no numpy linkage, verified by import-table scan)

Verified: `mujoco`, `limxsdk.robot.Robot`, `limxsdk.datatypes` all import cleanly under 3.8.
`sim_status` probes the sim env via subprocess and reports `ready`.

Secondary finding: tron1 pins limxsdk 3.4.0-win, humanoid pins 3.4.2-win; both target
python38.dll; 3.4.2 used for both. The upstream tron1 simulator only loads pointfoot
models — wheellegged (`WL_*`) descriptions exist on disk but are unreachable through
`simulator.py`.

## Current tool surface (6)

`start_sim`, `stop_sim`, `sim_jobs`, `list_robot_variants`, `get_robot_description`, `sim_status`

## Verified / not verified

- ✅ Server venv builds, `uv sync` clean, server module imports, tools registered
- ✅ Sim venv imports mujoco + limxsdk under 3.8
- ✅ Submodules populated; variant discovery returns 11 pointfoot + HU_D03_03/HU_D04_01
- ❌ **End-to-end sim launch not yet exercised** (GUI viewer; needs an interactive session
  with the MCP server actually running in Claude Desktop)
- ❌ No automated tests

## Remaining gaps (priority order)

1. **P1 — git init + initial commit + GitHub repo** (`sandraschi/limx-robotics-mcp`); repo
   currently has no `.git`. Clean stray `.bak` files first.
2. **P1 — end-to-end smoke test:** add server to claude_desktop_config, run
   `sim_status` → `start_sim(tron1, PF_TRON1A)` → viewer opens → `stop_sim`.
3. **P2 — test suite** (job manager unit tests with a fake long-running process; variant
   discovery against fixture trees).
4. **P2 — fleet standards:** AGENTS.md/CLAUDE.md, mcpb manifest + pack, FLEET_INDEX entry.
5. **P3 — RL workstream:** six cloned repos (`tron1-rl-isaacgym/-isaaclab`,
   `*-rl-deploy-python/ros2`) have no tools. Isaac Gym/Lab on Windows is a separate
   dependency saga — scope as its own milestone, possibly WSL2-based.
6. **P3 — control beyond stand:** upstream `simulator.py` is physics + viewer + SDK bridge;
   actual gaits need the rl-deploy controllers connected. Currently `start_sim` gives a
   standing robot in a viewer, nothing more. Be honest about this in any demo.

## Timeline estimate (AI-assisted)

Items 1–2: same session. Items 3–4: one day. Item 5: 2–3 days if WSL2 is needed.

---

## Update 2026-06-12 (post OpenCode pass)

Pushed to GitHub (main). Tool surface grew 6 -> 14: OpenCode added the fleet
AI-tool template (agentic_sim_workflow, natural_language_control,
analyze_sim_state, analyze_sim_logs, discover_model) plus
`export_model_for_fleet`, `list_policies`, `run_deployed_policy`. The
job-manager core from the 0.2.0 rebuild is intact. Now registered in the
robotics-fleet architecture (ports 11044/11045) and FLEET_INDEX.

**Unverified:** `run_deployed_policy` � RL deploy repos have their own deps
and the Py3.8 sim constraint question is unresolved for policy inference;
needs one real session. Port 11045 frontend is registry-aspirational (no
web_sota in this repo yet). hatchling packaging added (launch via
`uv run python -m` now works).
