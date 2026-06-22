#!/usr/bin/env python3
"""Yerel SIEM forwarder dinleyici (demo / e2e). TCP :5044 JSON satirlari."""
from __future__ import annotations

import argparse
import socket
import sys
import time
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser(description="SIEM forwarder TCP capture")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=5044)
    ap.add_argument("--out", type=Path, help="dosyaya append")
    ap.add_argument("--timeout", type=float, default=0, help="saniye sonra cik (0=suresiz)")
    args = ap.parse_args()

    out_f = None
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        out_f = args.out.open("a", encoding="utf-8")

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((args.host, args.port))
    srv.listen(8)
    srv.settimeout(1.0)
    print(f"[siem_capture] dinleniyor {args.host}:{args.port}", flush=True)

    deadline = time.monotonic() + args.timeout if args.timeout > 0 else None
    buf = b""

    while True:
        if deadline and time.monotonic() >= deadline:
            break
        try:
            conn, addr = srv.accept()
        except TimeoutError:
            continue
        conn.settimeout(2.0)
        try:
            while True:
                chunk = conn.recv(4096)
                if not chunk:
                    break
                buf += chunk
                while b"\n" in buf:
                    line, buf = buf.split(b"\n", 1)
                    text = line.decode("utf-8", errors="replace").strip()
                    if not text:
                        continue
                    print(text, flush=True)
                    if out_f:
                        out_f.write(text + "\n")
                        out_f.flush()
        except OSError:
            pass
        finally:
            conn.close()

    if out_f:
        out_f.close()
    srv.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
