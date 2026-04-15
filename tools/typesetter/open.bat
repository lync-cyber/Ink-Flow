@echo off
setlocal
cd /d "%~dp0"

set "PORT=51731"
set "URL=http://127.0.0.1:%PORT%/index.html"

where py >nul 2>nul
if not errorlevel 1 (
  start "wechat-typesetter-server" cmd /c "cd /d ""%~dp0"" && py -3 -m http.server %PORT% --bind 127.0.0.1"
  timeout /t 1 >nul
  start "" "%URL%"
  goto :eof
)

where python >nul 2>nul
if not errorlevel 1 (
  start "wechat-typesetter-server" cmd /c "cd /d ""%~dp0"" && python -m http.server %PORT% --bind 127.0.0.1"
  timeout /t 1 >nul
  start "" "%URL%"
  goto :eof
)

echo [wechat-typesetter] 未检测到 Python，回退为直接打开 index.html
echo [wechat-typesetter] 若页面空白，请安装 Python 后重试 open.bat
start "" "%~dp0index.html"
