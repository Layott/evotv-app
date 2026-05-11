#!/usr/bin/env bash
# Layer 3 — Hook: PostToolUse
# Audit log after every tool call. Append-only, never fails the call.

set -eu

log_dir="$(dirname "$0")/../audit"
mkdir -p "$log_dir"
ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Read payload (Claude passes JSON on stdin).
payload="$(cat)"
tool=$(printf '%s' "$payload" | sed -n 's/.*"tool_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)

# Single-line audit entry.
printf '%s\t%s\n' "$ts" "$tool" >> "$log_dir/tool-use.log" || true

exit 0
