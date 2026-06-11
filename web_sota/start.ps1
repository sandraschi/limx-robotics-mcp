param([switch]$NoBrowser)
$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $PSCommandPath
$RepoRoot = Split-Path -Parent $ScriptRoot

Write-Host "Starting limx-robotics-mcp web dashboard..." -ForegroundColor Cyan

# Kill port zombies
Get-NetTCPConnection -LocalPort 11044 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Get-NetTCPConnection -LocalPort 11045 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# Start backend (FastAPI + MCP HTTP)
$BackendJob = Start-Job -Name "backend" -ScriptBlock {
    param($Root)
    Set-Location $Root
    $env:PYTHONPATH = "$Root\src"
    C:\Users\sandr\.local\bin\uv.exe run uvicorn web_sota.backend.server:app --host 127.0.0.1 --port 11044 --log-level warning
} -ArgumentList $RepoRoot

# Wait for backend
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:11044/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { Write-Host "Backend ready on :11044" -ForegroundColor Green; break }
    } catch {}
    Start-Sleep 1
}

# Start frontend (Vite)
Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "vite --port 11045 --host" -WorkingDirectory $ScriptRoot

# Wait for frontend
for ($i = 0; $i -lt 30; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:11045" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($r.StatusCode -eq 200) { Write-Host "Frontend ready on :11045" -ForegroundColor Green; break }
    } catch {}
    Start-Sleep 1
}

# Open browser
if (-not $NoBrowser) { Start-Process "http://127.0.0.1:11045" }

# Keep-alive
while ($true) {
    if ($BackendJob.State -eq "Completed" -or $BackendJob.State -eq "Failed") {
        Receive-Job $BackendJob; break
    }
    Start-Sleep 2
}
