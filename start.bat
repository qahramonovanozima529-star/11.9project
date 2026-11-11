@echo off
title Numeo Logistics Launcher
echo ====================================================
echo    NUMEO LOGISTICS PLATFORM ISHGA TUSHIRILMOQDA...
echo ====================================================
echo.

echo 1. Backend server ishga tushirilmoqda (Port: 5000)...
start "Numeo Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo 2. Frontend server ishga tushirilmoqda (Port: 5173)...
start "Numeo Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ====================================================
echo   Ikkala server alohida oynada ochildi!
echo   Brauzerda: http://localhost:5173 ni oching.
echo ====================================================
pause

