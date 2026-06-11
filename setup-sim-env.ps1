param([switch]$Force)
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSCommandPath
$SimVenv = Join-Path $RepoRoot ".venv-sim38"
$SimPython = Join-Path $SimVenv "python.exe"

# Determine best SDK wheel
$ExternalRoot = "D:\Dev\repos\external"
$WheelCandidates = @(
    ,(Join-Path $ExternalRoot "limxsdk-lowlevel" "python3" "win" "limxsdk-3.4.2-py3-none-any.whl")
    ,(Join-Path $ExternalRoot "tron1-mujoco-sim" "limxsdk-lowlevel" "python3" "win" "limxsdk-3.4.0-py3-none-any.whl")
)
$SdkWheel = $null
foreach ($w in $WheelCandidates) {
    if (Test-Path $w) { $SdkWheel = $w; break }
}
if (-not $SdkWheel) { Write-Host "ERROR: No limxsdk wheel found." -ForegroundColor Red; exit 1 }

if ((Test-Path $SimVenv) -and -not $Force) {
    Write-Host "Sim env exists at $SimVenv (use -Force to recreate)" -ForegroundColor Yellow
    exit 0
}

# 1. Download embeddable Python 3.8
$PyUrl = "https://www.python.org/ftp/python/3.8.10/python-3.8.10-embed-amd64.zip"
$PyZip = Join-Path $env:TEMP "python-3.8.10-embed-amd64.zip"
Write-Host "[1/5] Downloading Python 3.8.10 embeddable..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $PyUrl -OutFile $PyZip -UseBasicParsing

# 2. Extract
Write-Host "[2/5] Extracting to $SimVenv..." -ForegroundColor Cyan
if (Test-Path $SimVenv) { Remove-Item -Recurse -Force $SimVenv }
Expand-Archive -Path $PyZip -DestinationPath $SimVenv

# 3. Enable site-packages
$PthFile = Join-Path $SimVenv "python38._pth"
(Get-Content $PthFile) -replace '#import site', 'import site' | Set-Content $PthFile
Write-Host "       site-packages enabled"

# 4. Install pip
Write-Host "[3/5] Installing pip..." -ForegroundColor Cyan
$GetPip = Join-Path $env:TEMP "get-pip-38.py"
Invoke-WebRequest -Uri "https://bootstrap.pypa.io/pip/3.8/get-pip.py" -OutFile $GetPip -UseBasicParsing
& $SimPython $GetPip --no-warn-script-location 2>&1 | Out-Null

# 5. Install mujoco + numpy
Write-Host "[4/5] Installing mujoco + numpy..." -ForegroundColor Cyan
& $SimPython -m pip install "mujoco<3.2" numpy 2>&1 | Out-Null

# 6. Install limxsdk
Write-Host "[5/5] Installing limxsdk SDK wheel..." -ForegroundColor Cyan
& $SimPython -m pip install $SdkWheel --no-deps 2>&1 | Out-Null

# Verify
Write-Host "`nVerifying..." -ForegroundColor Cyan
$result = & $SimPython -c "import sys; import mujoco; import limxsdk.robot.Robot; print(f'Python {sys.version.split()[0]} + mujoco {mujoco.__version__} + limxsdk OK')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: $result" -ForegroundColor Green
} else {
    Write-Host "FAILED: $result" -ForegroundColor Red; exit 1
}
