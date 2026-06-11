$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSCommandPath
$ConfigPath = "$env:USERPROFILE\.cursor\mcp.json"

$entry = @{
    "command" = "uv"
    "args" = @("run", "--directory", $RepoRoot, "python", "-m", "limx_robotics_mcp")
}

$config = @{}
if (Test-Path $ConfigPath) {
    $config = Get-Content $ConfigPath -Raw | ConvertFrom-Json -AsHashtable
}
$config["limx-robotics-mcp"] = $entry

$dir = Split-Path -Parent $ConfigPath
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$config | ConvertTo-Json -Depth 4 | Set-Content $ConfigPath -Encoding UTF8
Write-Host "Installed limx-robotics-mcp to Cursor MCP config." -ForegroundColor Green
