@echo off
title RYLON
setlocal

if not exist "node_modules\" (
    echo [RYLON] Installing dependencies...
    npm install --silent
    if errorlevel 1 ( echo [RYLON] Install failed. & pause & exit /b 1 )
)

cls
node --import tsx/esm index.jsx

echo.
echo [RYLON] Exited.
pause > nul