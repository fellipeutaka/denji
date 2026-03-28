#!/usr/bin/env bash
# Blocks destructive git commands that are hard to reverse.
set -euo pipefail

cmd="$CLAUDE_TOOL_INPUT_COMMAND"

if echo "$cmd" | grep -qE "git push --force|git push -f|git reset --hard"; then
  echo "ERROR: Dangerous git command blocked. Ask the user to run this manually if truly needed." >&2
  exit 1
fi
