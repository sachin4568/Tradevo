"""Tradevo database seeder.

Orchestrates all seed modules in dependency order.
Each seeder is idempotent — safe to run multiple times.

Usage:
    PYTHONPATH=. python scripts/seed.py
    PYTHONPATH=. python scripts/seed.py --seeders companies news   # selective
    PYTHONPATH=. python scripts/seed.py --force                    # skip idempotency checks
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Ensure the backend package is importable when run from the backend/ dir
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import create_engine, create_session_factory

# ─── Seeder registry ───
# Order matters: companies must be seeded before news (FK dependency).

AVAILABLE_SEEDERS: dict[str, tuple[str, str]] = {
    "companies": ("scripts.seeders.companies", "seed_companies"),
    "market": ("scripts.seeders.market", "seed_market"),
    "news": ("scripts.seeders.news", "seed_news"),
}

DEFAULT_SEEDERS = ["companies", "market", "news"]


async def run_seeder(session, module_path: str, func_name: str) -> int:
    """Import and execute a single seeder function.

    Args:
        session: Active async SQLAlchemy session.
        module_path: Dotted module path (e.g., 'scripts.seeders.companies').
        func_name: Name of the async seed function in that module.

    Returns:
        Number of records inserted (or 0 if skipped).
    """
    from importlib import import_module

    module = import_module(module_path)
    seed_fn = getattr(module, func_name)
    return await seed_fn(session)


async def seed(seeders: list[str] | None = None, force: bool = False) -> None:
    """Run all registered seeders (or a subset) in dependency order.

    Args:
        seeders: List of seeder names to run. None = all default seeders.
        force: If True, bypass idempotency checks and always insert.
    """
    if seeders is None:
        seeders = DEFAULT_SEEDERS

    # Validate seeder names
    invalid = set(seeders) - set(AVAILABLE_SEEDERS)
    if invalid:
        print(f"Unknown seeders: {invalid}")
        print(f"Available: {', '.join(AVAILABLE_SEEDERS)}")
        sys.exit(1)

    engine = create_engine()
    session_factory = create_session_factory(engine)
    total_inserted = 0

    async with session_factory() as session:
        print("Tradevo Database Seeder")
        print("=" * 40)

        for name in seeders:
            module_path, func_name = AVAILABLE_SEEDERS[name]
            print(f"\n[{name}]")
            inserted = await run_seeder(session, module_path, func_name)
            total_inserted += inserted

        if total_inserted > 0:
            await session.commit()
            print(f"\nCommitted {total_inserted} total records.")
        else:
            print("\nNo new records to insert (database already seeded).")
            await session.rollback()

    await engine.dispose()
    print("Done.")


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Seed the Tradevo database")
    parser.add_argument(
        "seeders",
        nargs="*",
        default=DEFAULT_SEEDERS,
        help=f"Seeders to run. Available: {', '.join(AVAILABLE_SEEDERS)}",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force insert even if data exists (bypass idempotency)",
    )
    args = parser.parse_args()

    asyncio.run(seed(seeders=args.seeders, force=args.force))


if __name__ == "__main__":
    main()
