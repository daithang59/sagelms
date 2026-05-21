#!/usr/bin/env bash
set -euo pipefail

RUNNER_HOME="${RUNNER_HOME:-$HOME/.sagelms/gha-runner}"
RUNNER_URL="${RUNNER_URL:-}"
RUNNER_TOKEN="${RUNNER_TOKEN:-}"
RUNNER_REMOVE_TOKEN="${RUNNER_REMOVE_TOKEN:-$RUNNER_TOKEN}"
RUNNER_NAME="${RUNNER_NAME:-$(hostname)-runner}"
RUNNER_LABELS="${RUNNER_LABELS:-self-hosted,devsecops}"
RUNNER_WORKDIR="${RUNNER_WORKDIR:-_work}"
RUNNER_GROUP="${RUNNER_GROUP:-}"
RUNNER_API='https://api.github.com/repos/actions/runner/releases/latest'

usage() {
  cat <<'EOF'
Usage: scripts/dev/github-runner.sh <setup|run|remove|status|help>

Environment variables:
  RUNNER_URL         Repo or org URL, e.g. https://github.com/owner/repo
  RUNNER_TOKEN       Registration token from GitHub Actions > Runners
  RUNNER_REMOVE_TOKEN Removal token (optional, for unregister)
  RUNNER_HOME        Runner install dir (default: ~/.sagelms/gha-runner)
  RUNNER_NAME        Runner name (default: <hostname>-runner)
  RUNNER_LABELS      Comma-separated labels (default: self-hosted,devsecops)
  RUNNER_WORKDIR     Work directory (default: _work)
  RUNNER_GROUP       Optional runner group

Example:
  export RUNNER_URL='https://github.com/daithang59/sagelms'
  export RUNNER_TOKEN='<registration-token-from-GitHub>'
  scripts/dev/github-runner.sh setup
  scripts/dev/github-runner.sh run
EOF
}

ensure_deps() {
  command -v curl >/dev/null 2>&1 || { echo 'ERROR: curl is required.' >&2; exit 1; }
  command -v tar >/dev/null 2>&1 || { echo 'ERROR: tar is required.' >&2; exit 1; }
}

download_runner() {
  mkdir -p "$RUNNER_HOME"
  if [[ -f "$RUNNER_HOME/run.sh" ]]; then
    return
  fi

  local version asset_name asset_url tmp_archive
  version="$(curl -fsSL -H 'User-Agent: SageLMS-Runner-Bootstrap' "$RUNNER_API" | grep -o '"tag_name": *"[^"]*"' | head -n1 | sed -E 's/.*"v?([^"]*)"/\1/')"
  asset_name="actions-runner-linux-x64-${version}.tar.gz"
  asset_url="$(curl -fsSL -H 'User-Agent: SageLMS-Runner-Bootstrap' "$RUNNER_API" | grep -o '"browser_download_url": *"[^"]*' | grep "${asset_name}" | head -n1 | sed -E 's/"browser_download_url": *"([^"]*)/\1/')"

  if [[ -z "$asset_url" ]]; then
    echo 'ERROR: could not resolve the latest Linux runner asset URL.' >&2
    exit 1
  fi

  tmp_archive="$(mktemp)"
  echo "Downloading runner ${version}..."
  curl -fsSL "$asset_url" -o "$tmp_archive"
  tar -xzf "$tmp_archive" -C "$RUNNER_HOME"
  rm -f "$tmp_archive"
}

ensure_configured() {
  [[ -f "$RUNNER_HOME/.runner" ]] || { echo 'ERROR: runner is not configured yet. Run setup first.' >&2; exit 1; }
}

setup_runner() {
  [[ -n "$RUNNER_URL" ]] || { echo 'ERROR: RUNNER_URL is required for setup.' >&2; exit 1; }
  [[ -n "$RUNNER_TOKEN" ]] || { echo 'ERROR: RUNNER_TOKEN is required for setup.' >&2; exit 1; }

  download_runner
  pushd "$RUNNER_HOME" >/dev/null
  local args=(--unattended --url "$RUNNER_URL" --token "$RUNNER_TOKEN" --name "$RUNNER_NAME" --labels "$RUNNER_LABELS" --work "$RUNNER_WORKDIR" --replace)
  if [[ -n "$RUNNER_GROUP" ]]; then
    args+=(--runnergroup "$RUNNER_GROUP")
  fi
  ./config.sh "${args[@]}"
  popd >/dev/null
}

run_runner() {
  ensure_configured
  pushd "$RUNNER_HOME" >/dev/null
  ./run.sh
  popd >/dev/null
}

remove_runner() {
  [[ -n "$RUNNER_REMOVE_TOKEN" ]] || { echo 'ERROR: RUNNER_REMOVE_TOKEN or RUNNER_TOKEN is required to remove the runner.' >&2; exit 1; }
  pushd "$RUNNER_HOME" >/dev/null
  ./config.sh remove --unattended --token "$RUNNER_REMOVE_TOKEN"
  popd >/dev/null
}

status_runner() {
  echo "Runner home: $RUNNER_HOME"
  echo "Runner URL:  $RUNNER_URL"
  echo "Configured:   $( [[ -f "$RUNNER_HOME/.runner" ]] && echo true || echo false )"
}

cmd="${1:-setup}"
case "$cmd" in
  setup) ensure_deps; setup_runner ;;
  run) ensure_deps; run_runner ;;
  remove) ensure_deps; remove_runner ;;
  status) status_runner ;;
  help|-h|--help) usage ;;
  *) usage; exit 1 ;;
esac