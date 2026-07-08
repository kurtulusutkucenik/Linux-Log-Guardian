# Hedef dizin
PREFIX  ?= /usr/local
BINDIR   = $(PREFIX)/bin
CONFDIR  = /etc/log-guardian
UNITDIR  = /etc/systemd/system

CC      = clang
ARCH    ?= $(shell uname -m)
HOST_ARCH := $(shell uname -m)
# x86_64: AVX2 SIMD; ARM hedeflerinde -mavx2 kullanilmaz
ARCH_SIMD :=
ifeq ($(ARCH),x86_64)
  ARCH_SIMD := -mavx2
else ifeq ($(ARCH),amd64)
  ARCH_SIMD := -mavx2
endif
# Cross aarch64 smoke (build_arm64.sh): host x86 -> hedef arm64, libbpf/wasm yok
LG_CROSS_AARCH64 := 0
ifeq ($(ARCH),aarch64)
  ifneq ($(filter $(HOST_ARCH),x86_64 amd64),)
    LG_CROSS_AARCH64 := 1
  endif
endif
CFLAGS  = -Wall -Wextra -O2 -pthread $(ARCH_SIMD) \
          -D_POSIX_C_SOURCE=200809L \
          -DHAVE_LIBBPF \
          -fstack-protector-strong -D_FORTIFY_SOURCE=2 -fPIE
LDFLAGS = -pthread -pie -Wl,-z,relro,-z,now -Wl,-z,noexecstack

ifeq ($(LG_ASAN),1)
  CFLAGS += -fsanitize=address,undefined -fno-omit-frame-pointer
  LDFLAGS += -fsanitize=address,undefined
endif
LIBS    = -lsqlite3 -lcurl -lssl -lcrypto -lpcre2-8 \
          -lm -lbpf -lelf -lz -luring -ldl -lseccomp
# libbpf >= 0.8: bpf_xdp_attach/detach libxdp'de (Ubuntu CI + yeni laptop)
ifneq ($(shell pkg-config --exists libxdp 2>/dev/null && echo yes),)
  LIBS += -lxdp
endif

ifeq ($(LG_CROSS_AARCH64),1)
  override HAVE_WASM := 0
  override HAVE_MAXMINDDB := 0
  override HAVE_ZMQ := 0
  override HAVE_ETCD := 0
  CFLAGS := $(filter-out -DHAVE_LIBBPF,$(CFLAGS)) -DLG_NO_URING
  LIBS := $(filter-out -lbpf -lelf,$(LIBS))
  CROSS_SYSROOT := /usr/aarch64-linux-gnu
  CFLAGS += -I$(CROSS_SYSROOT)/include
  ifneq ($(wildcard /usr/include/aarch64-linux-gnu),)
    CFLAGS += -I/usr/include/aarch64-linux-gnu
  endif
  # --sysroot libm GROUP script'ini bozar; multiarch -L yeterli
  LDFLAGS += -L$(CROSS_SYSROOT)/lib
  ifneq ($(wildcard /usr/lib/aarch64-linux-gnu),)
    LDFLAGS += -L/usr/lib/aarch64-linux-gnu
  endif
  # libseccomp/pcre2/sqlite :arm64 -> /usr/include (aarch64-linux-gnu degil)
  CFLAGS += -idirafter /usr/include
  ifndef LG_QUIET_BUILD
    $(info [CROSS] aarch64 hedef — libbpf/wasm kapali (smoke))
  endif
endif

# ── ZeroMQ opsiyonel bagimliligi ──────────────────────────────
HAVE_ZMQ ?= $(shell pkg-config --exists libzmq 2>/dev/null && echo 1 || echo 0)
ifeq ($(HAVE_ZMQ),1)
  CFLAGS += -DHAVE_ZMQ
  LIBS   += $(shell pkg-config --libs libzmq)
  ifndef LG_QUIET_BUILD
    $(info [MESH] ZeroMQ bulundu, Mesh Intel etkin.)
  endif
else
  ifndef LG_QUIET_BUILD
    $(info [MESH] ZeroMQ bulunamadi, Mesh Intel devre disi (HAVE_ZMQ=0).)
  endif
endif

# ── MaxMind DB opsiyonel (offline GeoIP MMDB) ─────────────────
HAVE_MAXMINDDB ?= $(shell pkg-config --exists libmaxminddb 2>/dev/null && echo 1 || echo 0)
ifeq ($(HAVE_MAXMINDDB),1)
  CFLAGS += -DHAVE_MAXMINDDB
  LIBS   += $(shell pkg-config --libs libmaxminddb)
  ifndef LG_QUIET_BUILD
    $(info [GEOIP] libmaxminddb bulundu, MMDB offline lookup etkin.)
  endif
else
  ifndef LG_QUIET_BUILD
    $(info [GEOIP] libmaxminddb bulunamadi, MMDB devre disi (HAVE_MAXMINDDB=0).)
  endif
endif

# ── Etcd Mesh opsiyonel bagimliligi (Phase 5) ─────────────────
# -DHAVE_ETCD ile aktif; libcurl zaten LIBS'te mevcut.
# Devre disi birakmak icin: make HAVE_ETCD=0
HAVE_ETCD ?= 1
ifeq ($(HAVE_ETCD),1)
  CFLAGS += -DHAVE_ETCD
  ifndef LG_QUIET_BUILD
    $(info [ETCD] Etcd Mesh etkin (HAVE_ETCD=1). libcurl kullanilacak.)
  endif
else
  ifndef LG_QUIET_BUILD
    $(info [ETCD] Etcd Mesh devre disi (HAVE_ETCD=0).)
  endif
endif

# ── WebAssembly Plugin Destegi (Feature 4) ────────────────────────
# HAVE_WASM=1: Wasmtime C API (pkg-config veya vendor/wasmtime)
WASMTIME_ROOT ?= $(CURDIR)/vendor/wasmtime
ifeq ($(strip $(WASMTIME_ROOT)),)
  override WASMTIME_ROOT := $(CURDIR)/vendor/wasmtime
endif
HAVE_WASM ?= $(shell \
  if pkg-config --exists wasmtime 2>/dev/null; then echo 1; \
  elif test -f "$(WASMTIME_ROOT)/lib/libwasmtime.so" -o -f "$(WASMTIME_ROOT)/lib/libwasmtime.a"; then echo 1; \
  else echo 0; fi)
ifeq ($(HAVE_WASM),1)
  CFLAGS += -DHAVE_WASM
  WASM_LIBDIR = $(PREFIX)/lib/log-guardian
  ifeq ($(shell pkg-config --exists wasmtime 2>/dev/null && echo y),y)
    CFLAGS += $(shell pkg-config --cflags wasmtime)
    WASM_LIBS := $(shell pkg-config --libs wasmtime)
  else
    CFLAGS += -I"$(WASMTIME_ROOT)/include"
    WASM_LIBS := -L"$(WASMTIME_ROOT)/lib" -lwasmtime -lpthread -ldl -lm
    LDFLAGS += -Wl,-rpath,"$(WASM_LIBDIR)" -Wl,-rpath,"$(WASMTIME_ROOT)/lib"
  endif
  LIBS += $(WASM_LIBS)
  ifndef LG_QUIET_BUILD
    $(info [WASM] Wasmtime C API etkin (HAVE_WASM=1).)
  endif
else
  ifndef LG_QUIET_BUILD
    $(info [WASM] Wasmtime bulunamadi, Wasm stub modu aktif (HAVE_WASM=0).)
  endif
endif

# ── Hedef binary'ler ────────────────────────────────────────────
TARGET        = log-guardian
DAEMON        = log-guardian-daemon
TESTER        = tester
XDP_OBJ       = xdp_filter.o
UPROBE_OBJ    = tls_uprobe.o
SYSCALL_OBJ   = syscall_uprobe.o
LINEAGE_OBJ   = lineage_probe.o
HTTP_L7_OBJ   = http_l7_probe.o

# ── Analyzer kaynak dosyaları (yetkisiz proses) ───────────────────
SRCS = main.c parser.c anomaly.c db.c tui.c webhook.c telegram_bot.c \
       ip_map.c min_heap.c memory_pool.c pcre_engine.c \
       xdp_loader.c metrics.c siem_fsm.c logger.c \
       daemon_ipc.c ipc_auth.c ban_pipeline.c adaptive_threshold.c waf_rules.c \
       ja3_engine.c ja3_cluster.c dist_risk.c apt_graph.c deception.c covert_ch.c threat_feed.c \
       crypto_utils.c auth.c firewall.c trap_watcher.c api_server.c \
       k8s_guard.c k8s_webhook.c tarpit_server.c mesh_intel.c agent_sync.c \
       siem_forwarder.c etcd_mesh.c \
       schema_validator.c attack_tree.c attack_tree_snapshot.c wasm_runtime.c daemon_stats.c mesh_backend.c incident_engine.c rules_fleet.c \
       falco_host_rules.c endpoint_baseline.c geoip_feed.c geoip_lookup.c tenant_db.c tenant_policy.c fp_trust.c ban_policy.c rules_bundle_verify.c l7_telemetry.c
OBJS = $(SRCS:.c=.o)

# ── eBPF daemon kaynak dosyaları (root prosesi) ──────────────────
DAEMON_SRCS = ebpf_daemon.c daemon_ipc.c ipc_auth.c crypto_utils.c daemon_stats.c logger.c k8s_guard.c k8s_webhook.c attack_tree.c falco_host_rules.c firewall.c
DAEMON_OBJS = $(DAEMON_SRCS:.c=.daemon.o)

# ── CO-RE: vmlinux.h hedef makinenin BTF'inden üretilir ──────
VMLINUX_H = vmlinux.h

all: $(TARGET) $(DAEMON) $(TESTER) $(XDP_OBJ) $(UPROBE_OBJ) $(SYSCALL_OBJ) $(LINEAGE_OBJ) $(HTTP_L7_OBJ)

.PHONY: binaries refresh-binaries upgrade-binaries
# Ikili paket: degisen kaynaklara gore artimli derleme
binaries: $(TARGET) $(DAEMON)
	@echo "[OK] binaries: $(TARGET) + $(DAEMON)"

# Prod upgrade: her iki binary zorla yeniden derlenir (upgrade_log_guardian_binary.sh)
refresh-binaries upgrade-binaries:
	$(MAKE) -B $(TARGET) $(DAEMON)
	@echo "[OK] refresh-binaries: $(TARGET) + $(DAEMON)"

# ── Ana analyzer binary ───────────────────────────────────────
$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $(OBJS) $(LIBS)

# ── eBPF daemon binary (ayrı, yalnızca libbpf + logger) ──────
# Her kaynak .daemon.o olarak derlenir (farklı nesne uzayı)
$(DAEMON): $(DAEMON_OBJS)
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ $(DAEMON_OBJS) \
	      -lbpf -lelf -lz -ldl -luring -lcurl

%.daemon.o: %.c
	$(CC) $(CFLAGS) -DLOG_GUARDIAN_DAEMON -c $< -o $@

# ── Tester ───────────────────────────────────────────────────
$(TESTER): tester.c
	$(CC) $(CFLAGS) $(LDFLAGS) -o $@ tester.c

# ── CO-RE: vmlinux.h — hedef çekirdek BTF'ini kullan ─────────
# bpftool yoksa dosya uretilmez; bpf_compat.h geleneksel linux/*.h kullanir.
BPF_CLANG  = clang
BPF_CFLAGS = -O2 -g -target bpf -D__TARGET_ARCH_x86 \
             -D__BPF_TRACING__ \
             -I. \
             -I/usr/include/bpf \
             -idirafter /usr/include/x86_64-linux-gnu \
             -idirafter /usr/include

# vmlinux.h yoksa geleneksel linux/types.h (bpf_compat fallback)
BPF_CFLAGS_FALLBACK = $(BPF_CFLAGS) -include linux/types.h

$(VMLINUX_H):
	@if [ -f $@ ] && [ $$(wc -c < $@) -lt 4096 ]; then rm -f $@; fi
	@if command -v bpftool >/dev/null 2>&1 && \
	    [ -f /sys/kernel/btf/vmlinux ]; then \
	    echo "[CORE] vmlinux.h uretiliyor..."; \
	    if bpftool btf dump file /sys/kernel/btf/vmlinux format c > $@.tmp 2>/dev/null \
	       && [ $$(wc -c < $@.tmp) -gt 4096 ]; then \
	      mv $@.tmp $@; \
	      echo "[CORE] vmlinux.h hazir ($$(wc -l < $@) satir)."; \
	    else \
	      rm -f $@ $@.tmp; \
	      echo "[CORE] vmlinux.h uretilemedi — geleneksel linux/*.h ile derlenecek."; \
	    fi; \
	elif [ -f $@ ]; then \
	    echo "[CORE] vmlinux.h mevcut ($$(wc -l < $@) satir)."; \
	else \
	    echo "[CORE] bpftool/BTF yok — geleneksel linux/*.h ile derlenecek."; \
	fi

# ── XDP/eBPF kernel nesnesi (CO-RE) ──────────────────────────
# VPS strict verifier: XDP_MINIMAL=1 make xdp_filter.o  (xdp_filter_min.c)
ifeq ($(XDP_MINIMAL),1)
$(XDP_OBJ): xdp_filter_min.c bpf_compat.h
	@echo "[CORE] XDP_MINIMAL=1 — blacklist-only (VPS verifier-safe)"
	$(BPF_CLANG) $(BPF_CFLAGS_FALLBACK) -DBPF_NO_VMLINUX -c xdp_filter_min.c -o $@
else
$(XDP_OBJ): xdp_filter.c bpf_compat.h $(VMLINUX_H)
	$(BPF_CLANG) $(shell if [ -f vmlinux.h ] && [ $$(wc -c < vmlinux.h) -gt 4096 ]; then echo '$(BPF_CFLAGS)'; else echo '$(BPF_CFLAGS_FALLBACK)'; fi) -c xdp_filter.c -o $@
endif

# ── eBPF uprobe nesnesi (TLS In-Memory Sensor) ────────────────────
# tls_uprobe.c yalnizca __BPF_TRACING__ kapsaminda derlenir.
# Linux >= 5.5 (uprobe + ring buffer) gerektirir.
$(UPROBE_OBJ): tls_uprobe.c bpf_compat.h $(VMLINUX_H)
	$(BPF_CLANG) $(shell if [ -f vmlinux.h ] && [ $$(wc -c < vmlinux.h) -gt 4096 ]; then echo '$(BPF_CFLAGS)'; else echo '$(BPF_CFLAGS_FALLBACK)'; fi) -c tls_uprobe.c -o $@

# ── eBPF execve tracepoint nesnesi (Zero Trust RCE Sensor) ──────────
# sys_enter_execve hook'u: web proseslerin shell spawn etmesini engeller.
# Linux >= 5.8 (ring buffer + cgroup helpers) gerektirir.
$(SYSCALL_OBJ): syscall_uprobe.c bpf_compat.h $(VMLINUX_H)
	$(BPF_CLANG) $(shell if [ -f vmlinux.h ] && [ $$(wc -c < vmlinux.h) -gt 4096 ]; then echo '$(BPF_CFLAGS)'; else echo '$(BPF_CFLAGS_FALLBACK)'; fi) -c syscall_uprobe.c -o $@

# ── eBPF Lineage Probe (Process & Network Soyağacı — Feature 3) ──────
# openat/execve/connect/write tracepoint'lari; Attack Tree olusturur.
# Linux >= 5.8 (ring buffer) gerektirir.
$(LINEAGE_OBJ): lineage_probe.c bpf_compat.h $(VMLINUX_H)
	$(BPF_CLANG) $(shell if [ -f vmlinux.h ] && [ $$(wc -c < vmlinux.h) -gt 4096 ]; then echo '$(BPF_CFLAGS)'; else echo '$(BPF_CFLAGS_FALLBACK)'; fi) -c lineage_probe.c -o $@

$(HTTP_L7_OBJ): http_l7_probe.c bpf_compat.h $(VMLINUX_H)
	$(BPF_CLANG) $(shell if [ -f vmlinux.h ] && [ $$(wc -c < vmlinux.h) -gt 4096 ]; then echo '$(BPF_CFLAGS)'; else echo '$(BPF_CFLAGS_FALLBACK)'; fi) -c http_l7_probe.c -o $@


# ── Genel .o kuralı ───────────────────────────────────────────
daemon_ipc.o daemon_ipc.daemon.o: daemon_ipc.c daemon_ipc.h ipc_auth.h
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# ── Temizlik ──────────────────────────────────────────────────────────
clean:
	rm -f $(OBJS) $(DAEMON_OBJS) \
	      $(TARGET) $(DAEMON) $(TESTER) \
	      $(XDP_OBJ) $(UPROBE_OBJ) $(SYSCALL_OBJ) $(LINEAGE_OBJ) $(HTTP_L7_OBJ) \
	      events.db $(VMLINUX_H)

# ── Kurulum ──────────────────────────────────────────────────
install: $(TARGET) $(DAEMON)
	install -d "$(DESTDIR)$(BINDIR)"
	install -m 755 $(TARGET) "$(DESTDIR)$(BINDIR)/"
	install -m 755 $(DAEMON)  "$(DESTDIR)$(BINDIR)/"
	@if [ -f $(TESTER) ]; then install -m 755 $(TESTER) "$(DESTDIR)$(BINDIR)/"; fi

	install -d "$(DESTDIR)$(CONFDIR)"
	if [ ! -f "$(DESTDIR)$(CONFDIR)/rules.conf" ]; then \
		install -m 640 rules.conf "$(DESTDIR)$(CONFDIR)/"; \
		chown root:log-guardian "$(DESTDIR)$(CONFDIR)/rules.conf" 2>/dev/null || true; \
	fi
	@if [ ! -f "$(DESTDIR)$(CONFDIR)/threat_feed_stats.json" ]; then \
		printf '%s\n' '{"last_sync_ts":0,"last_applied":0,"last_skipped_whitelist":0,"last_failed":0,"total_iocs":0,"last_error":""}' \
			> "$(DESTDIR)$(CONFDIR)/threat_feed_stats.json"; \
		chmod 660 "$(DESTDIR)$(CONFDIR)/threat_feed_stats.json" 2>/dev/null || true; \
		chown root:log-guardian "$(DESTDIR)$(CONFDIR)/threat_feed_stats.json" 2>/dev/null || true; \
	fi
	install -d "$(DESTDIR)$(CONFDIR)/rules"
	install -m 644 rules/crs-core.rules "$(DESTDIR)$(CONFDIR)/rules/" 2>/dev/null || true
	install -m 644 rules/crs-bundle.rules "$(DESTDIR)$(CONFDIR)/rules/" 2>/dev/null || true

	@if [ -f $(XDP_OBJ) ]; then install -m 755 $(XDP_OBJ) "$(DESTDIR)$(CONFDIR)/"; fi
	@if [ -f $(UPROBE_OBJ) ]; then install -m 755 $(UPROBE_OBJ) "$(DESTDIR)$(CONFDIR)/"; fi
	@if [ -f $(SYSCALL_OBJ) ]; then install -m 755 $(SYSCALL_OBJ) "$(DESTDIR)$(CONFDIR)/"; fi
	@if [ -f $(LINEAGE_OBJ) ]; then install -m 755 $(LINEAGE_OBJ) "$(DESTDIR)$(CONFDIR)/"; fi
	@if [ -f $(HTTP_L7_OBJ) ]; then install -m 755 $(HTTP_L7_OBJ) "$(DESTDIR)$(CONFDIR)/"; fi

	@if [ "$(HAVE_WASM)" = "1" ] && [ -f "$(WASMTIME_ROOT)/lib/libwasmtime.so" ]; then \
		install -d "$(DESTDIR)$(PREFIX)/lib/log-guardian"; \
		install -m 755 "$(WASMTIME_ROOT)/lib/libwasmtime.so" "$(DESTDIR)$(PREFIX)/lib/log-guardian/"; \
	fi

	@if [ -z "$(LG_QUIET_BUILD)" ]; then \
		echo ""; \
		echo "Kurulum tamamlandi."; \
		echo "Daemon baslatmak icin  : systemctl enable --now log-guardian-daemon"; \
		echo "Analyzer baslatmak icin: systemctl enable --now log-guardian"; \
		echo "Binary guncellediyseniz   : sudo bash scripts/upgrade_log_guardian_binary.sh"; \
		echo "Elle derleme (ikisi birden): make refresh-binaries"; \
	fi

# ── Derleme modları ───────────────────────────────────────────
debug: CFLAGS := $(filter-out -D_FORTIFY_SOURCE=2,$(CFLAGS))
debug: CFLAGS += -g -O0 -DDEBUG
debug: all

asan: clean
	$(MAKE) LG_ASAN=1 binaries
	@echo "[OK] asan: AddressSanitizer + UBSan binaries"

bench: CFLAGS += -O3 -march=native -flto
bench: all

bench-run: all

bench-report: all
	bash scripts/bench_report.sh
	@bash scripts/bench.sh

# ── Güvenlik testi ───────────────────────────────────────────
XFF_TEST = tests/parser_xff_test
AUTH_TEST = tests/parser_auth_test
FUZZ_TEST = tests/parser_fuzz_test
DIST_RISK_TEST = tests/dist_risk_test
FIREWALL_XFF_OBJ = firewall.xff.o

$(FIREWALL_XFF_OBJ): firewall.c
	$(CC) $(CFLAGS) -DLOG_GUARDIAN_DAEMON -c firewall.c -o $@

$(XFF_TEST): tests/parser_xff_test.c parser.o $(FIREWALL_XFF_OBJ)
	$(CC) $(CFLAGS) -I. $(LDFLAGS) -o $@ tests/parser_xff_test.c parser.o $(FIREWALL_XFF_OBJ)

$(AUTH_TEST): tests/parser_auth_test.c parser.o $(FIREWALL_XFF_OBJ)
	$(CC) $(CFLAGS) -I. $(LDFLAGS) -o $@ tests/parser_auth_test.c parser.o $(FIREWALL_XFF_OBJ)

$(FUZZ_TEST): tests/parser_fuzz_test.c parser.o $(FIREWALL_XFF_OBJ)
	$(CC) $(CFLAGS) -I. $(LDFLAGS) -o $@ tests/parser_fuzz_test.c parser.o $(FIREWALL_XFF_OBJ)

$(DIST_RISK_TEST): tests/dist_risk_test.c dist_risk.o geoip_lookup.o
	$(CC) $(CFLAGS) -I. $(LDFLAGS) -o $@ tests/dist_risk_test.c dist_risk.o geoip_lookup.o $(LIBS)

xff-test: $(XFF_TEST)
	@./$(XFF_TEST)

auth-test: $(AUTH_TEST)
	@./$(AUTH_TEST)

fuzz-test: $(FUZZ_TEST)
	@./$(FUZZ_TEST)

dist-risk-test: $(DIST_RISK_TEST)
	@./$(DIST_RISK_TEST)

parser-test: xff-test auth-test fuzz-test

security-test: $(TARGET) $(TESTER)
	@echo "--- Security Testleri (Memory & Async Attack) ---"
	@./tester --mode sqli          --host 127.0.0.1 --port 80 &
	@./tester --mode slow          --host 127.0.0.1 --port 80 &
	@echo "Test bitti."

# ── Intelligence Motoru Testleri ─────────────────────────────
intel-test: $(TESTER)
	@echo "--- Intelligence Engine Testleri ---"
	@echo "[1/3] JA3 Fingerprint testi (443 portuna TLS baglanti)..."
	@./tester --mode ja3-test       --host 127.0.0.1 --port 443 || true
	@echo "[2/3] APT Swarm testi (10 farkli IP, ayni payload)..."
	@./tester --mode apt-swarm      --host 127.0.0.1 --count 10 --payload "/../etc/passwd" || true
	@echo "[3/3] Cookie Entropy testi (exfil simulasyonu)..."
	@./tester --mode cookie-entropy --host 127.0.0.1 --port 80  || true
	@echo "--- Intel testleri tamamlandi ---"

# ── Bağımlılık kontrolu ───────────────────────────────────────
check-deps:
	@echo "=== Bagimlilik Kontrolu ==="
	@DEPS_OK=1; \
	for cmd in clang pkg-config bpftool; do \
	    if command -v $$cmd >/dev/null 2>&1; then echo "  [ OK ] $$cmd"; \
	    else echo "  [EKSIK] $$cmd"; DEPS_OK=0; fi; \
	done; \
	for lib in liburing libpcre2-8 sqlite3 libcurl libmaxminddb; do \
	    if pkg-config --exists $$lib 2>/dev/null; then echo "  [ OK ] lib $$lib"; \
	    elif [ "$$lib" = "libmaxminddb" ]; then echo "  [INFO] lib $$lib (opsiyonel MMDB offline)"; \
	    else echo "  [EKSIK] lib $$lib"; DEPS_OK=0; fi; \
	done; \
	[ -f /sys/kernel/btf/vmlinux ] && echo "  [ OK ] BTF (CO-RE native)" || echo "  [WARN] BTF yok - fallback kullanilacak"; \
	echo "  [INFO] Kernel: $$(uname -r)"; \
	echo "  [INFO] Etcd Mesh: HAVE_ETCD=$(HAVE_ETCD), ZeroMQ: HAVE_ZMQ=$(HAVE_ZMQ), MMDB: HAVE_MAXMINDDB=$(HAVE_MAXMINDDB)"; \
	[ $$DEPS_OK -eq 1 ] && echo "=== Tum bagimliliklar mevcut ===" || echo "=== EKSIK bagimliliklar var ==="

# ── XDP'siz fallback (eski kernel / BTF yoksa) ───────────────
fallback: CFLAGS += -DXDP_DISABLED
fallback: $(TARGET) $(DAEMON) $(TESTER)
	@echo "[FALLBACK] XDP devre disi derlendi. iptables/nftables modu aktif."

# ── Prod Wasm release (Wasmtime + hot-plug) ───────────────────
wasm-release:
	bash scripts/wasm_release.sh

release: wasm-release
	@echo "[release] log-guardian HAVE_WASM=1 hazir — tam kapı:"
	@echo "  bash scripts/competitive_suite.sh"

print-maxminddb:
	@echo "$(HAVE_MAXMINDDB)"

.PHONY: all clean install debug asan bench bench-run bench-report security-test xff-test auth-test fuzz-test intel-test check-deps fallback wasm-release release print-maxminddb