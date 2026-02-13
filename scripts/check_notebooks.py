#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from pathlib import Path

def iter_notebooks(root: Path) -> list[Path]:
    return sorted(path for path in root.rglob("*.ipynb") if path.is_file())


def check_notebook(path: Path) -> list[str]:
    errors: list[str] = []
    with path.open("r", encoding="utf-8") as f:
        nb = json.load(f)

    cells = nb.get("cells", [])
    if not isinstance(cells, list):
        return [f"{path}: invalid notebook format (cells is not a list)"]

    for idx, cell in enumerate(cells, start=1):
        if not isinstance(cell, dict):
            errors.append(f"{path}: cell {idx} has invalid format")
            continue
        if cell.get("cell_type") != "code":
            continue
        if cell.get("outputs"):
            errors.append(f"{path}: cell {idx} has outputs; clear outputs before commit")
        if cell.get("execution_count") is not None:
            errors.append(f"{path}: cell {idx} has execution_count; clear execution state")
    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/check_notebooks.py <notebooks_dir>")
        return 2

    root = Path(sys.argv[1]).resolve()
    if not root.exists():
        print(f"Notebook directory not found: {root}")
        return 2

    notebooks = iter_notebooks(root)
    if not notebooks:
        print(f"No notebooks found under: {root}")
        return 0

    all_errors: list[str] = []
    for notebook in notebooks:
        all_errors.extend(check_notebook(notebook))

    if all_errors:
        print("Notebook validation failed:")
        for err in all_errors:
            print(f"- {err}")
        return 1

    print(f"Notebook validation passed ({len(notebooks)} notebook(s)).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
