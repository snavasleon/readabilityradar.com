@echo off
setlocal
cd /d "%~dp0"
set "LOCAL_NODE=%~dp0runtime\node.exe"
if exist "%LOCAL_NODE%" (
  "%LOCAL_NODE%" server.mjs --open
  pause
  exit /b %errorlevel%
)
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo The bundled runtime was not found, and Node.js is not available on this computer.
  echo Use the Windows portable version or install Node.js 18 or newer from https://nodejs.org/.
  echo.
  pause
  exit /b 1
)
node server.mjs --open
pause
