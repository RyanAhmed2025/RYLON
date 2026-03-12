@echo off
echo.
echo  ==========================================
echo   RYLON CLI — Setup ^& Launch
echo  ==========================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js not found.
  echo  Download it at: https://nodejs.org
  echo  Then re-run this script.
  pause
  exit /b 1
)

echo  Node.js found:
node -v
echo.

if not exist "node_modules" (
  echo  Installing dependencies...
  call npm install
  echo.
)

echo  Starting RYLON CLI at http://localhost:3000
echo  Press Ctrl+C to stop.
echo.
call npm run dev
pause
