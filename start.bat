@echo off
title ADATOV - Launcher Fullstack
chcp 65001 > nul
cls

echo ========================================================
echo         🚀 ADATOV - INICIANDO SISTEMA COMPLETO 🚀
echo ========================================================
echo.
echo [1/2] Backend:  FastAPI en http://127.0.0.1:8000
echo [2/2] Frontend: Next.js en http://localhost:3000
echo.
echo Presiona Ctrl+C en cualquier momento para detener los servicios.
echo --------------------------------------------------------
echo.

npm run dev

pause
