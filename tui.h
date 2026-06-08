#ifndef TUI_H
#define TUI_H

#include "anomaly.h"
#include "min_heap.h"
#include <stddef.h>
#include <time.h>

/* ------------------------------------------------------------------ */
/*  ANSI — Temel kontrol                                                */
/* ------------------------------------------------------------------ */
#define ANSI_RESET       "\x1b[0m"
#define ANSI_BOLD        "\x1b[1m"
#define ANSI_CLEAR       "\x1b[2J"
#define ANSI_HOME        "\x1b[H"
#define ANSI_HIDE_CURSOR "\x1b[?25l"
#define ANSI_SHOW_CURSOR "\x1b[?25h"

/* ------------------------------------------------------------------ */
/*  RETRO PALET — Gorseldeki mavi/cyan tek renk estetigine uygun       */
/*                                                                      */
/*  Mantik:                                                             */
/*    RETRO_TITLE   : Baslik — parlak beyaz, kalin                     */
/*    RETRO_HEADER  : Panel baslik — kalin cyan                        */
/*    RETRO_LBL     : Etiket — soluk (dim) cyan                        */
/*    RETRO_VAL     : Deger — normal cyan                              */
/*    RETRO_DIM     : Yardimci / cerceve — soluk mavi                  */
/*    RETRO_OK      : Iyi durum — yesil                                */
/*    RETRO_WARN    : Uyari — sari                                     */
/*    RETRO_CRIT    : Kritik — parlak kirmizi                          */
/*    RETRO_INFO    : Bilgi — acik cyan                                */
/*    RETRO_HIGH    : Grafik yuksek  — kirmizi                         */
/*    RETRO_MID     : Grafik orta   — sari                             */
/*    RETRO_LOW     : Grafik dusuk  — dim cyan                         */
/* ------------------------------------------------------------------ */
#define RETRO_TITLE    "\x1b[1;37m"   /* kalin beyaz          */
#define RETRO_HEADER   "\x1b[1;36m"   /* kalin cyan           */
#define RETRO_LBL      "\x1b[2;36m"   /* dim cyan             */
#define RETRO_VAL      "\x1b[0;36m"   /* normal cyan          */
#define RETRO_DIM      "\x1b[2;34m"   /* dim mavi             */
#define RETRO_OK       "\x1b[0;32m"   /* yesil                */
#define RETRO_WARN     "\x1b[0;33m"   /* sari                 */
#define RETRO_CRIT     "\x1b[1;91m"   /* parlak kirmizi       */
#define RETRO_RCE      "\x1b[1;97;41m" /* beyaz-kirmizi BG: RCE uyarisi */
#define RETRO_INFO     "\x1b[0;96m"   /* acik cyan            */
#define RETRO_HIGH     "\x1b[1;91m"   /* grafik: yuksek       */
#define RETRO_MID      "\x1b[0;33m"   /* grafik: orta         */
#define RETRO_LOW      "\x1b[2;36m"   /* grafik: dusuk        */
#define RETRO_MESH     "\x1b[1;35m"   /* mor: mesh intel      */

/* ------------------------------------------------------------------ */
/*  BOX DRAWING — UTF-8 box karakterleri                               */
/*  Goruntuye bak: ince cizgi cerceve + cift dikey ayrac (║)           */
/* ------------------------------------------------------------------ */
#define HLINE      "\xe2\x94\x80"   /* ─  U+2500 */
#define VLINE      "\xe2\x94\x82"   /* │  U+2502 */
#define TL_CORNER  "\xe2\x94\x8c"   /* ┌  U+250C */
#define TR_CORNER  "\xe2\x94\x90"   /* ┐  U+2510 */
#define BL_CORNER  "\xe2\x94\x94"   /* └  U+2514 */
#define BR_CORNER  "\xe2\x94\x98"   /* ┘  U+2518 */
#define VSEP       "\xe2\x95\x91"   /* ║  U+2551 — iki panel arasi */

/* ------------------------------------------------------------------ */
/*  BULLET KARAKTERLERI                                                  */
/* ------------------------------------------------------------------ */
#define RETRO_BULLET       RETRO_HEADER "\xe2\x97\x86" /* ◆ U+25C6 */
#define RETRO_BULLET_OK    RETRO_OK     "\xe2\x97\x8f" /* ● U+25CF */
#define RETRO_BULLET_ALARM RETRO_CRIT   "\xe2\x97\x8f" /* ● U+25CF */

/* ------------------------------------------------------------------ */
/*  Ban gecmisi                                                          */
/* ------------------------------------------------------------------ */
#define BAN_HISTORY_LEN 8
#define EPS_SAMPLES_PER_SEC 10
#define EPS_GRAPH_SECONDS   1000
#define EPS_HISTORY_LEN     (EPS_SAMPLES_PER_SEC * EPS_GRAPH_SECONDS)

typedef struct {
    char   ip[IP_STR_LEN];
    time_t ts;
} BanEntry;

/* ------------------------------------------------------------------ */
/*  Anlik istatistik paketi (TUI mutex altinda guncellenir)            */
/* ------------------------------------------------------------------ */
typedef struct {
    long   total_lines;
    long   parse_errors;
    long   alerts_total;
    long   total_bytes;

    long   cnt_get, cnt_post, cnt_put, cnt_delete, cnt_other;
    long   cnt_2xx, cnt_3xx, cnt_4xx, cnt_5xx;

    double eps;
    size_t unique_ips;

    Alert    last_alerts[8];
    int      last_alert_cnt;

    BanEntry ban_history[BAN_HISTORY_LEN];
    int      ban_history_cnt;
    long     ban_attempts;
    long     ban_success;
    long     ban_fail;

    /* Intelligence Stats */
    uint64_t ja3_total;
    uint64_t ja3_c2;
    uint64_t apt_clusters;
    uint64_t apt_detections;
    uint64_t covert_hits;
    uint64_t honey_traps;

    /* Zero Trust RCE Stats */
    uint64_t rce_detections;     /* execve uprobe tespiti              */
    uint64_t rce_kills;          /* SIGKILL gonderilen proses sayisi   */
    char     rce_last_comm[16];  /* Son RCE tespitinin proses adi      */
    char     rce_last_cid[13];   /* Son konteynerin ID'si (ilk 12 hex) */

    /* Global Mesh Intelligence Stats */
    uint64_t mesh_pub_sent;      /* Bu sunucudan yayinlanan IOC        */
    uint64_t mesh_sub_recv;      /* Uzak sunuculardan alinan IOC       */
    uint64_t mesh_sub_applied;   /* XDP'ye yazilan uzak IOC            */
    uint32_t mesh_peers;         /* Bagli node sayisi                  */

    /* Tarpit v2 Stats */
    uint64_t tarpit_active_conns;  /* Aktif tuzak baglantisi           */
    uint64_t tarpit_total_trapped; /* Toplam kurbun sayisi             */
    uint64_t tarpit_bytes_sent;    /* Toplam gonderilen byte           */

    double eps_history[EPS_HISTORY_LEN];
    int    eps_hist_idx;
    long   ringbuf_drops;

    /* Faz 2: eBPF lineage / attack tree (daemon JSON) */
    uint64_t lineage_active_trees;
    uint64_t lineage_high_risk;
    uint64_t lineage_events;
    double   lineage_max_risk;
    char     lineage_top_comm[16];
    pid_t    lineage_top_pid;
} TuiStats;

/* ------------------------------------------------------------------ */
/*  API                                                                  */
/* ------------------------------------------------------------------ */
void tui_init(void);
void tui_draw(const TuiStats *stats, const MinHeap *top10);
void tui_push_alert(TuiStats *stats, const Alert *a);
void tui_push_ban(TuiStats *stats, const char *ip, time_t ts);
void tui_cleanup(void);

#endif /* TUI_H */