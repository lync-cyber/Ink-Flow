#!/usr/bin/env bash
# wx-md launcher (macOS / Linux)
# 首次运行：cd app && npm install && npm run build
# 之后运行：node serve.mjs -> 127.0.0.1:7788 -> 自动开浏览器
#
# macOS first double-click may be blocked by Gatekeeper. Unblock:
#   xattr -d com.apple.quarantine framework/tools/typeset/launcher.command
# or Finder right-click -> Open -> Open anyway

set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
    echo
    echo "[!] Node.js not found. Install Node 18+ from https://nodejs.org/"
    echo
    read -rp "Press Enter to close..." _
    exit 1
fi

if [ ! -f "app/dist/index.html" ]; then
    echo
    echo "[i] First run detected. Installing dependencies and building wx-md..."
    echo
    (cd app && npm install && npm run build) || {
        echo
        echo "[!] Install or build failed. See errors above."
        read -rp "Press Enter to close..." _
        exit 1
    }
fi

node serve.mjs
