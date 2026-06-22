#!/usr/bin/env python3
"""Statik site — sertlestirilmis localhost sunucu."""
from __future__ import annotations

import argparse
import http.server
import os
import re
import sys
import time
from collections import defaultdict
from functools import partial
from pathlib import Path, PurePosixPath

ROOT_DIR = Path(__file__).resolve().parent.parent
CSP_FILE = ROOT_DIR / "assets" / "website" / "csp.txt"
ALLOWLIST_FILE = ROOT_DIR / "assets" / "website" / "publish.allowlist"

DEFAULT_CSP = CSP_FILE.read_text(encoding="utf-8").strip().rstrip(";")


def load_csp(site_root: Path) -> str:
    """Sunulan paketin en genis sayfa CSP'si — tests.html i18n+test-results icerir."""
    best = ""
    best_scripts = -1
    for name in ("tests.html", "index.html"):
        path = site_root / name
        if not path.is_file():
            continue
        html = path.read_text(encoding="utf-8")
        match = re.search(
            r'<meta http-equiv="Content-Security-Policy" content="([^"]*)"',
            html,
        )
        if not match:
            continue
        csp = match.group(1).strip().rstrip(";")
        n_scripts = len(re.findall(r"sha384-", csp.split("script-src", 1)[-1].split(";", 1)[0]))
        if n_scripts > best_scripts:
            best_scripts = n_scripts
            best = csp
    if best:
        return best
    headers = site_root / "_headers"
    if headers.is_file():
        for line in headers.read_text(encoding="utf-8").splitlines():
            stripped = line.strip()
            if stripped.startswith("Content-Security-Policy:"):
                return stripped.split(":", 1)[1].strip().rstrip(";")
    return DEFAULT_CSP


def build_security_headers(csp: str) -> dict[str, str]:
    return {
        **SECURITY_HEADERS_BASE,
        "Content-Security-Policy": csp,
    }


PERMS = (
    "accelerometer=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), "
    "display-capture=(), encrypted-media=(), fullscreen=(), gamepad=(), geolocation=(), "
    "gyroscope=(), hid=(), idle-detection=(), local-fonts=(), magnetometer=(), "
    "microphone=(), midi=(), payment=(), picture-in-picture=(), "
    "publickey-credentials-get=(), screen-wake-lock=(), serial=(), sync-xhr=(), "
    "usb=(), web-share=(), xr-spatial-tracking=(), interest-cohort=()"
)

SECURITY_HEADERS_BASE = {
    "X-LG-Site-Server": "secure-static/1",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-Download-Options": "noopen",
    "X-DNS-Prefetch-Control": "off",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": PERMS,
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Origin-Agent-Cluster": "?1",
    "X-Permitted-Cross-Domain-Policies": "none",
}

SECURITY_HEADERS = build_security_headers(DEFAULT_CSP)

ALLOWED_METHODS = frozenset({"GET", "HEAD"})
BLOCKED_SUFFIXES = frozenset({
    ".env", ".pem", ".key", ".p12", ".pfx", ".sh", ".py", ".bak", ".swp", ".git", ".map",
})
PROBE_KEYS = frozenset({
    "csp.txt", "publish.allowlist", "_headers", "_redirects",
    "deploy-manifest.json", ".env",
})
PROBE_PREFIXES = (".git/", "wp-admin", "admin/")
ATTACHMENT_SUFFIXES = frozenset({".json", ".md", ".pdf"})
HOTLINK_PREFIXES = frozenset({"screenshots", "evidence"})
MAX_PATH_LEN = 512
RATE_LIMIT_PER_MIN = 180
MIME_OVERRIDES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".md": "text/plain; charset=utf-8",
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
}


def load_allowlist(path: Path) -> frozenset[str]:
    entries: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            entries.add(line.replace("\\", "/"))
    if not entries:
        raise SystemExit(f"[website_secure_server] FAIL: bos allowlist {path}")
    return frozenset(entries)


class SecureStaticHandler(http.server.SimpleHTTPRequestHandler):
    root: Path
    allowed_paths: frozenset[str]
    bind_host: str = "127.0.0.1"
    bind_port: int = 8765
    security_headers: dict[str, str] = SECURITY_HEADERS
    rate_buckets: dict[str, list[float]] = defaultdict(list)
    server_version = ""
    sys_version = ""

    def __init__(
        self,
        *args,
        directory: str | None = None,
        allowed_paths: frozenset[str] | None = None,
        bind_host: str = "127.0.0.1",
        bind_port: int = 8765,
        security_headers: dict[str, str] | None = None,
        **kwargs,
    ) -> None:
        self.root = Path(directory or ".").resolve()
        self.allowed_paths = allowed_paths or frozenset()
        self.bind_host = bind_host
        self.bind_port = bind_port
        self.security_headers = security_headers or SECURITY_HEADERS
        super().__init__(*args, directory=str(self.root), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _apply_security_headers(self) -> None:
        for name, value in self.security_headers.items():
            self.send_header(name, value)

    def send_error(self, code: int, message: str | None = None, explain: str | None = None) -> None:
        try:
            if code == 404 and "404.html" in self.allowed_paths:
                path = self.root / "404.html"
                if path.is_file():
                    fs = path.stat()
                    self.send_response(404, message)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_header("Content-Length", str(fs.st_size))
                    self.send_header("Cache-Control", "no-store")
                    self._apply_security_headers()
                    self.end_headers()
                    if self.command != "HEAD":
                        with open(path, "rb") as fh:
                            self.wfile.write(fh.read())
                    return
            self.send_response(code, message)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self._apply_security_headers()
            self.end_headers()
            if self.command != "HEAD":
                body = f"<!DOCTYPE html><title>{code}</title><h1>{code}</h1>"
                self.wfile.write(body.encode("utf-8"))
        except (BrokenPipeError, ConnectionResetError):
            pass

    def _reject(self, code: int, msg: str) -> None:
        self.send_error(code, msg)

    def do_OPTIONS(self) -> None:
        self._reject(405, "Method not allowed")

    def do_POST(self) -> None:
        self._reject(405, "Method not allowed")

    def do_PUT(self) -> None:
        self._reject(405, "Method not allowed")

    def do_DELETE(self) -> None:
        self._reject(405, "Method not allowed")

    def do_PATCH(self) -> None:
        self._reject(405, "Method not allowed")

    def do_TRACE(self) -> None:
        self._reject(405, "Method not allowed")

    def _host_ok(self) -> bool:
        host_raw = (self.headers.get("Host") or "").strip().lower()
        if not host_raw:
            return True
        host = host_raw.split(":", 1)[0].strip("[]")
        port = self.bind_port
        if ":" in host_raw:
            try:
                port = int(host_raw.rsplit(":", 1)[-1])
            except ValueError:
                return False
        allowed_hosts = {"127.0.0.1", "localhost", "::1", self.bind_host.lower()}
        return host in allowed_hosts and port == self.bind_port

    def _rate_ok(self) -> bool:
        ip = self.client_address[0]
        now = time.monotonic()
        bucket = self.rate_buckets[ip]
        bucket[:] = [t for t in bucket if now - t < 60.0]
        if len(bucket) >= RATE_LIMIT_PER_MIN:
            return False
        bucket.append(now)
        return True

    def _fetch_ok(self, key: str) -> bool:
        if key == "i18n.js":
            dest = self.headers.get("Sec-Fetch-Dest", "")
            if dest and dest not in ("script", "empty"):
                return False
        if key == "site.css":
            dest = self.headers.get("Sec-Fetch-Dest", "")
            if dest and dest not in ("style", "empty"):
                return False
        if key.startswith("evidence/") or key.startswith("screenshots/"):
            if self.headers.get("Range"):
                return False
        return True

    def _hotlink_blocked(self, parts: list[str]) -> bool:
        if not parts or parts[0] not in HOTLINK_PREFIXES:
            return False
        sfs = self.headers.get("Sec-Fetch-Site", "")
        if not sfs:
            return False
        return sfs == "cross-site"

    def _public_key(self, parts: list[str]) -> str:
        if not parts:
            return "index.html"
        return "/".join(parts)

    def _safe_path(self, raw_path: str) -> Path | None:
        if len(raw_path) > MAX_PATH_LEN or "\0" in raw_path:
            return None
        raw = raw_path.split("?", 1)[0].split("#", 1)[0]
        if re.search(r"%(?:2[fF]|5[cC]|2[eE]|00)", raw):
            return None

        rel = PurePosixPath(raw.lstrip("/"))
        parts = [p for p in rel.parts if p not in (".", "..")]
        if ".." in rel.parts:
            return None

        key = self._public_key(parts)
        if key in PROBE_KEYS or key.startswith(PROBE_PREFIXES):
            return None
        if key not in self.allowed_paths:
            return None
        if not self._fetch_ok(key):
            return None
        if self._hotlink_blocked(parts):
            return None

        candidate = (self.root.joinpath(*parts) if parts else self.root / "index.html").resolve()
        try:
            candidate.relative_to(self.root)
        except ValueError:
            return None
        if candidate.suffix.lower() in BLOCKED_SUFFIXES:
            return None
        return candidate

    def _content_type(self, path: Path) -> str:
        return MIME_OVERRIDES.get(path.suffix.lower(), self.guess_type(str(path)))

    def send_head(self):  # noqa: ANN201
        if self.command not in ALLOWED_METHODS:
            self._reject(405, "Method not allowed")
            return None

        if not self._host_ok():
            self._reject(403, "Forbidden")
            return None

        if not self._rate_ok():
            self._reject(429, "Too Many Requests")
            return None

        path = self._safe_path(self.path)
        if path is None:
            self._reject(403, "Forbidden")
            return None

        if path.is_dir():
            index = path / "index.html"
            if not index.is_file():
                self._reject(403, "Directory listing disabled")
                return None
            path = index

        if not path.is_file():
            self._reject(404, "File not found")
            return None

        ctype = self._content_type(path)
        fs = path.stat()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(fs.st_size))

        suffix = path.suffix.lower()
        if suffix in ATTACHMENT_SUFFIXES:
            self.send_header("Content-Disposition", f'attachment; filename="{path.name}"')
        if path.name == "index.html":
            self.send_header("Cache-Control", "no-store")
        elif suffix in {".js", ".css"}:
            self.send_header("Cache-Control", "public, max-age=300, must-revalidate")
            if suffix == ".js":
                self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        else:
            self.send_header("Cache-Control", "public, max-age=3600")

        self._apply_security_headers()
        # crossorigin script (i18n.js) + yerel onizleme icin
        origin = self.headers.get("Origin")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        elif path.suffix.lower() in {".js", ".css"}:
            self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if self.command == "HEAD":
            return None
        return open(path, "rb")

    def list_directory(self, path):  # noqa: ANN001
        self._reject(403, "Directory listing disabled")
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Linux Log Guardian statik site (guvenli)")
    parser.add_argument("directory", nargs="?", default=".", help="Site kok dizini")
    parser.add_argument("--host", default=os.environ.get("LG_WEBSITE_HOST", "127.0.0.1"))
    parser.add_argument("--port", type=int, default=int(os.environ.get("LG_WEBSITE_PORT", "8765")))
    args = parser.parse_args()

    root = Path(args.directory).resolve()
    if not (root / "index.html").is_file():
        print(f"[website_secure_server] FAIL: {root}/index.html yok", file=sys.stderr)
        return 1

    allowlist_path = root / "publish.allowlist"
    if not allowlist_path.is_file():
        allowlist_path = ALLOWLIST_FILE
    allowed = load_allowlist(allowlist_path)
    csp = load_csp(root)
    sec_headers = build_security_headers(csp)

    handler = partial(
        SecureStaticHandler,
        directory=str(root),
        allowed_paths=allowed,
        bind_host=args.host,
        bind_port=args.port,
        security_headers=sec_headers,
    )
    server = http.server.ThreadingHTTPServer((args.host, args.port), handler)

    def _shutdown(signum, frame):  # noqa: ARG001
        threading = __import__("threading")
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal = __import__("signal")
    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    print(f"[website_secure_server] http://{args.host}:{args.port}/  allowlist={len(allowed)}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[website_secure_server] durduruldu")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
