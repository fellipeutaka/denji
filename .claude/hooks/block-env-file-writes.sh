#!/usr/bin/env bash
# Blocks writes/edits to .env files to prevent accidental secret exposure.
set -euo pipefail

# Works for both Write (FILE_PATH) and Edit (FILE_PATH) tool inputs.
path="${CLAUDE_TOOL_INPUT_FILE_PATH:-}"

if echo "$path" | grep -qE "\.env$|\.env\."; then
  echo "ERROR: Writing to .env files is blocked. Handle secrets manually." >&2
  exit 1
fi
