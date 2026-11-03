#!/usr/bin/env bash
# Stop hook: show a macOS notification when Claude finishes responding.
# Best effort only: every path exits 0. Never exit 2 here, because on Stop
# that sends Claude back to work. Skips (non-macOS, no osascript) are silent.

[ "$(uname -s)" = "Darwin" ] || exit 0
command -v osascript >/dev/null 2>&1 || exit 0

# Project name from the payload's cwd; fall back to this repo's root.
cwd=""
if command -v jq >/dev/null 2>&1; then
  cwd=$(jq -r '.cwd // empty' 2>/dev/null)
fi
if [ -z "$cwd" ]; then
  script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P) || exit 0
  cwd=$(cd "$script_dir/../.." 2>/dev/null && pwd -P) || exit 0
fi
name=$(basename -- "$cwd")
[ -n "$name" ] || name="project"

# Text is passed as argv, never spliced into the AppleScript source.
osascript - "Finished in $name" >/dev/null 2>&1 <<'APPLESCRIPT' || true
on run argv
  display notification (item 1 of argv) with title "Claude Code" sound name "Glass"
end run
APPLESCRIPT
exit 0
