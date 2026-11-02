#!/usr/bin/env bash
# PostToolUse hook (Edit|Write): format the edited file with the project's
# local Prettier. Skips (exit 0) are silent. Real failures exit 1 with a
# one-line stderr message, which Claude Code treats as non-blocking.

fail() {
  printf 'format-on-edit: %s\n' "$*" >&2
  exit 1
}

# Repo root comes from this script's location, not from CLAUDE_PROJECT_DIR,
# so it still works when that variable is unset or wrong.
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd -P) ||
  fail "cannot resolve script directory"
root=$(cd "$script_dir/../.." 2>/dev/null && pwd -P) ||
  fail "cannot resolve repository root"
[ -f "$root/package.json" ] || fail "no package.json in resolved root: $root"

prettier="$root/node_modules/.bin/prettier"
[ -x "$prettier" ] || fail "local prettier not found or not executable: $prettier"

command -v jq >/dev/null 2>&1 || fail "jq is required but not installed"

file=$(jq -r '.tool_input.file_path // empty' 2>/dev/null) ||
  fail "could not parse hook input as JSON"

# Nothing to do.
[ -n "$file" ] || exit 0
case "$file" in /*) ;; *) exit 0 ;; esac  # docs: paths are absolute; skip otherwise
case "$file" in *$'\n'* | *$'\r'*) exit 0 ;; esac  # no control chars in paths
[ -f "$file" ] || exit 0                  # missing or not a regular file
[ ! -L "$file" ] || exit 0                # never write through a symlink

# Normalize: resolve "." / ".." segments and symlinked directories physically
# (cd + pwd -P), then rebuild the path from the canonical directory and basename.
base=$(basename -- "$file")
case "$base" in . | ..) exit 0 ;; esac
dir=$(cd -- "$(dirname -- "$file")" 2>/dev/null && pwd -P) || exit 0
resolved="$dir/$base"

# Confirm containment on the normalized path. The trailing slash in "$root"/*
# rejects sibling prefixes such as /path/repo-evil/x.ts.
case "$resolved" in
  "$root"/*) ;;
  *) exit 0 ;;
esac

# Re-verify the canonical target before anything is written to it.
[ -f "$resolved" ] && [ ! -L "$resolved" ] || exit 0

rel=${resolved#"$root"/}
case "$rel" in
  node_modules/* | dist/* | .git/* | .playwright-mcp/*) exit 0 ;;
esac

# Supported extensions only (same set as the lint-staged globs).
ext=$(printf '%s' "${resolved##*.}" | tr '[:upper:]' '[:lower:]')
case "$ext" in
  ts | tsx | js | jsx | css | scss | html | json | md | mdx) ;;
  *) exit 0 ;;
esac

# Format only this file. Config (.prettierrc) is resolved from the file's location.
cd "$root" || fail "cannot cd to $root"
if ! out=$("$prettier" --log-level warn --write -- "$resolved" 2>&1); then
  first=$(printf '%s\n' "$out" | head -n 1)
  fail "prettier failed on $rel: $first"
fi
exit 0
