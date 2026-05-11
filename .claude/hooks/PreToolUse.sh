#!/usr/bin/env bash
# Layer 3 — Hook: PreToolUse
# Inspects every tool call before it runs. exit 2 blocks the call.

set -eu

# Claude Code passes the tool name + payload via stdin as JSON.
payload="$(cat)"

# Extract tool name + command (best-effort; jq is not guaranteed on Windows).
tool=$(printf '%s' "$payload" | sed -n 's/.*"tool_name":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)
cmd=$(printf '%s' "$payload" | sed -n 's/.*"command":[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)

block() {
  echo "BLOCKED: $1" >&2
  exit 2
}

case "$tool" in
  Bash|PowerShell)
    # Destructive deletions.
    case "$cmd" in
      *"rm -rf /"*|*"rm -rf ~"*|*"rm -rf ."*|*"Remove-Item -Recurse -Force"*"\\"*)
        block "destructive rm/Remove-Item — confirm with user first"
        ;;
    esac
    # Force-push to main or master.
    case "$cmd" in
      *"git push --force"*main*|*"git push --force"*master*|*"git push -f"*main*|*"git push -f"*master*)
        block "force-push to main/master — confirm with user first"
        ;;
    esac
    # Bypass hooks / signing.
    case "$cmd" in
      *"--no-verify"*|*"--no-gpg-sign"*)
        block "hook/signing bypass — confirm with user first"
        ;;
    esac
    # Don't let agents wipe node_modules or .expo without explicit ask.
    case "$cmd" in
      *"rm -rf node_modules"*|*"rm -rf .expo"*|*"rm -rf dist"*)
        block "wiping build state — confirm with user first"
        ;;
    esac
    ;;
esac

exit 0
