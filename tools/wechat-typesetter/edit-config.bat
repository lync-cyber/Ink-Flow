@echo off
setlocal
cd /d "%~dp0"
if not exist "element-config.json" (
  echo [wechat-typesetter] element-config.json 不存在，正在创建空文件...
  echo {}> "element-config.json"
)
start "" notepad.exe "%~dp0element-config.json"
