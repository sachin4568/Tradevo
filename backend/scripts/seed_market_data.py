"""DEPRECATED: Use `python scripts/seed.py` instead.

This file is kept as a thin wrapper for backward compatibility.
It will be removed in a future milestone.
"""

import sys
from pathlib import Path

# Delegate to the new modular seeder
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from scripts.seed import main  # noqa: E402

if __name__ == "__main__":
    main()
