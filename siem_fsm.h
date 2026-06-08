#ifndef SIEM_FSM_H
#define SIEM_FSM_H

/*
 * siem_fsm.h — Çok Aşamalı Tehdit Korelasyon Motoru (SIEM Çekirdeği)
 *
 * Her IP için 5 aşamalı Finite State Machine:
 *
 *   FSM_CLEAN → FSM_RECON → FSM_EXPLOIT → FSM_C2 → FSM_PERSISTENT
 *
 * Geçiş | Tetikleyici                              | Ban TTL Çarpanı
 * ------|-----------------------------------------|----------------
 * RECON | 404 hatası > eşik (Dizin Tarama)        | x1 (uyarı)
 * EXPLOIT| PCRE2 hit (SQLi/XSS/LFI)               | x2
 * C2    | Beaconing tespit (stddev < eşik)         | x4
 * PERSISTENT | EXPLOIT + C2 kombinasyonu           | Kalıcı ban
 *
 * Aşama, `IpRecord.threat_stage` atomik alanında saklanır.
 */

#include "anomaly.h"
#include "ip_map.h"

typedef enum {
    FSM_CLEAN      = 0,
    FSM_RECON      = 1,
    FSM_EXPLOIT    = 2,
    FSM_C2         = 3,
    FSM_PERSISTENT = 4
} ThreatStage;

/*
 * siem_update — Yeni bir alarm geldiğinde FSM'yi günceller.
 *
 * Dönüş değeri: yeni ban_ttl_sec (base_ban_ttl üzerinden çarpılmış).
 * -1 döndürürse kalıcı ban (INT_MAX TTL) uygulanmalıdır.
 */
int siem_update(IpRecord *rec, const Alert *a, int base_ban_ttl);

/* Kör Nokta 2: Dağıtık (Botnet) /24 Subnet Bazlı Banlama */
void siem_track_subnet_alert(const char *ip);

/* Aşama adını okunabilir string olarak döndürür */
const char *siem_stage_name(uint8_t stage);

#endif /* SIEM_FSM_H */
