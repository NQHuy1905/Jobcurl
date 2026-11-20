#!/usr/bin/env bash
# Start/stop Jobcurl (FastAPI backend + Vite frontend).
# Usage: ./jobcurl.sh {start|stop|restart|status|logs}
# Override ports: FRONTEND_PORT=4000 BACKEND_PORT=9000 ./jobcurl.sh start
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT/.run"

# Ports: shell env > $ROOT/.env > defaults. Only these two keys are read from .env.
env_value() { [[ -f "$ROOT/.env" ]] && sed -n "s/^$1=//p" "$ROOT/.env" | tail -1 | tr -d "\"' \r" || true; }
export BACKEND_PORT="${BACKEND_PORT:-$(env_value BACKEND_PORT)}"
export FRONTEND_PORT="${FRONTEND_PORT:-$(env_value FRONTEND_PORT)}"
export BACKEND_PORT="${BACKEND_PORT:-8010}"
export FRONTEND_PORT="${FRONTEND_PORT:-3010}"

mkdir -p "$RUN_DIR"

is_running() { # $1 = name
  local pidfile="$RUN_DIR/$1.pid"
  [[ -f "$pidfile" ]] && kill -0 "$(cat "$pidfile")" 2>/dev/null
}

port_owner() { ss -ltnp "sport = :$1" 2>/dev/null | awk 'NR>1 {print $NF}' | head -1; }

start_one() { # $1 = name, $2 = port, $3 = workdir, rest = command
  local name=$1 port=$2 dir=$3; shift 3
  if is_running "$name"; then
    echo "$name already running (pid $(cat "$RUN_DIR/$name.pid"))"; return
  fi
  local owner; owner="$(port_owner "$port")"
  if [[ -n "$owner" ]]; then
    echo "ERROR: port $port is in use by $owner — stop it or set another port" >&2; exit 1
  fi
  # setsid gives the service its own process group so stop can kill npm/vite children too.
  # The pid is written from inside the new session ($$ before exec): setsid may fork, so $! is unreliable.
  (cd "$dir" && setsid nohup bash -c 'echo $$ >"$0"; exec "$@"' "$RUN_DIR/$name.pid" "$@" \
    >"$RUN_DIR/$name.log" 2>&1 &)
  sleep 1
  if is_running "$name"; then
    echo "$name started on port $port (pid $(cat "$RUN_DIR/$name.pid"))"
  else
    echo "ERROR: $name failed to start, see $RUN_DIR/$name.log" >&2; rm -f "$RUN_DIR/$name.pid"; exit 1
  fi
}

stop_one() { # $1 = name
  local pidfile="$RUN_DIR/$1.pid"
  if ! is_running "$1"; then rm -f "$pidfile"; echo "$1 not running"; return; fi
  local pid; pid="$(cat "$pidfile")"
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.25; done
  if kill -0 "$pid" 2>/dev/null; then kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" || true; fi
  rm -f "$pidfile"
  echo "$1 stopped"
}

case "${1:-}" in
  start)
    [[ -x "$ROOT/backend/.venv/bin/uvicorn" ]] || { echo "Backend venv missing: see docs/setup.md" >&2; exit 1; }
    [[ -d "$ROOT/frontend/node_modules" ]] || { echo "Run 'npm install' in frontend/ first" >&2; exit 1; }
    start_one backend "$BACKEND_PORT" "$ROOT/backend" \
      .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port "$BACKEND_PORT"
    start_one frontend "$FRONTEND_PORT" "$ROOT/frontend" npm run dev
    echo "Open http://127.0.0.1:$FRONTEND_PORT"
    ;;
  stop)
    stop_one frontend
    stop_one backend
    ;;
  restart) "$0" stop; "$0" start ;;
  status)
    for n in backend frontend; do
      if is_running "$n"; then echo "$n: running (pid $(cat "$RUN_DIR/$n.pid"))"; else echo "$n: stopped"; fi
    done
    echo "ports: frontend=$FRONTEND_PORT backend=$BACKEND_PORT"
    ;;
  logs) tail -n 50 -f "$RUN_DIR/backend.log" "$RUN_DIR/frontend.log" ;;
  *) echo "Usage: $0 {start|stop|restart|status|logs}" >&2; exit 2 ;;
esac
