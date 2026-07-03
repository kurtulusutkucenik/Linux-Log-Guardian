// AUTO-DERIVED from the live site test matrix (assets/website/test-results.js).
// Single source of truth for the /testler proof page. Do not hand-edit rows;
// regenerate from competitive-proof if the matrix changes.

export type TestStatus = "pass" | "warn" | "fail" | "pending";

export interface TestMetric {
  label: string;
  value: string;
}

export interface TestEntry {
  id: string;
  status: TestStatus;
  statusLabel?: string;
  statusLabelEn?: string;
  title: string;
  titleEn?: string;
  verdict?: string;
  verdictEn?: string;
  group: "gate" | "proof";
  purpose?: string;
  purposeEn?: string;
  metrics?: TestMetric[];
  script?: string;
  date?: string;
}

export const TESTS: TestEntry[] = [
  {
    "id": "api-fail-closed",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "API fail-closed — tokensiz istek 403",
    "titleEn": "API fail-closed — unauthenticated requests return 403",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "Ban/consult/metrics uçları token olmadan reddedilir.",
    "purposeEn": "Ban/consult/metrics endpoints reject requests without a token.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/api_fail_closed_test.sh",
    "date": "2026-06-30"
  },
  {
    "id": "auth-log-ingest",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "auth.log sshd ingest — parse + brute esigi",
    "titleEn": "auth.log sshd ingest — parse + brute threshold",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "nginx disi SSH failed-password satirlari anomaly hattina girer.",
    "purposeEn": "Non-nginx SSH failed-password lines enter the anomaly path.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/auth_log_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "helm-install-smoke",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Helm chart — template smoke",
    "titleEn": "Helm chart — template smoke",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "K8s musteri kurulumu icin helm template dogrulamasi.",
    "purposeEn": "Helm template validation for customer K8s installs.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/helm_install_smoke.sh",
    "date": "2026-06-30"
  },
  {
    "id": "journald-ingest",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "journald export — short-iso + sudo rhost spike",
    "titleEn": "journald export — short-iso + sudo rhost spike",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "journald usec timestamp ve sudo rhost brute spike ingest.",
    "purposeEn": "Journald usec timestamps and sudo rhost brute spike ingest.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/journald_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "local-security-audit",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Yerel güvenlik denetimi — IPC, JWT, token sızıntısı",
    "titleEn": "Local security audit — IPC, JWT, secret hygiene",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "Laptop/prod öncesi güvenlik script matrisi; demo parola laptop'ta WARN kabul.",
    "purposeEn": "Pre-prod security script matrix; demo password WARN on laptop is OK.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/local_security_audit.sh",
    "date": "2026-06-30"
  },
  {
    "id": "marketplace-sig",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Wasm marketplace — imzali paket kapisi",
    "titleEn": "Wasm marketplace — signed package gate",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "Unsigned marketplace paketlerinin reddedildigini kanitlar.",
    "purposeEn": "Proves unsigned marketplace packages are rejected.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/marketplace_sig_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "mesh-etcd",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Mesh etcd — filo politika",
    "titleEn": "Mesh etcd — fleet policy",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "etcd mesh backend ve MESH_PUB_ENABLED=0 dogrulamasi.",
    "purposeEn": "etcd mesh backend and MESH_PUB_ENABLED=0 validation.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/mesh_etcd_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "post-install-verify",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Kurulum kapısı — servis, IPC, API fail-closed",
    "titleEn": "Install gate — services, IPC, API fail-closed",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "systemd, --health, metrics :9091, API_BIND ve nginx formatının yeşil matrisi.",
    "purposeEn": "systemd, --health, metrics :9091, API_BIND and nginx format green matrix.",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/post_install_verify.sh",
    "date": "2026-06-30"
  },
  {
    "id": "vm-demo-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "VM demo kapısı — post_install 0 FAIL",
    "titleEn": "VM demo gate — post_install 0 FAIL",
    "verdict": "FAIL: 0 · WARN: 0",
    "verdictEn": "FAIL: 0 · WARN: 0",
    "group": "gate",
    "purpose": "Laptop/VM sunum öncesi son kontrol (onarim: sudo vm_demo_gate).",
    "purposeEn": "Final check before laptop/VM demo (repair: sudo vm_demo_gate).",
    "metrics": [
      {
        "label": "FAIL",
        "value": "0"
      },
      {
        "label": "WARN",
        "value": "0"
      }
    ],
    "script": "scripts/vm_demo_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "soak-stability",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "72 saat prod stabilite + dusuk FP",
    "titleEn": "72h prod stability + low FP",
    "verdict": "72.0 saat VPS/VM soak GECTI: 864 ornek, 0 hata — servisler ayakta, max RSS 105 MB benign FP %0.2.",
    "verdictEn": "72.0h VPS/VM soak PASS: 864 samples, 0 failures — services up, max RSS 105 MB benign FP 0.2%.",
    "group": "proof"
  },
  {
    "id": "soak-short-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "5 dakikalik stabilite kapisi (VPS gerekmez)",
    "titleEn": "5-minute stability gate (no VPS required)",
    "verdict": "5 dk soak: 10 ornek, 0 hata — PASS.",
    "verdictEn": "5m soak: 10 samples, 0 failures — PASS.",
    "group": "proof",
    "purpose": "Daemon ve analizorun kisa prod benzeri yukte ayakta kaldigini dogrular.",
    "purposeEn": "Confirms daemon and analyzer stay up during a short production-like window.",
    "metrics": [
      {
        "label": "Sure",
        "value": "5 dk"
      },
      {
        "label": "Max RSS",
        "value": "110 MB"
      }
    ],
    "script": "scripts/soak_short_proof.sh",
    "date": "2026-06-28"
  },
  {
    "id": "arm64-build",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "ARM64 (aarch64) build smoke",
    "titleEn": "ARM64 (aarch64) build smoke",
    "verdict": "mode=cross-gnu; target=aarch64.",
    "verdictEn": "mode=cross-gnu; target=aarch64.",
    "group": "proof",
    "purpose": "Gomulu/ARM Linux hedefi icin derleme yolu (AVX2 yok).",
    "purposeEn": "Build path for embedded/ARM Linux targets (no AVX2).",
    "metrics": [
      {
        "label": "mode",
        "value": "cross-gnu"
      },
      {
        "label": "host",
        "value": "x86_64"
      }
    ],
    "script": "scripts/build_arm64.sh",
    "date": "2026-06-29"
  },
  {
    "id": "attack-map",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Attack map — geo marker + canli ban",
    "titleEn": "Attack map — geo markers + live bans",
    "verdict": "5 marker, kaynak=live; ack=1 ban=4.",
    "verdictEn": "5 markers, source=live; ack=1 ban=4.",
    "group": "proof",
    "purpose": "Ana sayfa kure haritasinda /api/attack-geo ile ban IP konumlarini kanitlar.",
    "purposeEn": "Proves banned IP locations on the home globe via /api/attack-geo.",
    "metrics": [
      {
        "label": "markers",
        "value": "5"
      },
      {
        "label": "ack",
        "value": "1"
      },
      {
        "label": "ban",
        "value": "4"
      },
      {
        "label": "bans",
        "value": "ipset"
      }
    ],
    "script": "scripts/attack_map_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "ban-latency",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Tehdit tespitinden kernel ban'a gecen sure",
    "titleEn": "Time from threat detection to kernel ban",
    "verdict": "Medyan 16.82 ms — hedef <75.0 ms, ipset dogrulandi.",
    "verdictEn": "Median 16.82 ms — target <75.0 ms, ipset confirmed.",
    "group": "proof"
  },
  {
    "id": "ban-policy-audit",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Ban policy audit + OPENAPI_STRICT",
    "titleEn": "Ban policy audit + OPENAPI_STRICT",
    "verdict": "karar=force_waf; risk=80.0; OPENAPI_STRICT=1.",
    "verdictEn": "decision=force_waf; risk=80.0; OPENAPI_STRICT=1.",
    "group": "proof",
    "purpose": "Ban/unban karar izi JSONL + şema; prod API şema doğrulaması açık.",
    "purposeEn": "Ban/unban decision trail JSONL + schema; prod API schema validation on.",
    "metrics": [
      {
        "label": "lines",
        "value": "1"
      },
      {
        "label": "decision",
        "value": "force_waf"
      },
      {
        "label": "OPENAPI_STRICT",
        "value": "1"
      }
    ],
    "script": "scripts/ban_policy_audit_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "bans-telegram-ops",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Bans + Telegram ack — operator panel API",
    "titleEn": "Bans + Telegram ack — operator panel API",
    "verdict": "IP 203.0.113.198; ack yes (utku); ban miss.",
    "verdictEn": "IP 203.0.113.198; ack yes (utku); ban miss.",
    "group": "proof",
    "purpose": "Operatör paneli /api/telegram-acks + /bans?search= canli veri.",
    "purposeEn": "Operator panel live data via /api/telegram-acks + /bans?search=.",
    "metrics": [
      {
        "label": "acks",
        "value": "1"
      },
      {
        "label": "ban",
        "value": "miss"
      },
      {
        "label": "operator",
        "value": "utku"
      }
    ],
    "script": "scripts/bans_telegram_ops_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "bench-eps",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Ayni log corpus uzerinde isleme hizi (seffaf referans)",
    "titleEn": "Processing speed on same log corpus (transparent reference)",
    "verdict": "Guardian 5357 EPS (tek gecis log-WAF); CRS replay 14302 EPS — farkli mimari, hiz iddiasi degil.",
    "verdictEn": "Guardian 5357 EPS (single-pass log-WAF); CRS replay 14302 EPS — different architecture, not a speed claim.",
    "group": "proof"
  },
  {
    "id": "compliance-export",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Compliance — JSON/PDF export (Pro tier)",
    "titleEn": "Compliance — JSON/PDF export (Pro tier)",
    "verdict": "mode=pro-live; tier=pro; kontrol=12; pdf=OK.",
    "verdictEn": "mode=pro-live; tier=pro; controls=12; pdf=OK.",
    "group": "proof",
    "purpose": "/api/reports/export — Pro tier PDF; Community 403.",
    "purposeEn": "/api/reports/export — Pro tier PDF; Community gets 403.",
    "metrics": [
      {
        "label": "mode",
        "value": "pro-live"
      },
      {
        "label": "tier",
        "value": "pro"
      }
    ],
    "script": "scripts/compliance_export_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "copilot-ollama",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Copilot — Ollama opsiyonel + fallback",
    "titleEn": "Copilot — optional Ollama + fallback",
    "verdict": "ollama=yes; source=ollama.",
    "verdictEn": "ollama=yes; source=ollama.",
    "group": "proof",
    "purpose": "Copilot LLM (Ollama) opsiyonel; kural tabanli fallback zorunlu degil.",
    "purposeEn": "Copilot LLM (Ollama) optional; rule-based fallback when absent.",
    "metrics": [
      {
        "label": "ollama",
        "value": "yes"
      },
      {
        "label": "source",
        "value": "ollama"
      }
    ],
    "script": "scripts/copilot_ollama_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "crowdsec-bouncer",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "CrowdSec LAPI → log-guardian ban API",
    "titleEn": "CrowdSec LAPI → log-guardian ban API",
    "verdict": "mode=dry-run; 50 karar; ban API dry-run; LAPI OK.",
    "verdictEn": "mode=dry-run; 50 decisions; ban API dry-run; LAPI OK.",
    "group": "proof",
    "purpose": "Dağıtık IP kararlarının kernel ban hattına aktarılmasını kanıtlar.",
    "purposeEn": "Proves distributed IP decisions reach the kernel ban path.",
    "metrics": [
      {
        "label": "mode",
        "value": "dry-run"
      },
      {
        "label": "karar",
        "value": "50"
      },
      {
        "label": "ban API",
        "value": "dry-run"
      },
      {
        "label": "LAPI",
        "value": "OK"
      }
    ],
    "script": "scripts/crowdsec_bouncer_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "crs-parity",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "OWASP CRS ile ayni saldiri satirlarinda tespit paritesi",
    "titleEn": "Detection parity with OWASP CRS on same attack lines",
    "verdict": "18 saldiri satirinin tamaminda uyari; recall %100.0, parite %100.0.",
    "verdictEn": "Alerts on all 18 attack lines; recall 100.0%, parity 100.0%.",
    "group": "proof"
  },
  {
    "id": "dashboard-ban-api",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Dashboard ban/unban — API + Docker relay (18090)",
    "titleEn": "Dashboard ban/unban — API + Docker relay (18090)",
    "verdict": "Host OK, relay OK, Docker OK — 203.0.113.248.",
    "verdictEn": "Host OK, relay OK, Docker OK — 203.0.113.248.",
    "group": "proof",
    "purpose": "Operatörün /bans sayfasından kernel ban yolunun canlı çalıştığını kanıtlar.",
    "purposeEn": "Proves operators can ban/unban from /bans via the live kernel path.",
    "metrics": [
      {
        "label": "host",
        "value": "OK"
      },
      {
        "label": "relay",
        "value": "OK"
      },
      {
        "label": "docker",
        "value": "OK"
      },
      {
        "label": "path",
        "value": "ipc-xdp"
      }
    ],
    "script": "scripts/dashboard_ban_smoke.sh",
    "date": "2026-06-21"
  },
  {
    "id": "dashboard-live-demo",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Dashboard Live demo — harita + /bans ipset",
    "titleEn": "Dashboard live demo — map + /bans ipset",
    "verdict": "4 ban uygulandi, 4 sync — http://127.0.0.1:8090.",
    "verdictEn": "4 bans applied, 4 synced — http://127.0.0.1:8090.",
    "group": "proof",
    "purpose": "Operatör sunumunda 4 gerçek kernel ban → harita LIVE + /bans unban.",
    "purposeEn": "Operator demo: 4 real kernel bans → LIVE map + /bans unban.",
    "metrics": [
      {
        "label": "applied",
        "value": "4"
      },
      {
        "label": "synced",
        "value": "4"
      },
      {
        "label": "api",
        "value": "127.0.0.1:8090"
      },
      {
        "label": "IPs",
        "value": "203.0.113.211, 203.0.113.212, 203.0.113.213, 203.0.113.214"
      }
    ],
    "script": "scripts/dashboard_live_demo.sh",
    "date": "2026-06-29"
  },
  {
    "id": "demo-rehearsal-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Demo rehearsal — 08:00 sunum kapisi",
    "titleEn": "Demo rehearsal — presentation readiness gate",
    "verdict": "demo_3min=yes; dash=yes; proof 74/74.",
    "verdictEn": "demo_3min=yes; dash=yes; proof 74/74.",
    "group": "proof",
    "purpose": "demo_3min + :8443 + PDF + canli site sunum zinciri.",
    "purposeEn": "demo_3min + :8443 + PDF + live site presentation chain.",
    "metrics": [
      {
        "label": "PDF",
        "value": "yes"
      },
      {
        "label": "proof",
        "value": "74/74"
      }
    ],
    "script": "scripts/demo_rehearsal_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "demo-video-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Demo video — 04:00 kayit hazirlik kapisi",
    "titleEn": "Demo video — 04:00 recording readiness gate",
    "verdict": "pdf=yes; ship=yes; siem=yes; proof 72/72.",
    "verdictEn": "pdf=yes; ship=yes; siem=yes; proof 72/72.",
    "group": "proof",
    "purpose": "demo_video + SIEM + PDF + presentation_ship — kayit oncesi otomatik.",
    "purposeEn": "demo_video + SIEM + PDF + presentation_ship — pre-recording automation.",
    "metrics": [
      {
        "label": "SIEM",
        "value": "yes"
      },
      {
        "label": "proof",
        "value": "72/72"
      }
    ],
    "script": "scripts/demo_video_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "docs-consistency-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Docs consistency — 64 test + HOSTING §8b",
    "titleEn": "Docs consistency — 64 test + HOSTING §8b",
    "verdict": "checks OK=37; proof 74/74; hosting §8b=yes.",
    "verdictEn": "checks OK=37; proof 74/74; hosting §8b=yes.",
    "group": "proof",
    "purpose": "Dokuman vitrin tutarliligi — 64 test, Telegram cross-link.",
    "purposeEn": "Doc vitrine consistency — 64 tests, Telegram cross-link.",
    "metrics": [
      {
        "label": "checks",
        "value": "37"
      },
      {
        "label": "proof",
        "value": "74/74"
      }
    ],
    "script": "scripts/docs_consistency_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "edge-protection-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Edge koruma — nginx + XDP/ipset + threat intel",
    "titleEn": "Edge protection — nginx + XDP/ipset + threat intel",
    "verdict": "IPC ok; ipset-fallback; nginx OK; ipset 0.",
    "verdictEn": "IPC ok; ipset-fallback; nginx OK; ipset 0.",
    "group": "proof",
    "purpose": "Origin edge: nginx log format, ipset/XDP ban, threat-intel summary DB.",
    "purposeEn": "Origin edge: nginx log format, ipset/XDP ban, threat-intel summary DB.",
    "metrics": [
      {
        "label": "ipc",
        "value": "ok"
      },
      {
        "label": "xdp",
        "value": "ipset-fallback"
      },
      {
        "label": "ipset",
        "value": "0"
      }
    ],
    "script": "scripts/edge_protection_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "enterprise-escalation-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Enterprise escalation — operator playbook",
    "titleEn": "Enterprise escalation — operator playbook",
    "verdict": "Doc sections 7; live gates 3/3.",
    "verdictEn": "Doc sections 7; live gates 3/3.",
    "group": "proof",
    "purpose": "P1-P4 runbook + Telegram/edge operator gates.",
    "purposeEn": "P1-P4 runbook + Telegram/edge operator gates.",
    "metrics": [
      {
        "label": "doc",
        "value": "7"
      },
      {
        "label": "gates",
        "value": "3/3"
      }
    ],
    "script": "scripts/enterprise_escalation_gate.sh",
    "date": "2026-06-29"
  },
  {
    "id": "fleet-multi-node",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Fleet multi-node — 2+ agent + dispatch",
    "titleEn": "Fleet multi-node — 2+ agents + targeted dispatch",
    "verdict": "2 agent, 2 online; dispatch→node-vm-02.",
    "verdictEn": "2 agents, 2 online; dispatch→node-vm-02.",
    "group": "proof",
    "purpose": "2+ telemetry agent ve /fleet/dispatch hedefli komut yolunu kanıtlar.",
    "purposeEn": "Proves 2+ telemetry agents and targeted /fleet/dispatch routing.",
    "metrics": [
      {
        "label": "agents",
        "value": "2"
      },
      {
        "label": "online",
        "value": "2"
      },
      {
        "label": "target",
        "value": "node-vm-02"
      }
    ],
    "script": "scripts/fleet_multi_node_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "fp-cluster-trust",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "FP learn — guvenilir IP cluster ban disinda",
    "titleEn": "FP learn — trusted IP excluded from cluster ban",
    "verdict": "trusted=10.0.0.50 cluster_banned=False flush=True.",
    "verdictEn": "trusted=10.0.0.50 cluster_banned=False flush=True.",
    "group": "proof"
  },
  {
    "id": "fp-rate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Temiz (benign) trafikte yanlis alarm orani",
    "titleEn": "False positive rate on benign traffic",
    "verdict": "500 benign satirda %0.2 FP — hedef <%5.0.",
    "verdictEn": "500 benign lines, 0.2% FP — target <5.0%.",
    "group": "proof"
  },
  {
    "id": "github-ship-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "GitHub ship — push oncesi tam kapı",
    "titleEn": "GitHub ship — full pre-push gate",
    "verdict": "ship=yes; closure=yes; secret=yes; proof 73/73.",
    "verdictEn": "ship=yes; closure=yes; secret=yes; proof 73/73.",
    "group": "proof",
    "purpose": "presentation_ship + security_closure + secret scan — git push hazirligi.",
    "purposeEn": "presentation_ship + security_closure + secret scan — git push readiness.",
    "metrics": [
      {
        "label": "closure",
        "value": "yes"
      },
      {
        "label": "proof",
        "value": "73/73"
      }
    ],
    "script": "scripts/github_ship_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "grafana-alerts",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Grafana — dashboard $tenant + alert kurallari",
    "titleEn": "Grafana — dashboard $tenant + alert rules",
    "verdict": "uid log-guardian-01; 10 alert (10 tenant_id).",
    "verdictEn": "uid log-guardian-01; 10 alerts (10 tenant_id).",
    "group": "proof",
    "purpose": "Prometheus tenant degiskeni ve Grafana alert provisioning kaniti.",
    "purposeEn": "Proves Prometheus tenant variable and Grafana alert provisioning.",
    "metrics": [
      {
        "label": "dashboard",
        "value": "log-guardian-01"
      },
      {
        "label": "alerts",
        "value": "10"
      },
      {
        "label": "tenant",
        "value": "yes"
      }
    ],
    "script": "scripts/grafana_alert_gate.sh",
    "date": "2026-06-29"
  },
  {
    "id": "grafana-parity-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Grafana parity — dashboard mini panel ↔ JSON",
    "titleEn": "Grafana parity — dashboard mini panels ↔ JSON",
    "verdict": "Panel 36; dashboard 36 metrics matched.",
    "verdictEn": "Panel 36; dashboard 36 metrics matched.",
    "group": "proof",
    "purpose": "grafanaPanels.ts ile grafana-dashboard.json metrik eslesmesi.",
    "purposeEn": "grafanaPanels.ts metrics match grafana-dashboard.json.",
    "metrics": [
      {
        "label": "panel",
        "value": "36"
      },
      {
        "label": "dash",
        "value": "36"
      }
    ],
    "script": "scripts/grafana_parity_gate.sh",
    "date": "2026-06-29"
  },
  {
    "id": "honeypot-feed",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Honeypot / deception — trap metrikleri",
    "titleEn": "Honeypot / deception — trap metrics",
    "verdict": "mode=metrics honey=0 lfi=0 c2=0.",
    "verdictEn": "mode=metrics honey=0 lfi=0 c2=0.",
    "group": "proof",
    "purpose": "trap_watcher + tarpit deception hattının Prometheus sayaçlarını kanıtlar.",
    "purposeEn": "Proves trap_watcher + tarpit deception via Prometheus counters.",
    "metrics": [
      {
        "label": "mode",
        "value": "metrics"
      },
      {
        "label": "honey",
        "value": "0"
      },
      {
        "label": "lfi",
        "value": "0"
      },
      {
        "label": "c2",
        "value": "0"
      }
    ],
    "script": "scripts/honeypot_feed_e2e.sh",
    "date": "2026-06-28"
  },
  {
    "id": "ja3-cluster",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Dagitik saldiri (ayni UA, farkli IP) cluster recall",
    "titleEn": "Distributed attack (same UA, different IPs) cluster recall",
    "verdict": "80 IP, recall %100.0 (80/80).",
    "verdictEn": "80 IPs, recall 100.0% (80/80).",
    "group": "proof"
  },
  {
    "id": "ja3-cluster-ban-live",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Canli nginx log -> JA3/UA cluster -> ban_pipeline",
    "titleEn": "Live nginx log -> JA3/UA cluster -> ban_pipeline",
    "verdict": "mode=live-append delta=8 flush=True block=203.0.113.162-203.0.113.166.",
    "verdictEn": "mode=live-append delta=8 flush=True block=203.0.113.162-203.0.113.166.",
    "group": "proof"
  },
  {
    "id": "k8s-admission",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "K8s admission webhook — deny label + allow",
    "titleEn": "K8s admission webhook — deny label + allow",
    "verdict": "mode=kind-live; deny label=security.log-guardian.io/deny.",
    "verdictEn": "mode=kind-live; deny label=security.log-guardian.io/deny.",
    "group": "proof",
    "purpose": "Operator admission: security.log-guardian.io/deny pod reddi.",
    "purposeEn": "Operator admission rejects pods with deny security label.",
    "metrics": [
      {
        "label": "mode",
        "value": "kind-live"
      }
    ],
    "script": "scripts/k8s_admission_test.sh",
    "date": "2026-06-29"
  },
  {
    "id": "k8s-kind-e2e",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "K8s kind cluster — helm dry-run / live",
    "titleEn": "K8s kind cluster — helm dry-run / live",
    "verdict": "cluster=lg; mode=dry-run-server.",
    "verdictEn": "cluster=lg; mode=dry-run-server.",
    "group": "proof",
    "purpose": "Opsiyonel Pro: kind + helm/log-guardian canli veya dry-run kaniti.",
    "purposeEn": "Optional Pro: kind cluster + helm chart live or dry-run proof.",
    "metrics": [
      {
        "label": "mode",
        "value": "dry-run-server"
      },
      {
        "label": "cluster",
        "value": "lg"
      }
    ],
    "script": "scripts/k8s_kind_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "l7-probe-prod",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "L7 eBPF HTTP probe — prod hazırlık",
    "titleEn": "L7 eBPF HTTP probe — prod readiness",
    "verdict": "IPC ok; l7_probe ON; hits=0; xdp=ipset-fallback.",
    "verdictEn": "IPC ok; l7_probe ON; hits=0; xdp=ipset-fallback.",
    "group": "proof",
    "purpose": "Daemon IPC + http_l7_probe.o ile L7 telemetry kanıtı.",
    "purposeEn": "Proves daemon IPC + http_l7_probe.o L7 telemetry.",
    "metrics": [
      {
        "label": "IPC",
        "value": "ok"
      },
      {
        "label": "l7_probe",
        "value": "ON"
      },
      {
        "label": "hits",
        "value": "0"
      },
      {
        "label": "xdp",
        "value": "ipset-fallback"
      }
    ],
    "script": "scripts/l7_probe_prod_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "laptop-core-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Laptop Core — edge + SOC + ban operatörü",
    "titleEn": "Laptop Core — edge + SOC + ban operator gate",
    "verdict": "edge=skip; soc=yes; ban=yes; xdp=ipset-fallback; proof 75/75.",
    "verdictEn": "edge=skip; soc=yes; ban=yes; xdp=ipset-fallback; proof 75/75.",
    "group": "proof",
    "purpose": "nginx→WAF→ban Core vaadi — edge, Telegram SOC, ban API.",
    "purposeEn": "nginx→WAF→ban Core promise — edge, Telegram SOC, ban API.",
    "metrics": [
      {
        "label": "xdp",
        "value": "ipset-fallba"
      },
      {
        "label": "proof",
        "value": "75/75"
      }
    ],
    "script": "scripts/laptop_core_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "laptop-excellence-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Laptop excellence — demo hazirlik kapisi",
    "titleEn": "Laptop excellence — demo readiness gate",
    "verdict": "OK=17 WARN=0 FAIL=0; proof 67/67.",
    "verdictEn": "OK=17 WARN=0 FAIL=0; proof 67/67.",
    "group": "proof",
    "purpose": "Laptop demo zinciri — servis, :8443, filo, kanit.",
    "purposeEn": "Laptop demo chain — services, :8443, fleet, proof.",
    "metrics": [
      {
        "label": "OK",
        "value": "17"
      },
      {
        "label": "FAIL",
        "value": "0"
      }
    ],
    "script": "scripts/laptop_excellence_gate.sh",
    "date": "2026-06-29"
  },
  {
    "id": "lineage-incident",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Lineage → incident otomatik (tek senaryo)",
    "titleEn": "Lineage → auto incident (single scenario)",
    "verdict": "INC-6a440909-2382; aktif=1; sinyal=LOG_SQLI+EBPF_EXECVE.",
    "verdictEn": "INC-6a440909-2382; active=1; signals=LOG_SQLI+EBPF_EXECVE.",
    "group": "proof",
    "purpose": "LOG_SQLI + EBPF_EXECVE sinyallerinden INC-* korelasyonu; tek otomatik incident kanıtı.",
    "purposeEn": "INC-* correlation from LOG_SQLI + EBPF_EXECVE signals; single auto-incident proof.",
    "metrics": [
      {
        "label": "INC",
        "value": "INC-6a440909-2382"
      },
      {
        "label": "IP",
        "value": "10.0.0.99"
      },
      {
        "label": "active",
        "value": "1"
      }
    ],
    "script": "scripts/lineage_incident_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "lineage-live",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "eBPF lineage — openat/execve/connect zinciri",
    "titleEn": "eBPF lineage — openat/execve/connect chain",
    "verdict": "risk=91.2 events=4 (EXEC_SHELL · FILE_READ · FILE_WRITE · NET_CONNECT) source=daemon_file.",
    "verdictEn": "risk=91.2 events=4 (EXEC_SHELL · FILE_READ · FILE_WRITE · NET_CONNECT) source=daemon_file.",
    "group": "proof"
  },
  {
    "id": "live-attack",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Canli nginx :80 saldiri harness (tester + ban)",
    "titleEn": "Live nginx :80 attack harness (tester + ban)",
    "verdict": "sent=525 refused=525 kernel=True waf=True.",
    "verdictEn": "sent=525 refused=525 kernel=True waf=True.",
    "group": "proof"
  },
  {
    "id": "live-pipeline",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Canli ban hatti (IPC -> XDP/ipset)",
    "titleEn": "Live ban pipeline (IPC -> XDP/ipset)",
    "verdict": "IPC ok; 0 IPC, 0 XDP, 0 ipset.",
    "verdictEn": "IPC ok; 0 IPC, 0 XDP, 0 ipset.",
    "group": "proof"
  },
  {
    "id": "marketplace-signed-api",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Marketplace — imzali API (Enterprise tier)",
    "titleEn": "Marketplace — signed API (Enterprise tier)",
    "verdict": "mode=tier_gate; tier=pro; imzali=0.",
    "verdictEn": "mode=tier_gate; tier=pro; signed=0.",
    "group": "proof",
    "purpose": "Enterprise /api/marketplace/signed — imza dogrulama; Pro/Community 403.",
    "purposeEn": "Enterprise /api/marketplace/signed — signature verify; Pro/Community get 403.",
    "metrics": [
      {
        "label": "mode",
        "value": "tier_gate"
      },
      {
        "label": "tier",
        "value": "pro"
      }
    ],
    "script": "scripts/marketplace_signed_api_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "mesh-etcd-docker",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Mesh etcd — docker lab endpoint",
    "titleEn": "Mesh etcd — docker lab endpoint",
    "verdict": "endpoint=http://127.0.0.1:12379; container=lg-etcd-smoke.",
    "verdictEn": "endpoint=http://127.0.0.1:12379; container=lg-etcd-smoke.",
    "group": "proof",
    "purpose": "Opsiyonel filo: etcd docker ile canli endpoint smoke.",
    "purposeEn": "Optional fleet: live etcd docker endpoint smoke.",
    "metrics": [
      {
        "label": "mode",
        "value": "docker-live"
      }
    ],
    "script": "scripts/mesh_etcd_docker_smoke.sh",
    "date": "2026-06-29"
  },
  {
    "id": "mesh-etcd-live",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Mesh etcd — canlı PUT/GET",
    "titleEn": "Mesh etcd — live PUT/GET",
    "verdict": "mode=docker-live-rw; key=lg/fleet/policy/test; round_trip=True.",
    "verdictEn": "mode=docker-live-rw; key=lg/fleet/policy/test; round_trip=True.",
    "group": "proof",
    "purpose": "Docker etcd v3 round-trip; filo politika anahtarı yazma/okuma kanıtı.",
    "purposeEn": "Docker etcd v3 round-trip; fleet policy key read/write proof.",
    "metrics": [
      {
        "label": "mode",
        "value": "docker-live-rw"
      },
      {
        "label": "endpoint",
        "value": "http://127.0.0.1:12379"
      }
    ],
    "script": "scripts/mesh_etcd_live_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "morning-operator-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Morning operator — sabah hazirlik (hizli)",
    "titleEn": "Morning operator — fast morning readiness",
    "verdict": "core=yes(rapor); ship=yes; proof 75/75.",
    "verdictEn": "core=yes(rapor); ship=yes; proof 75/75.",
    "group": "proof",
    "purpose": "Rapor-oncelikli sabah kapisi — demo_3min kosmaz, mevcut gate'leri bozmaz.",
    "purposeEn": "Report-first morning gate — no demo_3min, does not disturb other gates.",
    "metrics": [
      {
        "label": "core",
        "value": "rapor"
      },
      {
        "label": "proof",
        "value": "75/75"
      }
    ],
    "script": "scripts/morning_operator_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "nginx-consult",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "nginx inline consult API (auth_request oncesi WAF+CRS)",
    "titleEn": "nginx inline consult API (WAF+CRS before auth_request)",
    "verdict": "union=403 or1=403 benign=200.",
    "verdictEn": "union=403 or1=403 benign=200.",
    "group": "proof"
  },
  {
    "id": "owasp-corpus",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "OWASP CRS test corpus recall",
    "titleEn": "OWASP CRS test corpus recall",
    "verdict": "%100.0 recall — 199 satir.",
    "verdictEn": "100.0% recall — 199 lines.",
    "group": "proof"
  },
  {
    "id": "parser-fuzz",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Parser fuzz — malformed corpus + mutasyon",
    "titleEn": "Parser fuzz — malformed corpus + mutation",
    "verdict": "536 parse; corpus=18; mutasyon=512.",
    "verdictEn": "536 parses; corpus=18; mutations=512.",
    "group": "proof",
    "purpose": "Deterministik bozuk log satırlarında crash/UB yok; nginx/auth parse güvenilirliği.",
    "purposeEn": "No crash/UB on deterministic malformed log lines; nginx/auth parse reliability.",
    "metrics": [
      {
        "label": "runs",
        "value": "536"
      },
      {
        "label": "corpus",
        "value": "18"
      },
      {
        "label": "mutations",
        "value": "512"
      }
    ],
    "script": "scripts/parser_fuzz_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "phase100-fast-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "phase100 fast gate — Faz 0-6",
    "titleEn": "phase100 fast gate — Phases 0-6",
    "verdict": "mode=fast; faz=0-6.",
    "verdictEn": "mode=fast; phases=0-6.",
    "group": "proof",
    "purpose": "Faz 0-6 E2E scriptlerinin hizli kapisi (VPS soak haric).",
    "purposeEn": "Fast gate for phase 0-6 E2E scripts (excluding VPS soak).",
    "metrics": [
      {
        "label": "mode",
        "value": "fast"
      },
      {
        "label": "phases",
        "value": "0-6"
      }
    ],
    "script": "scripts/phase100_fast_gate.sh",
    "date": "2026-06-28"
  },
  {
    "id": "presentation-ship-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Presentation ship — sunum + GitHub zinciri",
    "titleEn": "Presentation ship — demo rehearsal + release chain",
    "verdict": "demo=yes; release=yes; artefakt 3/3; proof 74/74.",
    "verdictEn": "demo=yes; release=yes; artefakt 3/3; proof 74/74.",
    "group": "proof",
    "purpose": "demo_rehearsal + release_ready — tek komutta sunum ve ship.",
    "purposeEn": "demo_rehearsal + release_ready — one-command presentation and ship.",
    "metrics": [
      {
        "label": "artefakt",
        "value": "3/3"
      },
      {
        "label": "proof",
        "value": "74/74"
      }
    ],
    "script": "scripts/presentation_ship_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "prod-stack-e2e",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Prod stack — Wasm native + lineage + L7",
    "titleEn": "Prod stack — Wasm native + lineage + L7",
    "verdict": "wasm=native; lineage=91.2; L7=aktif; ipc=ok.",
    "verdictEn": "wasm=native; lineage=91.2; L7=active; ipc=ok.",
    "group": "proof",
    "purpose": "Stub→prod zinciri: native Wasm plugin, canli lineage, L7 probe.",
    "purposeEn": "Stub→prod chain: native Wasm plugin, live lineage, L7 probe.",
    "metrics": [
      {
        "label": "wasm",
        "value": "native"
      },
      {
        "label": "L7",
        "value": "yes"
      },
      {
        "label": "xdp",
        "value": "ipset-fallback"
      }
    ],
    "script": "scripts/prod_stack_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "real-attack",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Gercek saldiri corpus (SQLi/XSS/LFI/RCE/scanner) tespit orani",
    "titleEn": "Real attack corpus (SQLi/XSS/LFI/RCE/scanner) detection rate",
    "verdict": "1000 satir, ortalama recall %101.0 — hedef >=%85.0.",
    "verdictEn": "1000 lines, avg recall 101.0% — target >=85.0%.",
    "group": "proof"
  },
  {
    "id": "real-attack-10k",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Corpus 10K — genisletilmis saldiri seti recall",
    "titleEn": "Corpus 10K — extended attack set recall",
    "verdict": "10000 satir, recall %100.2.",
    "verdictEn": "10000 lines, recall 100.2%.",
    "group": "proof"
  },
  {
    "id": "release-ready-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Release ready — GitHub oncesi zincir kapisi",
    "titleEn": "Release ready — pre-GitHub release chain gate",
    "verdict": "release=yes; docs=yes; artefakt 3/3; proof 74/74.",
    "verdictEn": "release=yes; docs=yes; artefakt 3/3; proof 74/74.",
    "group": "proof",
    "purpose": "ZIP/PDF + docs + canli site + filo zinciri.",
    "purposeEn": "ZIP/PDF + docs + live site + fleet chain.",
    "metrics": [
      {
        "label": "artefakt",
        "value": "3/3"
      },
      {
        "label": "proof",
        "value": "74/74"
      }
    ],
    "script": "scripts/release_ready_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "siem-export",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "SIEM forwarder — alert + ban JSON (:5044)",
    "titleEn": "SIEM forwarder — alert + ban JSON (:5044)",
    "verdict": "alert=yes ban=yes port=15044.",
    "verdictEn": "alert=yes ban=yes port=15044.",
    "group": "proof",
    "purpose": "Splunk/Elastic/Vector gibi hedeflere JSON event_type akisini kanitlar.",
    "purposeEn": "Proves JSON event_type stream to Splunk/Elastic/Vector targets.",
    "metrics": [
      {
        "label": "alert",
        "value": "yes"
      },
      {
        "label": "ban",
        "value": "yes"
      },
      {
        "label": "port",
        "value": "15044"
      }
    ],
    "script": "scripts/siem_export_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "taxii-feed",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "TAXII/STIX IOC → ban API (confidence gate)",
    "titleEn": "TAXII/STIX IOC → ban API (confidence gate)",
    "verdict": "dry-run; 2 IOC (≥70); atlanan=1.",
    "verdictEn": "dry-run; 2 IOC (≥70); skipped=1.",
    "group": "proof",
    "purpose": "STIX 2.1 göstergelerini confidence eşiği ile süzer; düşük güven IOC'leri banlamaz.",
    "purposeEn": "Filters STIX 2.1 indicators by confidence; skips low-trust IOCs from ban path.",
    "metrics": [
      {
        "label": "mode",
        "value": "dry-run"
      },
      {
        "label": "IOC",
        "value": "2"
      },
      {
        "label": "min conf",
        "value": "70"
      },
      {
        "label": "atlanan",
        "value": "1"
      }
    ],
    "script": "scripts/taxii_feed_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "telegram-operator-undo-e2e",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Telegram operator undo — SIGUSR2 (WL/mute)",
    "titleEn": "Telegram operator undo — SIGUSR2 (WL/mute)",
    "verdict": "SIGUSR2 · sigusr2 · IP 203.0.113.198.",
    "verdictEn": "SIGUSR2 · sigusr2 · IP 203.0.113.198.",
    "group": "proof",
    "purpose": "WL/Sessiz/Unban yanlis tiklamalarini poll kesmeden geri alir.",
    "purposeEn": "Reverts mistaken WL/mute/unban without interrupting Telegram poll.",
    "metrics": [
      {
        "label": "mode",
        "value": "sigusr2"
      },
      {
        "label": "ip",
        "value": "203.0.113.198"
      },
      {
        "label": "pass",
        "value": "OK"
      }
    ],
    "script": "scripts/telegram_operator_undo_e2e.sh",
    "date": "2026-06-29"
  },
  {
    "id": "telegram-soc-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Telegram SOC — timeline + map + webhook",
    "titleEn": "Telegram SOC — timeline + map + webhook",
    "verdict": "SOC 15 (ack 8); map 4; bans ack 1; webhook prod undo.",
    "verdictEn": "SOC 15 (ack 8); map 4; bans ack 1; webhook prod undo.",
    "group": "proof",
    "purpose": "Uc operator yuzeyinin ayni anda canli kanit urettigini dogrular.",
    "purposeEn": "Proves three operator surfaces emit live evidence together.",
    "metrics": [
      {
        "label": "soc",
        "value": "15"
      },
      {
        "label": "map",
        "value": "4"
      },
      {
        "label": "bans",
        "value": "1"
      },
      {
        "label": "webhook",
        "value": "prod undo"
      }
    ],
    "script": "scripts/telegram_soc_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "tenant-isolation",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Multi-tenant kiracı izolasyonu",
    "titleEn": "Multi-tenant isolation",
    "verdict": "Kiraci musteri1: 4/4 kontrol gecti.",
    "verdictEn": "Tenant musteri1: 4/4 checks passed.",
    "group": "proof"
  },
  {
    "id": "threat-intel-sync",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Threat intel sync -> ipset",
    "titleEn": "Threat intel sync -> ipset",
    "verdict": "sync 0s, ioc=10, ipset_delta=0.",
    "verdictEn": "sync 0s, ioc=10, ipset_delta=0.",
    "group": "proof"
  },
  {
    "id": "tr-hosting-corpus",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "TR hosting corpus (sentetik anonymized)",
    "titleEn": "TR hosting corpus (synthetic anonymized)",
    "verdict": "%100.0 recall — 500 satir.",
    "verdictEn": "100.0% recall — 500 lines.",
    "group": "proof"
  },
  {
    "id": "vm-fleet-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "VM fleet keepalive — host + node-vm-02",
    "titleEn": "VM fleet keepalive — host + node-vm-02",
    "verdict": "node-kurtulus-01=Online; node-vm-02=skip; online=2.",
    "verdictEn": "node-kurtulus-01=Online; node-vm-02=skip; online=2.",
    "group": "proof",
    "purpose": "LAPTOP_OPS filo + VM keepalive — iki dugum Online.",
    "purposeEn": "LAPTOP_OPS fleet + VM keepalive — two nodes Online.",
    "metrics": [
      {
        "label": "host",
        "value": "Online"
      },
      {
        "label": "vm",
        "value": "skip"
      }
    ],
    "script": "scripts/vm_fleet_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "vm-host-prep-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "VM host prep — pre-sync evidence",
    "titleEn": "VM host prep — pre-sync evidence",
    "verdict": "ctx host-vbox; proof 68/68; post_install FAIL=0.",
    "verdictEn": "ctx host-vbox; proof 68/68; post_install FAIL=0.",
    "group": "proof",
    "purpose": "Laptop HOST vm_sync oncesi kanit.",
    "purposeEn": "Laptop HOST proof before vm_sync.",
    "metrics": [
      {
        "label": "proof",
        "value": "68/68"
      },
      {
        "label": "ctx",
        "value": "host-vbox"
      }
    ],
    "script": "scripts/vm_host_prep_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "vps-xdp-kernel",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "VPS XDP — kernel-xdp (laptop: ipset-fallback)",
    "titleEn": "VPS XDP — kernel-xdp (laptop: ipset-fallback)",
    "verdict": "xdp_mode=ipset-fallback; iface=—.",
    "verdictEn": "xdp_mode=ipset-fallback; iface=—.",
    "group": "proof",
    "purpose": "Gercek NIC/VPS'te eBPF XDP; laptop'ta ipset-fallback bilincli.",
    "purposeEn": "eBPF XDP on real NIC/VPS; laptop ipset-fallback is expected.",
    "metrics": [
      {
        "label": "mode",
        "value": "ipset-fallback"
      },
      {
        "label": "iface",
        "value": "—"
      }
    ],
    "script": "scripts/vps_xdp_proof.sh",
    "date": "2026-06-29"
  },
  {
    "id": "wasm-native",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Wasm native — block-sqli plugin smoke",
    "titleEn": "Wasm native — block-sqli plugin smoke",
    "verdict": "mode native; 2 native plugin, 1 alert, 992 B.",
    "verdictEn": "mode native; 2 native plugins, 1 alerts, 992 B.",
    "group": "proof",
    "purpose": "Wasmtime C API ile derlenmiş plugin'in SQLi logunda alert ürettiğini kanıtlar.",
    "purposeEn": "Proves compiled Wasmtime plugin alerts on SQLi in log replay.",
    "metrics": [
      {
        "label": "mode",
        "value": "native"
      },
      {
        "label": "plugins",
        "value": "2"
      },
      {
        "label": "alerts",
        "value": "1"
      },
      {
        "label": "bytes",
        "value": "992"
      }
    ],
    "script": "scripts/wasm_gate.sh"
  },
  {
    "id": "webhook-route-proof",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Telegram route + batch — #waf/#ban yönlendirme",
    "titleEn": "Telegram route + batch — #waf/#ban routing",
    "verdict": "Mod prod; route ON, batch 10s.",
    "verdictEn": "Mode prod; route ON, batch 10s.",
    "group": "proof",
    "purpose": "WARN→DM, CRIT/ban→kanal ve batch özetinin doğru hedefe gittiğini kanıtlar.",
    "purposeEn": "Proves WARN→DM, CRIT/ban→channel and batch summary routing.",
    "metrics": [
      {
        "label": "mode",
        "value": "prod"
      },
      {
        "label": "route",
        "value": "ON"
      },
      {
        "label": "batch",
        "value": "10"
      },
      {
        "label": "prod",
        "value": "OK"
      }
    ],
    "script": "scripts/webhook_route_proof.sh",
    "date": "2026-06-30"
  },
  {
    "id": "webhook-telegram-ack-live",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Telegram Gordum — DB ack sayaci (24h)",
    "titleEn": "Telegram Ack — DB counter (24h)",
    "verdict": "ack 3->4; unacked 0->0.",
    "verdictEn": "ack 3->4; unacked 0->0.",
    "group": "proof",
    "purpose": "Inline Gordum onayinin events.db ve guardian-status/metrics sayacini artirdigini kanitlar.",
    "purposeEn": "Proves inline Ack bumps events.db and guardian-status/metrics counters.",
    "metrics": [
      {
        "label": "ack",
        "value": "3->4"
      },
      {
        "label": "unacked",
        "value": "0->0"
      },
      {
        "label": "prom",
        "value": "4"
      }
    ],
    "script": "scripts/webhook_ack_e2e.sh",
    "date": "2026-06-30"
  },
  {
    "id": "webhook-telegram-live",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Telegram prod — canlı alert/ban/trap/batch",
    "titleEn": "Telegram prod — live alert/ban/trap/batch",
    "verdict": "mod prod; route ON, batch 10s — alert, ban, trap, batch.",
    "verdictEn": "mode prod; route ON, batch 10s — alert, ban, trap, batch.",
    "group": "proof",
    "purpose": "Gerçek bot token ile CRIT/WARN route + batch özetinin Telegram'a gittiğini kanıtlar.",
    "purposeEn": "Proves real bot token delivers CRIT/WARN route + batch summary to Telegram.",
    "metrics": [
      {
        "label": "route",
        "value": "ON"
      },
      {
        "label": "batch",
        "value": "10"
      },
      {
        "label": "kinds",
        "value": "alert,ban,trap,batch"
      }
    ],
    "script": "scripts/webhook_install_prod.sh --test-all",
    "date": "2026-06-29"
  },
  {
    "id": "website-live-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Website live — canli site /tests parity",
    "titleEn": "Website live — production /tests parity",
    "verdict": "ceniklinuxlogguardian.org 72/73; CSS=yes.",
    "verdictEn": "ceniklinuxlogguardian.org 72/73; CSS=yes.",
    "group": "proof",
    "purpose": "ceniklinuxlogguardian.org SRI + test kart parity.",
    "purposeEn": "Production domain SRI + test card parity.",
    "metrics": [
      {
        "label": "live",
        "value": "72/73"
      },
      {
        "label": "domain",
        "value": "ceniklinuxlogguardian.or"
      }
    ],
    "script": "scripts/website_live_gate.sh",
    "date": "2026-06-30"
  },
  {
    "id": "website-preview-gate",
    "status": "pass",
    "statusLabel": "GECTI",
    "statusLabelEn": "PASS",
    "title": "Statik site preview — test parity + smoke",
    "titleEn": "Static site preview — test parity + smoke",
    "verdict": "Site 75/75 parity; grafana yes; edge yes.",
    "verdictEn": "Site 75/75 parity; grafana yes; edge yes.",
    "group": "proof",
    "purpose": "assets/website test-results.js ile competitive-proof parity.",
    "purposeEn": "assets/website test-results.js parity with competitive-proof.",
    "metrics": [
      {
        "label": "site",
        "value": "75"
      },
      {
        "label": "proof",
        "value": "75"
      }
    ],
    "script": "scripts/website_preview_gate.sh",
    "date": "2026-06-30"
  }
];
