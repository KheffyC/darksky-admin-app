#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Season rollover helper for DarkSky admin.

What it does:
1) Creates a SQL backup (and optional CSV snapshots)
2) Truncates seasonal operational tables

Usage:
  bash scripts/season-rollover.sh [options]

Options:
  --yes                 Skip interactive confirmation prompt
  --no-csv              Skip CSV snapshot exports
  --backup-dir <path>   Backup output directory (default: $HOME/Downloads/darksky-backups)
  --help                Show this help

Environment:
  DATABASE_URL          Required PostgreSQL connection string

Examples:
  npm run season:rollover
  npm run season:rollover -- --yes
  npm run season:rollover -- --backup-dir "$HOME/Downloads/darksky-backups" --yes
EOF
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    exit 1
  fi
}

YES_MODE=false
EXPORT_CSV=true
BACKUP_ROOT="${HOME}/Downloads/darksky-backups"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes)
      YES_MODE=true
      shift
      ;;
    --no-csv)
      EXPORT_CSV=false
      shift
      ;;
    --backup-dir)
      BACKUP_ROOT="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Load .env.local first or run via npm script." >&2
  exit 1
fi

require_cmd pg_dump
require_cmd psql

timestamp="$(date +%Y%m%d_%H%M%S)"
backup_dir="${BACKUP_ROOT%/}/$timestamp"
mkdir -p "$backup_dir"

echo "Creating full SQL backup..."
pg_dump "$DATABASE_URL" | gzip > "$backup_dir/darksky_${timestamp}.sql.gz"

if [[ "$EXPORT_CSV" == true ]]; then
  echo "Exporting CSV snapshots..."
  mkdir -p "$backup_dir/csv"

  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
\\copy "Member" TO '$backup_dir/csv/Member.csv' CSV HEADER
\\copy "Payment" TO '$backup_dir/csv/Payment.csv' CSV HEADER
\\copy "PaymentSchedule" TO '$backup_dir/csv/PaymentSchedule.csv' CSV HEADER
\\copy "UnmatchedPayment" TO '$backup_dir/csv/UnmatchedPayment.csv' CSV HEADER
\\copy "Settings" TO '$backup_dir/csv/Settings.csv' CSV HEADER
\\copy "ImportLog" TO '$backup_dir/csv/ImportLog.csv' CSV HEADER
SQL
fi

echo "Backup completed: $backup_dir"

if [[ "$YES_MODE" != true ]]; then
  echo
  echo "WARNING: This will DELETE seasonal operational data from the live database."
  echo "Tables to reset: Member, Payment, PaymentSchedule, UnmatchedPayment, TuitionEditLog, ImportLog, Settings"
  echo "Type RESET to continue:"
  read -r confirm
  if [[ "$confirm" != "RESET" ]]; then
    echo "Aborted. No data was changed."
    exit 0
  fi
fi

echo "Truncating seasonal tables..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
TRUNCATE TABLE
  "Payment",
  "UnmatchedPayment",
  "TuitionEditLog",
  "Member",
  "PaymentSchedule",
  "ImportLog",
  "Settings"
RESTART IDENTITY CASCADE;
COMMIT;
SQL

echo "Season rollover complete."
echo "Restore command example: gunzip -c '$backup_dir/darksky_${timestamp}.sql.gz' | psql \"$DATABASE_URL\""
