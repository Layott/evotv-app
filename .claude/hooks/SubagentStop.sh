#!/usr/bin/env bash
# Layer 3 — Hook: SubagentStop
# Fires when a delegated subagent returns. Appends a line to the subagent log.

set -eu

log_dir="$(dirname "$0")/../audit"
mkdir -p "$log_dir"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

payload="$(cat)"
name=$(printf '%s' "$payload" | sed -n 's/.*"subagent_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)

printf '%s\tsubagent\t%s\n' "$ts" "${name:-unknown}" >> "$log_dir/tool-use.log" || true

exit 0
