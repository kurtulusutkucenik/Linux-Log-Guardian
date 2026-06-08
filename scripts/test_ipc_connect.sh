#!/usr/bin/env bash
# Analyzer servisi sandbox'inda gercek IPC connect() testi (test -S yetmez)
set -euo pipefail
SOCK="${1:-/run/log-guardian/ipc.sock}"

systemd-run --pipe -p User=log-guardian -p Group=log-guardian \
  -p ProtectSystem=strict -p 'ReadWritePaths=/etc/log-guardian /var/log/nginx' \
  --wait /usr/bin/python3 -c "
import socket, sys
s = socket.socket(socket.AF_UNIX, socket.SOCK_SEQPACKET)
try:
    s.connect('${SOCK}')
    sys.exit(0)
except OSError as e:
    print(e, file=sys.stderr)
    sys.exit(1)
"
