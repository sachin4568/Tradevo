"""Database operations CLI.

Provides production utilities for:
- Migration execution (upgrade / downgrade / current)
- Database connectivity verification
- Backup command template
- Restore command template

Usage:
    python -m scripts.db_ops migrate [--target REVISION]
    python -m scripts.db_ops status
    python -m scripts.db_ops verify
    python -m scripts.db_ops backup
    python -m scripts.db_ops restore <backup_file>
"""

import argparse
import logging
import subprocess
import sys

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def cmd_migrate(args: argparse.Namespace) -> None:
    """Run database migrations (upgrade to head or a specific revision)."""
    target = args.target or "head"
    logger.info("Running migrations to '%s'...", target)
    result = subprocess.run(
        ["alembic", "upgrade", target],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("Migration failed:\n%s", result.stderr)
        sys.exit(1)
    logger.info("Migration successful:\n%s", result.stdout)


def cmd_downgrade(args: argparse.Namespace) -> None:
    """Downgrade database by N steps (default 1)."""
    revision = f"-{args.steps}"
    logger.info("Downgrading database by %s step(s)...", args.steps)
    result = subprocess.run(
        ["alembic", "downgrade", revision],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("Downgrade failed:\n%s", result.stderr)
        sys.exit(1)
    logger.info("Downgrade successful:\n%s", result.stdout)


def cmd_status(args: argparse.Namespace) -> None:
    """Show current migration status."""
    result = subprocess.run(
        ["alembic", "current"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        logger.error("Status check failed:\n%s", result.stderr)
        sys.exit(1)
    logger.info("Current revision:\n%s", result.stdout)


def cmd_verify(args: argparse.Namespace) -> None:
    """Verify database connectivity."""
    logger.info("Verifying database connectivity...")
    try:
        from app.config import get_settings
        settings = get_settings()
        db_url = settings.DATABASE_URL

        # Mask password for display
        masked = db_url
        if "://" in db_url and "@" in db_url:
            prefix, rest = db_url.split("://", 1)
            user_pass, host_part = rest.split("@", 1)
            if ":" in user_pass:
                user, _ = user_pass.split(":", 1)
                masked = f"{prefix}://{user}:****@{host_part}"

        logger.info("Database URL: %s", masked)

        import asyncio
        from sqlalchemy import text
        from app.core.database import create_engine

        engine = create_engine()

        async def check() -> bool:
            async with engine.connect() as conn:
                result = await conn.execute(text("SELECT 1"))
                row = result.fetchone()
                return row is not None

        ok = asyncio.run(check())
        await engine.dispose()

        if ok:
            logger.info("Database connectivity: OK")
        else:
            logger.error("Database connectivity: FAILED (no result)")
            sys.exit(1)
    except Exception as exc:
        logger.error("Database connectivity: FAILED — %s", exc)
        sys.exit(1)


def cmd_backup(args: argparse.Namespace) -> None:
    """Print a pg_dump command template for database backup.

    This does NOT execute the backup. It generates a command that
    an operator can use or schedule via cron.
    """
    from app.config import get_settings
    settings = get_settings()
    db_url = settings.DATABASE_URL

    # Parse URL components
    # postgresql+asyncpg://user:pass@host:5432/dbname
    url = db_url.replace("postgresql+asyncpg://", "").replace("postgresql://", "")
    if "@" in url:
        user_pass, host_db = url.split("@", 1)
        user = user_pass.split(":")[0]
        password = user_pass.split(":")[1] if ":" in user_pass else ""
    else:
        user = "tradevo"
        password = ""
        host_db = url

    if "/" in host_db:
        host_port, dbname = host_db.rsplit("/", 1)
    else:
        host_port = host_db
        dbname = "tradevo"

    host = host_port.split(":")[0] if ":" in host_port else host_port
    port = host_port.split(":")[1] if ":" in host_port else "5432"

    timestamp = args.timestamp or "$(date +%Y%m%d_%H%M%S)"
    outfile = args.output or f"tradevo_backup_{timestamp}.sql"

    if password:
        export = f"PGPASSWORD={password} "
    else:
        export = ""

    cmd = (
        f"{export}pg_dump -h {host} -p {port} -U {user} -d {dbname} "
        f"-F c -f {outfile}"
    )

    logger.info("Backup command template:")
    print(cmd)
    logger.info("Note: Schedule via cron for automated backups.")


def cmd_restore(args: argparse.Namespace) -> None:
    """Print a pg_restore command template for database restore.

    This does NOT execute the restore. It generates a command that
    an operator can use to restore from a backup file.
    """
    from app.config import get_settings
    settings = get_settings()
    db_url = settings.DATABASE_URL

    url = db_url.replace("postgresql+asyncpg://", "").replace("postgresql://", "")
    if "@" in url:
        user_pass, host_db = url.split("@", 1)
        user = user_pass.split(":")[0]
        password = user_pass.split(":")[1] if ":" in user_pass else ""
    else:
        user = "tradevo"
        password = ""
        host_db = url

    if "/" in host_db:
        host_port, dbname = host_db.rsplit("/", 1)
    else:
        host_port = host_db
        dbname = "tradevo"

    host = host_port.split(":")[0] if ":" in host_port else host_port
    port = host_port.split(":")[1] if ":" in host_port else "5432"

    backup_file = args.backup_file
    if not backup_file:
        logger.error("Backup file path is required")
        sys.exit(1)

    if password:
        export = f"PGPASSWORD={password} "
    else:
        export = ""

    cmd = (
        f"{export}pg_restore -h {host} -p {port} -U {user} -d {dbname} "
        f"--clean --if-exists {backup_file}"
    )

    logger.info("Restore command template:")
    print(cmd)
    logger.info("WARNING: This will DROP and recreate all database objects.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Tradevo database operations")
    sub = parser.add_subparsers(dest="command", required=True)

    # migrate
    p_migrate = sub.add_parser("migrate", help="Run database migrations")
    p_migrate.add_argument("--target", help="Target revision (default: head)")

    # downgrade
    p_downgrade = sub.add_parser("downgrade", help="Downgrade database")
    p_downgrade.add_argument("steps", type=int, nargs="?", default=1, help="Number of steps to downgrade")

    # status
    sub.add_parser("status", help="Show current migration revision")

    # verify
    sub.add_parser("verify", help="Verify database connectivity")

    # backup
    p_backup = sub.add_parser("backup", help="Generate backup command template")
    p_backup.add_argument("--output", help="Output file path")
    p_backup.add_argument("--timestamp", help="Timestamp string for filename")

    # restore
    p_restore = sub.add_parser("restore", help="Generate restore command template")
    p_restore.add_argument("backup_file", nargs="?", help="Path to backup file")

    args = parser.parse_args()

    commands = {
        "migrate": cmd_migrate,
        "downgrade": cmd_downgrade,
        "status": cmd_status,
        "verify": cmd_verify,
        "backup": cmd_backup,
        "restore": cmd_restore,
    }

    commands[args.command](args)


if __name__ == "__main__":
    main()