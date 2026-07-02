# Stage 1: Builder
FROM ubuntu:24.04 AS builder

RUN apt-get update && apt-get install -y \
    clang llvm libbpf-dev libpcre2-dev libsqlite3-dev \
    libcurl4-openssl-dev libssl-dev liburing-dev libseccomp-dev \
    pkg-config make linux-tools-common linux-headers-generic \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN make clean && make -j$(nproc) log-guardian log-guardian-daemon \
    xdp_filter.o lineage_probe.o

# Stage 2: Runtime
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    libbpf1 libpcre2-8-0 libsqlite3-0 libseccomp2 \
    libcurl4t64 libssl3 liburing2 \
    iproute2 && \
    rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/log-guardian /run/log-guardian /var/log/nginx && \
    chown -R nobody:nogroup /var/log/nginx

WORKDIR /app

COPY --from=builder /app/log-guardian /usr/local/bin/
COPY --from=builder /app/log-guardian-daemon /usr/local/bin/
COPY --from=builder /app/xdp_filter.o /etc/log-guardian/
COPY --from=builder /app/lineage_probe.o /etc/log-guardian/
COPY --from=builder /app/rules.conf /etc/log-guardian/rules.conf
COPY --from=builder /app/threat_intel.sh /usr/local/bin/log-guardian-threatintel
RUN chmod +x /usr/local/bin/log-guardian /usr/local/bin/log-guardian-daemon \
    /usr/local/bin/log-guardian-threatintel

COPY <<-"EOF" /entrypoint.sh
#!/bin/bash
set -e

mkdir -p /run/log-guardian
chmod 0750 /run/log-guardian
chown root:nogroup /run/log-guardian

echo "[Entrypoint] Daemon (eBPF) baslatiliyor..."
/usr/local/bin/log-guardian-daemon \
  --iface "${IFACE:-eth0}" \
  --obj /etc/log-guardian/xdp_filter.o &
DAEMON_PID=$!

sleep 2

echo "[Entrypoint] Analyzer baslatiliyor..."
export LOGANALYZER_PASSWORD="${LOGANALYZER_PASSWORD:-DegistirBeni!123}"
su -s /bin/bash nobody -c "/usr/local/bin/log-guardian \
  ${LOG_PATH:-/var/log/nginx/access.log} \
  --rules /etc/log-guardian/rules.conf \
  --db /etc/log-guardian/events.db \
  --follow --no-tui"

wait $DAEMON_PID
EOF

RUN chmod +x /entrypoint.sh

ENV IFACE=eth0
ENV LOG_PATH=/var/log/nginx/access.log
ENV LOGANALYZER_PASSWORD=DegistirBeni!123

ENTRYPOINT ["/entrypoint.sh"]
