#!/usr/bin/env bash
# InkFlow local typeset launcher (macOS / Linux)
# Double-click -> starts 127.0.0.1:7788 static server -> auto opens browser
# First run auto-bootstraps doocs/md via node framework/tools/typeset/setup.mjs
#
# macOS first double-click may be blocked by Gatekeeper. Unblock:
#   xattr -d com.apple.quarantine framework/tools/typeset.command
# or Finder right-click -> Open -> Open anyway

set -e
cd "$(dirname "$0")/../.."

if ! command -v node >/dev/null 2>&1; then
    echo
    echo "[!] Node.js not found. Install Node 18+ from https://nodejs.org/"
    echo
    read -rp "Press Enter to close..." _
    exit 1
fi

if [ ! -f "framework/tools/typeset/dist/doocs/index.html" ]; then
    echo
    echo "[i] First run detected. Initializing doocs/md (Docker image extract, ~30-60s)..."
    echo
    node "framework/tools/typeset/setup.mjs" || {
        echo
        echo "[!] Setup failed. See errors above."
        read -rp "Press Enter to close..." _
        exit 1
    }
fi

node "framework/tools/typeset/serve.mjs"
