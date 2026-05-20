#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$REPO_ROOT/infra/docker/docker-compose.sonarqube.yml"
PROJECT_NAME="sagelms-sonarqube"

usage() {
  cat <<'EOF'
Usage: scripts/dev/sonarqube.sh <start|stop|restart|logs|status|reset|url>

Environment overrides:
  SONARQUBE_PORT=9000
  SONARQUBE_DB_NAME=sonarqube
  SONARQUBE_DB_USER=sonar
  SONARQUBE_DB_PASSWORD=sonar

Open in browser:
  http://localhost:9000
EOF
}

ensure_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker is not installed or not available in PATH." >&2
    exit 1
  fi
}

compose() {
  docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" "$@"
}

cmd="${1:-start}"

case "$cmd" in
  start)
    ensure_docker
    compose up -d
    echo
    echo "SonarQube is starting."
    echo "URL: http://localhost:9000"
    echo "Login: admin / admin (change password on first login)"
    ;;
  stop)
    ensure_docker
    compose down
    ;;
  restart)
    ensure_docker
    compose down
    compose up -d
    ;;
  logs)
    ensure_docker
    compose logs -f --tail=200
    ;;
  status)
    ensure_docker
    compose ps
    ;;
  reset)
    ensure_docker
    compose down -v
    echo "SonarQube containers and volumes removed."
    ;;
  url)
    echo "http://localhost:9000"
    ;;
  help|-h|--help)
    usage
    ;;
  *)
    usage
    exit 1
    ;;
esac