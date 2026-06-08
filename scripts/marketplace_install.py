#!/usr/bin/env python3
"""Imzali marketplace paketini dogrula ve rules/ altina kur."""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MP = ROOT / "rules" / "marketplace"
OUT = ROOT / "rules" / "installed-marketplace"


def hash_files(pkg_path: Path, files: list[str]) -> str:
    h = hashlib.sha256()
    for name in sorted(files):
        p = pkg_path / name
        h.update(name.encode())
        h.update(p.read_bytes())
    return h.hexdigest()


def verify(pkg_id: str, key: bytes) -> dict:
    catalog = json.loads((MP / "manifest.json").read_text(encoding="utf-8"))
    entry = next((p for p in catalog.get("packages", []) if p.get("id") == pkg_id), None)
    if not entry:
        raise SystemExit(f"[ERR] package {pkg_id} not in catalog")

    pkg_path = MP / pkg_id
    files = [
        f for f in entry.get("files")
        or [x.name for x in pkg_path.iterdir() if x.is_file() and not x.name.startswith(".")]
        if not str(f).startswith(".")
    ]
    digest = hash_files(pkg_path, files)
    expected = entry.get("sha256") or (pkg_path / ".sha256").read_text().strip()
    if digest != expected:
        raise SystemExit(f"[ERR] sha256 mismatch {pkg_id}")

    sig_file = (pkg_path / ".signature").read_text().strip() if (pkg_path / ".signature").is_file() else entry.get("signature", "")
    expected_sig = entry.get("signature") or sig_file
    calc_sig = hmac.new(key, digest.encode(), hashlib.sha256).hexdigest()
    if expected_sig and calc_sig != expected_sig:
        raise SystemExit(f"[ERR] signature invalid {pkg_id}")

    return {"id": pkg_id, "digest": digest, "files": files, "path": str(pkg_path)}


def install(pkg_id: str) -> Path:
    dest = OUT / pkg_id
    src = MP / pkg_id
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(src, dest)
    return dest


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("package_id", nargs="?", default="core-detection")
    ap.add_argument("--key", default=os.environ.get("MARKETPLACE_SIGN_KEY", "log-guardian-marketplace-dev-key"))
    ap.add_argument("--list", action="store_true")
    args = ap.parse_args()

    if args.list:
        catalog = json.loads((MP / "manifest.json").read_text(encoding="utf-8"))
        for p in catalog.get("packages", []):
            print(f"  {p.get('id')} v{p.get('version')} — {p.get('name')}")
        return 0

    info = verify(args.package_id, args.key.encode())
    dest = install(args.package_id)
    print(f"[marketplace_install] OK {args.package_id} -> {dest} ({len(info['files'])} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
