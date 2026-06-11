@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0web_sota\start.ps1" %*
