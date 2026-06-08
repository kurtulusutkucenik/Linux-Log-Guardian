/* attack_tree.h — eBPF Process & Network Lineage / Attack Tree (Feature 3)
 *
 * Bir web sürecinin dosya okuma (openat), shell açma (execve) ve
 * dış bağlantı (connect) olaylarını PID başına zincirleyerek
 * "Saldırı Ağacı" oluşturur.
 */
#pragma once
#ifndef ATTACK_TREE_H
#define ATTACK_TREE_H

#include <stdint.h>
#include <time.h>
#include <sys/types.h>

#define ATTACK_TREE_MAX_EVENTS  32
#define ATTACK_TREE_MAX_PIDS   512
#define ATTACK_TREE_MAX_DETAIL 128
#define ATTACK_TREE_JSON_BUF  4096

/* ── Olay Tipleri ───────────────────────────────────────────────── */
typedef enum {
    LINEAGE_OPENAT  = 0,  /* Dosya açma (okuma)             */
    LINEAGE_EXECVE  = 1,  /* Shell / süreç başlatma (RCE)   */
    LINEAGE_CONNECT = 2,  /* Dış ağ bağlantısı (data exfil) */
    LINEAGE_WRITE   = 3,  /* Dosya yazma (webshell drop)    */
    LINEAGE_RECV    = 4,  /* Gelen veri (C2 komut alma)     */
} LineageEventType;

/* ── Tek Bir Lineage Olayı ──────────────────────────────────────── */
typedef struct {
    LineageEventType type;
    pid_t            pid;
    pid_t            ppid;
    char             comm[16];       /* işlem adı                  */
    char             detail[ATTACK_TREE_MAX_DETAIL]; /* dosya/IP   */
    time_t           ts;
    uint32_t         uid;
} LineageEvent;

/* ── PID Başına Saldırı Ağacı ───────────────────────────────────── */
typedef struct {
    pid_t        root_pid;
    char         root_comm[16];
    LineageEvent events[ATTACK_TREE_MAX_EVENTS];
    int          count;
    double       risk_score;  /* 0-100; yüksek = saldırı zinciri  */
    time_t       first_seen;
    time_t       last_seen;
    int          active;
} AttackTree;

/* ── API ─────────────────────────────────────────────────────────── */

/* Başlat (uygulama başlangıcında bir kez) */
void attack_tree_init(void);

/* eBPF daemon ring buffer callback'inden çağrılır */
void attack_tree_submit(const LineageEvent *ev);

/* PID'in mevcut attack tree'sini al (NULL = yok) */
const AttackTree *attack_tree_get(pid_t pid);

/* JSON string olarak serialize et (buf = caller sağlar) */
int attack_tree_to_json(pid_t pid, char *buf, size_t bufsz);

/* Tüm aktif ağaçları JSON dizisi olarak döndür */
int attack_tree_all_json(char *buf, size_t bufsz);

/* Risk skoru > eşik olan PID'leri döndür */
int attack_tree_high_risk(pid_t *out_pids, int max_count, double threshold);

/* Eski ağaçları temizle (TTL = saniye) */
void attack_tree_gc(int ttl_sec);

/* Boyut istatistikleri */
void attack_tree_stats(uint64_t *total_events, uint64_t *active_trees,
                       uint64_t *high_risk_count);

/* ── Sabitler (risk scoring) ────────────────────────────────────── */
#define ATREE_RISK_EXECVE_FROM_WEB  40.0  /* web proc → shell         */
#define ATREE_RISK_SENSITIVE_FILE   25.0  /* /etc/passwd vb. okuma    */
#define ATREE_RISK_EXTERNAL_CONNECT 20.0  /* dış IP bağlantısı        */
#define ATREE_RISK_WRITE_TMP        15.0  /* /tmp /var/tmp yazma      */
#define ATREE_RISK_THRESHOLD_ALERT  60.0  /* bu skorun üstü → alert   */
#define ATREE_RISK_THRESHOLD_BLOCK  85.0  /* bu skorun üstü → ban     */

const char *lineage_type_str(LineageEventType t);

#endif /* ATTACK_TREE_H */
