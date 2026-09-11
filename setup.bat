@echo off
setlocal enabledelayedexpansion
title Quádralo - Instalador y Configurador Fullstack (Windows)
chcp 65001 > nul
cls

echo ================================================================
echo       🚀 QUÁDRALO - INSTALADOR Y CONFIGURADOR AUTOMÁTICO 🚀
echo                Tus finanzas siempre al día
echo ================================================================
echo.

REM 1. Verificar Python
echo [*] [1/5] Verificando instalación de Python...
set PYTHON_CMD=
where python >nul 2>nul
if %errorlevel% equ 0 (
    set PYTHON_CMD=python
) else (
    where py >nul 2>nul
    if %errorlevel% equ 0 (
        set PYTHON_CMD=py
    )
)

if "%PYTHON_CMD%"=="" (
    echo [!] ERROR: Python no fue encontrado en el PATH.
    echo     Por favor instala Python 3.10 o superior desde https://www.python.org/
    echo     y asegurate de marcar "Add Python to PATH".
    pause
    exit /b 1
)
%PYTHON_CMD% --version

REM 2. Verificar Node.js y NPM
echo.
echo [*] [2/5] Verificando instalación de Node.js y npm...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ERROR: Node.js no fue encontrado en el PATH.
    echo     Por favor instala Node.js 18 o superior desde https://nodejs.org/
    pause
    exit /b 1
)
node --version

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] ERROR: npm no fue encontrado en el PATH.
    pause
    exit /b 1
)
npm --version

REM 3. Configurar variables de entorno (.env)
echo.
echo [*] [3/5] Configurando archivos de variables de entorno (.env)...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [OK] Archivo backend\.env creado a partir de .env.example
    )
) else (
    echo [OK] Archivo backend\.env ya existe.
)

if not exist "frontend\.env.local" (
    if exist "frontend\.env.example" (
        copy "frontend\.env.example" "frontend\.env.local" >nul
        echo [OK] Archivo frontend\.env.local creado a partir de .env.example
    )
) else (
    echo [OK] Archivo frontend\.env.local ya existe.
)

REM 4. Entorno virtual de Python y dependencias
echo.
echo [*] [4/5] Configurando Backend (Python venv y dependencias)...
if not exist "backend\venv" (
    echo [*] Creando entorno virtual en backend\venv...
    %PYTHON_CMD% -m venv "backend\venv"
    if %errorlevel% neq 0 (
        echo [!] ERROR al crear el entorno virtual.
        pause
        exit /b 1
    )
    echo [OK] Entorno virtual creado.
) else (
    echo [OK] Entorno virtual backend\venv ya existe.
)

echo [*] Instalando dependencias de Python (requirements.txt)...
"backend\venv\Scripts\python.exe" -m pip install --upgrade pip >nul 2>nul
"backend\venv\Scripts\python.exe" -m pip install -r "backend\requirements.txt"
if %errorlevel% neq 0 (
    echo [!] ERROR instalando librerías de Python.
    pause
    exit /b 1
)
echo [OK] Dependencias de Python instaladas exitosamente.

REM 5. Crear Base de Datos y Tablas en MySQL
echo.
echo [*] [5/5] Inicializando Base de Datos MySQL y Tablas del Sistema...
"backend\venv\Scripts\python.exe" "backend\init_db.py"
if %errorlevel% neq 0 (
    echo.
    echo [!] ATENCIÓN: La base de datos no pudo inicializarse automáticamente.
    echo     Asegurate de que Laragon/MySQL esté iniciado (puerto 3307 o el configurado en backend\.env).
    echo.
)

REM 6. Dependencias Frontend
echo.
echo [*] Instalando dependencias de Node.js (Frontend y Raíz)...
call npm install
cd frontend
call npm install
cd ..
echo [OK] Dependencias de Frontend instaladas exitosamente.

echo.
echo ================================================================
echo       🎉 ¡INSTALACIÓN Y CONFIGURACIÓN COMPLETADA CON ÉXITO! 🎉
echo ================================================================
echo.
echo Para iniciar el sistema Quádralo puedes usar cualquiera de estos:
echo   1. Ejecutar start.bat
echo   2. Ejecutar "npm run dev"
echo   3. Ejecutar "python dev.py"
echo.
echo   * Frontend disponible en: http://localhost:3000
echo   * Backend disponible en:  http://127.0.0.1:8000
echo   * Documentación API en:   http://127.0.0.1:8000/docs
echo   * Frontend disponible en: http://localhost:3001
echo   * Backend disponible en:  http://127.0.0.1:8001
echo   * Documentación API en:   http://127.0.0.1:8001/docs
echo ================================================================
echo.
pause
