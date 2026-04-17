@echo off
chcp 65001 >nul
setlocal

REM InkFlow local typeset launcher (Windows)
REM Double-click -> starts 127.0.0.1:7788 static server -> auto opens browser
REM First run auto-bootstraps doocs/md via node framework/tools/typeset/setup.mjs

cd /d "%~dp0..\.."

where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo [!] Node.js not found. Install Node 18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

if not exist "framework\tools\typeset\dist\doocs\index.html" (
    echo.
    echo [i] First run detected. Initializing doocs/md (Docker image extract, ~30-60s)...
    echo.
    node "framework\tools\typeset\setup.mjs"
    if errorlevel 1 (
        echo.
        echo [!] Setup failed. See errors above.
        pause
        exit /b 1
    )
)

node "framework\tools\typeset\serve.mjs"
pause
