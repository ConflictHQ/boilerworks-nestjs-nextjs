#!/usr/bin/env bash
set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}→${NC} $1"; }
ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
die()   { echo -e "${RED}✗${NC} $1" >&2; exit 1; }

COMPOSE="docker compose -f docker/docker-compose.yaml"

_require_running() {
  local status
  status=$($COMPOSE ps 2>&1) || true
  if ! echo "$status" | grep -q "Up"; then
    die "Stack not running. Run: ./run.sh up"
  fi
}

# --- Bootstrap ---
_bootstrap() {
  if [ ! -f local.env ]; then
    warn "local.env not found. Copying from local.env.example..."
    cp local.env.example local.env
    warn "Edit local.env with your Auth0 credentials."
  fi
}

# --- Commands ---

cmd_up() {
  _bootstrap
  info "Starting Boilerworks stack..."
  $COMPOSE up -d
  sleep 3
  info "Running migrations..."
  $COMPOSE exec api npx prisma migrate deploy 2>/dev/null || true
  echo ""
  ok "Stack is running!"
  echo ""
  echo "  API (GraphQL):  http://localhost:4000/graphql"
  echo "  Frontend:       http://localhost:3000"
  echo "  Prisma Studio:  http://localhost:5555"
  echo "  MinIO Console:  http://localhost:9001  (minioadmin/minioadmin)"
  echo "  Mailpit:        http://localhost:8025"
  echo "  Postgres:       localhost:5432  (dbadmin/dbadmin)"
  echo "  Redis:          localhost:6379"
  echo ""
}

cmd_stop() {
  info "Stopping stack..."
  $COMPOSE down
  ok "Stopped."
}

cmd_restart() {
  info "Restarting API..."
  $COMPOSE restart api
  ok "Restarted."
}

cmd_rebuild() {
  info "Rebuilding all images (no cache)..."
  $COMPOSE build --no-cache
  info "Restarting..."
  $COMPOSE up -d
  ok "Rebuilt and running."
}

cmd_status() {
  $COMPOSE ps
}

cmd_health() {
  _require_running
  info "Checking services..."
  echo -n "  API:      " && curl -sf http://localhost:4000/health | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'])" 2>/dev/null || echo "down"
  echo -n "  Web:      " && curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null && echo " ok" || echo "down"
  echo -n "  Postgres: " && $COMPOSE exec -T postgres pg_isready -U dbadmin -d boilerworks -q && echo "ok" || echo "down"
  echo -n "  Redis:    " && $COMPOSE exec -T redis redis-cli ping 2>/dev/null | tr -d '\r' || echo "down"
  echo -n "  MinIO:    " && curl -sf -o /dev/null -w "%{http_code}" http://localhost:9001 2>/dev/null && echo " ok" || echo "down"
  echo -n "  Mailpit:  " && curl -sf -o /dev/null -w "%{http_code}" http://localhost:8025 2>/dev/null && echo " ok" || echo "down"
  echo -n "  Studio:   " && curl -sf -o /dev/null -w "%{http_code}" http://localhost:5555 2>/dev/null && echo " ok" || echo "down"
}

cmd_logs() {
  local lines=${1:-100}
  $COMPOSE logs api --tail "$lines" -f
}

cmd_logs_all() {
  $COMPOSE logs --tail 50 -f
}

cmd_reset() {
  warn "This will DESTROY all data and rebuild from scratch."
  echo -n "  Continuing in 5 seconds (Ctrl+C to abort)..."
  for i in 5 4 3 2 1; do echo -n " $i"; sleep 1; done; echo ""
  $COMPOSE down -v
  cmd_up
  info "Seeding..."
  $COMPOSE exec api npx tsx prisma/seed.ts
  ok "Reset complete."
}

# --- Database ---

cmd_migrate() {
  _require_running
  info "Running migrations..."
  $COMPOSE exec api npx prisma migrate dev "$@"
  ok "Migrations applied."
}

cmd_seed() {
  _require_running
  info "Seeding database..."
  $COMPOSE exec api npx tsx prisma/seed.ts
  ok "Seeded."
}

cmd_studio() {
  info "Prisma Studio: http://localhost:5555"
  open http://localhost:5555 2>/dev/null || true
}

cmd_generate() {
  _require_running
  info "Generating Prisma client..."
  $COMPOSE exec api npx prisma generate
  ok "Generated."
}

# --- Dev ---

cmd_test() {
  cd apps/api
  npx vitest "$@"
}

cmd_lint() {
  npm run lint
}

cmd_format() {
  npm run format
}

cmd_schema() {
  _require_running
  info "Exporting GraphQL schema..."
  $COMPOSE exec api node -e "
    const { printSchema } = require('graphql');
    const { schema } = require('./dist/src/graphql/schema');
    console.log(printSchema(schema));
  " > apps/api/schema.graphql
  ok "Schema exported to apps/api/schema.graphql"
}

cmd_bash() {
  _require_running
  $COMPOSE exec api sh
}

# --- Help ---

cmd_help() {
  echo "Boilerworks TS — Local Development"
  echo ""
  echo "Usage: ./run.sh <command> [args]"
  echo ""
  echo "Stack:"
  echo "  up          Start all services"
  echo "  stop        Stop all services"
  echo "  restart     Restart API container"
  echo "  rebuild     Rebuild all images (no cache)"
  echo "  status      Show container status"
  echo "  health      Check all service health"
  echo "  logs [N]    Tail API logs (default: 100 lines)"
  echo "  logs-all    Tail all service logs"
  echo "  reset       ⚠ Wipe database + rebuild + reseed"
  echo ""
  echo "Database:"
  echo "  migrate     Run Prisma migrations"
  echo "  seed        Load dev fixtures"
  echo "  studio      Open Prisma Studio"
  echo "  generate    Regenerate Prisma client"
  echo ""
  echo "Dev:"
  echo "  test        Run tests (vitest)"
  echo "  lint        Run linter"
  echo "  format      Run Prettier"
  echo "  schema      Export GraphQL schema to file"
  echo "  bash        Shell into API container"
  echo ""
  echo "URLs:"
  echo "  API:        http://localhost:4000/graphql"
  echo "  Frontend:   http://localhost:3000"
  echo "  Studio:     http://localhost:5555"
  echo "  MinIO:      http://localhost:9001"
  echo "  Mailpit:    http://localhost:8025"
}

# --- Dispatch ---
cmd="${1:-help}"
shift 2>/dev/null || true

case "$cmd" in
  up)        cmd_up ;;
  stop)      cmd_stop ;;
  restart)   cmd_restart ;;
  rebuild)   cmd_rebuild ;;
  status)    cmd_status ;;
  health)    cmd_health ;;
  logs)      cmd_logs "$@" ;;
  logs-all)  cmd_logs_all ;;
  reset)     cmd_reset ;;
  migrate)   cmd_migrate "$@" ;;
  seed)      cmd_seed ;;
  studio)    cmd_studio ;;
  generate)  cmd_generate ;;
  test)      cmd_test "$@" ;;
  lint)      cmd_lint ;;
  format)    cmd_format ;;
  schema)    cmd_schema ;;
  bash)      cmd_bash ;;
  help|--help|-h) cmd_help ;;
  *)         die "Unknown command: $cmd. Run './run.sh help' for usage." ;;
esac
