@echo off
chcp 65001 >nul
setlocal

REM wx-md launcher (Windows)
REM 首次运行：cd app && npm install && npm run build
REM 之后运行：node serve.mjs -> 127.0.0.1:7788 -> 自动开浏览器

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo [!] Node.js not found. Install Node 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "app\dist\index.html" (
    echo.
    echo [i] First run detected. Installing dependencies and building wx-md...
    echo.
    pushd app
    call npm install
    if errorlevel 1 (
        echo.
        echo [!] npm install failed. See errors above.
        popd
        pause
        exit /b 1
    )
    call npm run build
    if errorlevel 1 (
        echo.
        echo [!] npm run build failed. See errors above.
        popd
        pause
        exit /b 1
    )
    popd
)

node "serve.mjs"
pause
