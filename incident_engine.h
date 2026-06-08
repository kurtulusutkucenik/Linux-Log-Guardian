/* incident_engine.h — IP bazli log + eBPF korelasyon (INCIDENT_ID) */
#ifndef INCIDENT_ENGINE_H
#define INCIDENT_ENGINE_H

#include "anomaly.h"
#include <stdint.h>

#define INC_SIG_LOG_SQLI     (1u << 0)
#define INC_SIG_LOG_WAF      (1u << 1)
#define INC_SIG_LOG_BRUTE    (1u << 2)
#define INC_SIG_EBPF_EXECVE  (1u << 3)
#define INC_SIG_EBPF_LINEAGE (1u << 4)
#define INC_SIG_EBPF_OUTBOUND (1u << 5)

void incident_engine_init(void);
void incident_engine_set_window_sec(int sec);
/** Ayni IP uzerinde kac log alarmi sonra INC acilsin (eBPF yokken demo icin) */
void incident_engine_set_min_log_hits(int n);

void incident_engine_note_signal(const char *ip, uint32_t signal);
void incident_engine_note_host_signal(uint32_t signal);

uint32_t incident_engine_infer_signal(const Alert *alert);
void incident_engine_attach_alert(Alert *alert, const char *ip);
const char *incident_engine_best_ip(void);

void incident_engine_get_stats(uint64_t *active, uint64_t *correlated);

/** 0–100 birlesik risk (log + eBPF sinyalleri) */
double incident_engine_risk_score(uint32_t signals, uint16_t log_hits);

/** IP icin guncel incident risk (yoksa 0) */
double incident_engine_ip_risk(const char *ip);

/** JSON dizi: aktif incidentler (API /api/v1/incidents) */
int incident_engine_export_json(char *buf, size_t buf_sz);

/** Tek incident; id ile (INC-...) */
int incident_engine_export_one(const char *incident_id, char *buf, size_t buf_sz);

#endif /* INCIDENT_ENGINE_H */
