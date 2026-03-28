#!/usr/bin/env bash
# Blocks non-bun package managers and their runners — this project uses bun.
set -euo pipefail

cmd="$CLAUDE_TOOL_INPUT_COMMAND"

if echo "$cmd" | grep -qE "^(npm|yarn|pnpm|deno)( |$)"; then
  echo "ERROR: Use bun instead of npm/yarn/pnpm/deno." >&2
  exit 1
fi

if echo "$cmd" | grep -qE "^(npx|pnpx|pnpm dlx|yarn dlx|deno run)( |$)"; then
  echo "ERROR: Use 'bunx' instead of npx/pnpx/yarn dlx/pnpm dlx/deno run." >&2
  exit 1
fi
