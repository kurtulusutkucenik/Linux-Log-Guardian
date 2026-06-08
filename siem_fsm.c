/*
 * siem_fsm.c — Çok Aşamalı Tehdit Korelasyon Motoru
 *
 * IP başına 5 aşamalı Finite State Machine:
 *   CLEAN → RECON → EXPLOIT → C2 → PERSISTENT
 *
 * Ban TTL çarpanı aşamaya göre büyür; PERSISTENT aşamasında -1 döner
 * (çağıran kod bunu kalıcı ban olarak yorumlar).
 */
#include "siem_fsm.h"
#include <stdatomic.h>
#include <stdio.h>
#include <string.h>
#include <limits.h>
#include <time.h>
#include <stdlib.h>
#include "daemon_ipc.h"

#define SUBNET_TRACK_SIZE 1024

typedef struct {
    char subnet[32];
    int alert_count;
    time_t last_alert;
} SubnetTrack;

static SubnetTrack g_subnets[SUBNET_TRACK_SIZE];

static const char *stage_names[] = {
    "CLEAN",
    "RECON",
    "EXPLOIT",
    "C2",
    "PERSISTENT"
};

const char *siem_stage_name(uint8_t stage) {
    if (stage > FSM_PERSISTENT) return "UNKNOWN";
    return stage_names[stage];
}

/*
 * siem_update — Alarm tipine göre FSM geçişini uygular.
 *
 * Geçiş mantığı:
 *   - SQLi/XSS/LFI hit (ALERT_CRIT, message "SQL" veya "PCRE")  → EXPLOIT
 *   - Beaconing hit (message "BEACONING")                        → C2
 *   - DDoS / 404 flood (ALERT_WARN, status < 200)               → RECON
 *   - EXPLOIT + C2 zaten kayıtlıysa                              → PERSISTENT
 *
 * Dönüş: yeni TTL (saniye). -1 = kalıcı ban.
 */
int siem_update(IpRecord *rec, const Alert *a, int base_ban_ttl) {
    if (!rec || !a) return base_ban_ttl;

    uint8_t cur = (uint8_t)atomic_load(&rec->threat_stage);
    uint8_t next = cur;

    /* Alarm tipine göre yeni aşamayı belirle */
    if (a->level == ALERT_CRIT) {
        /* Beaconing kontrolü */
        if (strstr(a->message, "BEACONING") != NULL) {
            if (cur == FSM_EXPLOIT || cur == FSM_PERSISTENT)
                next = FSM_PERSISTENT;
            else
                next = FSM_C2;
        }
        /* SQLi / Payload / PCRE hit */
        else if (strstr(a->message, "SQL")      != NULL ||
                 strstr(a->message, "INJECTION") != NULL ||
                 strstr(a->message, "PAYLOAD")   != NULL) {
            if (cur == FSM_C2 || cur == FSM_PERSISTENT)
                next = FSM_PERSISTENT;
            else
                next = FSM_EXPLOIT;
        }
        /* Diğer kritik alarmlar (genel yükseltme) */
        else {
            if (cur < FSM_EXPLOIT) next = FSM_EXPLOIT;
        }
    } else if (a->level == ALERT_WARN) {
        /* DDoS / trafik patlaması / low&slow → en az RECON */
        if (cur < FSM_RECON) next = FSM_RECON;
    }
    /* ALERT_INFO → stage değişmez */

    /* Geriye gidişe izin verme (monoton artış) */
    if (next > cur) {
        atomic_store(&rec->threat_stage, (uint8_t)next);

        fprintf(stderr,
                "[SIEM] %s: %s → %s\n",
                rec->ip,
                stage_names[cur],
                stage_names[next]);
    }

    /* TTL hesapla */
    switch (next) {
    case FSM_CLEAN:      return base_ban_ttl;
    case FSM_RECON:      return base_ban_ttl;          /* x1 — sadece uyarı */
    case FSM_EXPLOIT:    return base_ban_ttl * 2;      /* x2 */
    case FSM_C2:         return base_ban_ttl * 4;      /* x4 */
    case FSM_PERSISTENT: return -1;                    /* Kalıcı ban */
    default:             return base_ban_ttl;
    }
}

void siem_track_subnet_alert(const char *ip) {
    int a,b,c;
    if (sscanf(ip, "%d.%d.%d.", &a, &b, &c) != 3) return; /* Sadece IPv4 /24 su an */
    char subnet[32];
    snprintf(subnet, sizeof(subnet), "%d.%d.%d.0/24", a, b, c);
    
    time_t now = time(NULL);
    int empty_idx = -1;

    for (int i=0; i<SUBNET_TRACK_SIZE; i++) {
        if (g_subnets[i].subnet[0] == '\0' || (now - g_subnets[i].last_alert > 60)) {
            if (empty_idx == -1) empty_idx = i;
            continue;
        }
        if (strcmp(g_subnets[i].subnet, subnet) == 0) {
            g_subnets[i].alert_count++;
            g_subnets[i].last_alert = now;
            /* Eger 60 saniyede ayni /24 bloktan 20 alarm geldiyse toptan banla */
            if (g_subnets[i].alert_count >= 20) {
                fprintf(stderr, "[SIEM-BOTNET] %s subneti uzerinden yaygin saldiri. TOPTAN BAN!\n", subnet);
                daemon_ipc_ban_ipv4(subnet);
                g_subnets[i].alert_count = 0; /* cooldown */
            }
            return;
        }
    }
    
    if (empty_idx != -1) {
        strncpy(g_subnets[empty_idx].subnet, subnet, 31);
        g_subnets[empty_idx].subnet[31] = '\0';
        g_subnets[empty_idx].alert_count = 1;
        g_subnets[empty_idx].last_alert = now;
    }
}
