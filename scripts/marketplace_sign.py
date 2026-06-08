#!/usr/bin/env python3
"""Marketplace paket imzasi — SHA256 + HMAC-SHA256."""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MP = ROOT / "rules" / "marketplace"


def package_dir(pkg_id: str) -> Path:
    return MP / pkg_id


def hash_files(pkg_path: Path, files: list[str]) -> str:
    h = hashlib.sha256()
    for name in sorted(files):
        if name.startswith("."):
            continue
        p = pkg_path / name
        if not p.is_file():
            raise SystemExit(f"[ERR] missing {p}")
        h.update(name.encode())
        h.update(p.read_bytes())
    return h.hexdigest()


def sign_digest(digest: str, key: bytes) -> str:
    return hmac.new(key, digest.encode(), hashlib.sha256).hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("package_id", help="e.g. core-detection")
    ap.add_argument("--key", default=os.environ.get("MARKETPLACE_SIGN_KEY", "log-guardian-marketplace-dev-key"))
    ap.add_argument("--update-catalog", action="store_true")
    args = ap.parse_args()

    pkg_path = package_dir(args.package_id)
    meta = json.loads((pkg_path / "manifest.json").read_text(encoding="utf-8"))
    files = [
        f.name for f in pkg_path.iterdir()
        if f.is_file() and not f.name.startswith(".")
    ]
    file_names = sorted(files)
    digest = hash_files(pkg_path, file_names)
    sig = sign_digest(digest, args.key.encode())

    (pkg_path / ".sha256").write_text(digest + "\n", encoding="utf-8")
    (pkg_path / ".signature").write_text(sig + "\n", encoding="utf-8")
    print(f"[marketplace_sign] {args.package_id} sha256={digest[:16]}... sig={sig[:16]}...")

    if args.update_catalog:
        catalog = json.loads((MP / "manifest.json").read_text(encoding="utf-8"))
        for pkg in catalog.get("packages", []):
            if pkg.get("id") == args.package_id:
                pkg["sha256"] = digest
                pkg["signature"] = sig
                pkg["files"] = file_names
        (MP / "manifest.json").write_text(
            json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        print(f"[marketplace_sign] catalog updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
