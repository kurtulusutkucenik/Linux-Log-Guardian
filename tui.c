#include "tui.h"
#include <stdio.h>
#include <string.h>
#include <time.h>
#include <termios.h>
#include <unistd.h>
#include <sys/ioctl.h>
#include "siem_forwarder.h"

static int g_term_cols = 120;
static int g_term_rows = 40;

static void update_term_size(void) {
    struct winsize ws;
    if (ioctl(STDOUT_FILENO, TIOCGWINSZ, &ws) == 0) {
        g_term_cols = ws.ws_col > 0 ? ws.ws_col : 120;
        g_term_rows = ws.ws_row > 0 ? ws.ws_row : 40;
    }
}

void tui_init(void) {
    update_term_size();
    printf(ANSI_HIDE_CURSOR ANSI_CLEAR ANSI_HOME);
    fflush(stdout);
}

void tui_cleanup(void) {
    printf(ANSI_SHOW_CURSOR ANSI_CLEAR ANSI_HOME);
    fflush(stdout);
}

static void goto_rc(int row, int col) { printf("\x1b[%d;%dH", row, col); }
static void erase_eol(void)           { printf("\x1b[K"); }

/* Yatay cizgi — retro tek cizgi stili */
static void draw_hline(int row, int col, int width) {
    goto_rc(row, col);
    printf(RETRO_DIM);
    for (int i = 0; i < width; i++) printf(HLINE);
    printf(ANSI_RESET);
}

/* Dikey ayrac — iki panel arasinda */
static void draw_vsep(int row_start, int row_end, int col) {
    for (int r = row_start; r <= row_end; r++) {
        goto_rc(r, col);
        printf(RETRO_DIM VSEP ANSI_RESET);
    }
}


/* Trafik grafigi — ASCII blok karakterleri, retro palet */
static void draw_traffic_graph(int row, int col, int width,
                                const double *history, int hist_count) {
    if (width <= 0 || hist_count <= 0) return;
    int total = hist_count < EPS_HISTORY_LEN ? hist_count : EPS_HISTORY_LEN;
    if (total <= 0) return;

    /* 9 seviye ASCII bar karakteri */
    static const char *bars[] = {" ", "\xe2\x96\x81", "\xe2\x96\x82",
                                  "\xe2\x96\x83", "\xe2\x96\x84", "\xe2\x96\x85",
                                  "\xe2\x96\x86", "\xe2\x96\x87", "\xe2\x96\x88"};
    int show = width < 100 ? width : 100;
    if (show < 10) show = 10;

    double col_vals[100];
    double prev = 0.0;
    int start = hist_count - total;
    for (int col_i = 0; col_i < show; col_i++) {
        int seg_start = start + (col_i * total) / show;
        int seg_end   = start + ((col_i + 1) * total) / show;
        if (seg_end <= seg_start) seg_end = seg_start + 1;
        if (seg_end > hist_count) seg_end = hist_count;
        double sum = 0.0;
        int cnt = 0;
        for (int j = seg_start; j < seg_end; j++) {
            sum += history[j];
            cnt++;
        }
        double avg = (cnt > 0) ? (sum / (double)cnt) : 0.0;
        /* Yumusatma: daha dalgali ama sakin bir trend cizgisi. */
        double smooth = (col_i == 0) ? avg : (prev * 0.65 + avg * 0.35);
        col_vals[col_i] = smooth;
        prev = smooth;
    }

    double max_eps = 1.0;
    for (int i = 0; i < show; i++) {
        if (col_vals[i] > max_eps) max_eps = col_vals[i];
    }

    goto_rc(row, col);
    for (int i = 0; i < show; i++) {
        double ratio = col_vals[i] / max_eps;
        int level = (int)(ratio * 8);
        if (level > 8) level = 8;
        if      (ratio > 0.8) printf(RETRO_HIGH);
        else if (ratio > 0.4) printf(RETRO_MID);
        else                  printf(RETRO_LOW);
        printf("%s" ANSI_RESET, bars[level]);
    }
}

/* Alarm seviyesi rengi */
static const char *alert_color(AlertLevel lvl) {
    switch (lvl) {
        case ALERT_CRIT: return RETRO_CRIT;
        case ALERT_WARN: return RETRO_WARN;
        case ALERT_INFO: return RETRO_INFO;
        default:         return RETRO_DIM;
    }
}

static const char *alert_label(AlertLevel lvl) {
    switch (lvl) {
        case ALERT_CRIT: return "CRIT";
        case ALERT_WARN: return "WARN";
        case ALERT_INFO: return "INFO";
        default:         return "    ";
    }
}

void tui_draw(const TuiStats *stats, const MinHeap *top10) {
    update_term_size();
    printf(ANSI_HOME);

    /* ----------------------------------------------------------------
     * SATIR 1 — Baslik cubugu
     * ---------------------------------------------------------------- */
    goto_rc(1, 1);
    printf(RETRO_TITLE " LOG ANALYZER" ANSI_RESET);
    printf(RETRO_DIM "  " VSEP "  DURUM: " ANSI_RESET RETRO_OK "AKTIF" ANSI_RESET);

    /* Sag tarafa saat */
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    char tsbuf[16];
    snprintf(tsbuf, sizeof(tsbuf), "%02d:%02d:%02d",
             tm_info->tm_hour, tm_info->tm_min, tm_info->tm_sec);
    goto_rc(1, g_term_cols - 9);
    printf(RETRO_DIM "%s" ANSI_RESET, tsbuf);
    goto_rc(1, 1); printf(RETRO_DIM); erase_eol(); printf(ANSI_RESET);

    /* Baslik altinda tam genislik cizgi */
    draw_hline(2, 1, g_term_cols);

    /* ----------------------------------------------------------------
     * SATIR 3-12 — Sol: Canli Metrikler  |  Sag: Trafik Grafigi
     * ---------------------------------------------------------------- */
    int panel_h = 10;
    int lw      = 44;                       /* sol panel genisligi */
    if (g_term_cols < 90) lw = g_term_cols / 2 - 2;
    if (lw < 24) lw = 24;
    int sep_col = lw + 1;                   /* dikey ayrac sutunu  */
    int gx      = lw + 2;                   /* grafik baslangici   */
    int gw      = g_term_cols - gx;         /* grafik genisligi    */
    if (gw < 18) gw = 18;

    /* Panel baslik satiri */
    goto_rc(3, 2);
    printf(RETRO_BULLET " " RETRO_HEADER "CANLI METRIKLER" ANSI_RESET);
    goto_rc(3, gx + 2);
    printf(RETRO_BULLET " " RETRO_HEADER "CANLI TRAFIK GRAFIGI (%ds)" ANSI_RESET,
           EPS_GRAPH_SECONDS);

    /* Dikey ayrac: satir 3'ten panel sonuna kadar */
    draw_vsep(3, 3 + panel_h - 1, sep_col);

    /* Metrik ic cizgisi */
    goto_rc(4, 2);
    printf(RETRO_DIM);
    for (int i = 0; i < lw - 3; i++) printf(HLINE);
    printf(ANSI_RESET);
    goto_rc(4, gx + 2);
    printf(RETRO_DIM);
    for (int i = 0; i < gw - 3; i++) printf(HLINE);
    printf(ANSI_RESET);

    /* EPS rengi */
    const char *eps_col = stats->eps > 500.0 ? RETRO_CRIT :
                          stats->eps > 100.0 ? RETRO_WARN : RETRO_VAL;

    goto_rc(5, 2);
    printf(RETRO_LBL "  Toplam Satir   : " ANSI_RESET RETRO_VAL "%ld" ANSI_RESET,
           stats->total_lines); erase_eol();
    goto_rc(6, 2);
    printf(RETRO_LBL "  Parse Hatasi   : " ANSI_RESET RETRO_VAL "%ld" ANSI_RESET,
           stats->parse_errors); erase_eol();
    goto_rc(7, 2);
    printf(RETRO_LBL "  Benzersiz IP   : " ANSI_RESET RETRO_VAL "%zu" ANSI_RESET,
           stats->unique_ips); erase_eol();
    goto_rc(8, 2);
    if (stats->alerts_total > 0)
        printf(RETRO_LBL "  Toplam Alarm   : " ANSI_RESET RETRO_CRIT "%ld" ANSI_RESET,
               stats->alerts_total);
    else
        printf(RETRO_LBL "  Toplam Alarm   : " ANSI_RESET RETRO_VAL "%ld" ANSI_RESET,
               stats->alerts_total);
    erase_eol();
    goto_rc(9, 2);
    printf(RETRO_LBL "  EPS (olay/s)   : " ANSI_RESET "%s%.1f" ANSI_RESET,
           eps_col, stats->eps); erase_eol();
    goto_rc(10, 2);
    printf(RETRO_LBL "  Islenen Veri   : " ANSI_RESET RETRO_VAL "%.1f MB" ANSI_RESET,
           (double)stats->total_bytes / (1024.0 * 1024.0)); erase_eol();

    /* Grafik — satir 6, grafik kolonu */
    if (stats->eps_hist_idx > 0 && gw > 6) {
        draw_traffic_graph(7, gx + 2, gw - 4, stats->eps_history, stats->eps_hist_idx);
    } else {
        goto_rc(7, gx + 2);
        printf(RETRO_DIM "  [ Veri bekleniyor... -f ile canli izleyin ]" ANSI_RESET);
        erase_eol();
    }
    goto_rc(9,  gx + 2);
    printf(RETRO_DIM " <--- %d saniye --->" ANSI_RESET, EPS_GRAPH_SECONDS);
    erase_eol();
    goto_rc(10, gx + 2);
    printf(RETRO_DIM " min: 0  maks: %.0f EPS" ANSI_RESET,
           stats->eps > 0 ? stats->eps : 1.0); erase_eol();

    /* Diger satir bos */
    goto_rc(11, 2);
    printf(RETRO_LBL "  Ban Deneme/OK/Fail : " ANSI_RESET RETRO_VAL "%ld/%ld/%ld" ANSI_RESET,
           stats->ban_attempts, stats->ban_success, stats->ban_fail);
    erase_eol();
    goto_rc(12, 2);
    printf(RETRO_LBL "  ISTIHBARAT     : " ANSI_RESET 
           RETRO_DIM "JA3/C2: " ANSI_RESET RETRO_CRIT "%lu" ANSI_RESET RETRO_DIM "/" ANSI_RESET RETRO_VAL "%lu  " ANSI_RESET
           RETRO_DIM "APT: " ANSI_RESET RETRO_WARN "%lu  " ANSI_RESET
           RETRO_DIM "Covert: " ANSI_RESET RETRO_WARN "%lu  " ANSI_RESET
           RETRO_DIM "Tuzak: " ANSI_RESET RETRO_INFO "%lu  " ANSI_RESET
           RETRO_DIM "RingDrop: " ANSI_RESET "%s%ld" ANSI_RESET,
           stats->ja3_c2, stats->ja3_total, stats->apt_clusters,
           stats->covert_hits, stats->honey_traps, 
           (stats->ringbuf_drops > 0 ? RETRO_CRIT : RETRO_VAL), stats->ringbuf_drops);
    erase_eol();

    /* Zero Trust RCE + Mesh + Tarpit istatistik satiri */
    goto_rc(13, 2);
    /* RCE tespiti varsa kirmizi arka plan */
    const char *rce_col = (stats->rce_detections > 0) ? RETRO_RCE : RETRO_DIM;
    printf("%sRCE: %lu/%lu" ANSI_RESET,
           rce_col, stats->rce_detections, stats->rce_kills);
    if (stats->rce_last_comm[0])
        printf(RETRO_CRIT " [%.15s %.12s]" ANSI_RESET,
               stats->rce_last_comm, stats->rce_last_cid);
    printf(RETRO_DIM "  " VSEP "  " ANSI_RESET);
    printf(RETRO_MESH "MESH" ANSI_RESET
           RETRO_DIM " pub:" ANSI_RESET RETRO_VAL "%lu" ANSI_RESET
           RETRO_DIM " sub:" ANSI_RESET RETRO_VAL "%lu" ANSI_RESET
           RETRO_DIM "/" ANSI_RESET RETRO_OK "%lu" ANSI_RESET
           RETRO_DIM "  nodes:" ANSI_RESET RETRO_VAL "%u" ANSI_RESET,
           stats->mesh_pub_sent, stats->mesh_sub_recv,
           stats->mesh_sub_applied, stats->mesh_peers);
    printf(RETRO_DIM "  " VSEP "  " ANSI_RESET);
    printf(RETRO_WARN "TARPIT" ANSI_RESET
           RETRO_DIM " aktif:" ANSI_RESET RETRO_VAL "%lu" ANSI_RESET
           RETRO_DIM " toplam:" ANSI_RESET RETRO_VAL "%lu" ANSI_RESET
           RETRO_DIM " byte:" ANSI_RESET RETRO_VAL "%lu" ANSI_RESET,
           stats->tarpit_active_conns, stats->tarpit_total_trapped,
           stats->tarpit_bytes_sent);
    if (stats->lineage_active_trees > 0 || stats->lineage_max_risk > 0) {
        const char *lin_col = (stats->lineage_max_risk >= 85.0) ? RETRO_RCE
                            : (stats->lineage_max_risk >= 60.0) ? RETRO_WARN
                            : RETRO_DIM;
        printf(RETRO_DIM "  " VSEP "  " ANSI_RESET);
        printf("%sLINEAGE" ANSI_RESET RETRO_DIM " trees:" ANSI_RESET RETRO_VAL "%lu" ANSI_RESET
               RETRO_DIM " risk:" ANSI_RESET "%s%.0f" ANSI_RESET,
               lin_col, stats->lineage_active_trees, lin_col, stats->lineage_max_risk);
        if (stats->lineage_top_comm[0])
            printf(RETRO_DIM " %.12s" ANSI_RESET, stats->lineage_top_comm);
    }
    erase_eol();

    /* ────────────────────────────────────────────────────────────────
     * SATIR 15 — Ayrac (1 satir asagi kaydiriildi: satir 13 yeni panel)
     * ──────────────────────────────────────────────────────────────── */
    draw_hline(14, 1, g_term_cols);

    /* ----------------------------------------------------------------
     * SATIR 14 — HTTP Method / Status dagilimi
     * ---------------------------------------------------------------- */
    goto_rc(14, 2);
    printf(RETRO_HEADER "HTTP:" ANSI_RESET
           RETRO_LBL "  GET "    ANSI_RESET RETRO_VAL "%-7ld" ANSI_RESET
           RETRO_LBL "  POST "   ANSI_RESET RETRO_VAL "%-7ld" ANSI_RESET
           RETRO_LBL "  PUT "    ANSI_RESET RETRO_VAL "%-7ld" ANSI_RESET
           RETRO_LBL "  DELETE " ANSI_RESET RETRO_VAL "%-7ld" ANSI_RESET
           RETRO_LBL "  Diger "  ANSI_RESET RETRO_VAL "%-6ld" ANSI_RESET
           RETRO_DIM "  " VSEP ANSI_RESET
           RETRO_LBL "  2xx " ANSI_RESET RETRO_OK   "%-7ld" ANSI_RESET
           RETRO_LBL "  3xx " ANSI_RESET RETRO_VAL  "%-7ld" ANSI_RESET
           RETRO_LBL "  4xx " ANSI_RESET RETRO_WARN "%-7ld" ANSI_RESET
           RETRO_LBL "  5xx " ANSI_RESET RETRO_CRIT "%ld"   ANSI_RESET,
           stats->cnt_get, stats->cnt_post, stats->cnt_put,
           stats->cnt_delete, stats->cnt_other,
           stats->cnt_2xx, stats->cnt_3xx, stats->cnt_4xx, stats->cnt_5xx);
    erase_eol();

    /* ----------------------------------------------------------------
     * SATIR 15 — Ayrac
     * ---------------------------------------------------------------- */
    draw_hline(15, 1, g_term_cols);

    /* ----------------------------------------------------------------
     * SATIR 16-24 — Aktif Alarmlar (son 8)
     * ---------------------------------------------------------------- */
    goto_rc(16, 2);
    printf(RETRO_BULLET " " RETRO_HEADER "AKTIF ALARMLAR" ANSI_RESET
           RETRO_DIM "  (son 8)" ANSI_RESET);
    erase_eol();

    for (int i = 0; i < 8; i++) {
        goto_rc(17 + i, 2);
        if (i == 0 && stats->last_alert_cnt == 0) {
            printf(RETRO_BULLET_OK " " RETRO_OK
                   "Sistem normal. Anormallik tespit edilmedi." ANSI_RESET);
        } else if (i < stats->last_alert_cnt) {
            const Alert *a = &stats->last_alerts[i];
            struct tm *at = localtime(&a->ts);
            char atsbuf[12];
            snprintf(atsbuf, sizeof(atsbuf), "%02d:%02d:%02d",
                     at->tm_hour, at->tm_min, at->tm_sec);
            printf(RETRO_BULLET_ALARM " %s[%s]" ANSI_RESET
                   RETRO_DIM " %s " ANSI_RESET
                   RETRO_VAL "%-17s" ANSI_RESET
                   " %.68s",
                   alert_color(a->level), alert_label(a->level),
                   atsbuf, a->ip, a->message);
        }
        erase_eol();
    }

    /* ----------------------------------------------------------------
     * SATIR 25 — Ayrac
     * ---------------------------------------------------------------- */
    draw_hline(25, 1, g_term_cols);

    /* ----------------------------------------------------------------
     * SATIR 26-37 — Top-10 Tehdit  |  Ban Gecmisi
     * ---------------------------------------------------------------- */
    int bx = g_term_cols / 2 + 2;   /* ban listesi baslangic sutunu */
    if (bx < 46) bx = 46;
    if (bx > g_term_cols - 22) bx = g_term_cols - 22;

    /* Sol: Top-10 baslik */
    goto_rc(26, 2);
    printf(RETRO_BULLET " " RETRO_HEADER "TOP-10 TEHDIT SKORU" ANSI_RESET);
    erase_eol();

    /* Sag: Ban gecmisi baslik */
    goto_rc(26, bx);
    printf(RETRO_BULLET " " RETRO_HEADER "BAN GECMISI" ANSI_RESET);

    /* Top-10 kolon baslik satiri */
    goto_rc(27, 2);
    printf(RETRO_DIM "  %-3s  %-18s  %-9s  %-7s  %-7s  %-7s  %-9s  %-7s" ANSI_RESET,
           "#", "IP ADRESI", "TOPLAM", "4xx", "SQLi", "YAVAS", "SKOR", "DURUM");
    erase_eol();

    /* Top-10 ic ayrac */
    goto_rc(28, 2);
    printf(RETRO_DIM);
    int top10_w = bx - 4;
    for (int i = 0; i < top10_w && i < g_term_cols - 4; i++) printf(HLINE);
    printf(ANSI_RESET);

    /* Heap kopyasi uzerinden siralama */
    MinHeap   tmp_heap = *top10;
    IpRecord *sorted[HEAP_K] = {NULL};
    heap_sort_desc(&tmp_heap, sorted);

    int top_rows_avail = g_term_rows - 30;
    if (top_rows_avail < 0) top_rows_avail = 0;
    int top_rows = HEAP_K;
    if (top_rows > top_rows_avail) top_rows = top_rows_avail;
    for (int i = 0; i < top_rows; i++) {
        goto_rc(29 + i, 2);
        IpRecord *rec = sorted[i];
        if (!rec || rec->ip[0] == '\0') { erase_eol(); continue; }

        long total = atomic_load(&rec->cnt.total_requests);
        long err4  = atomic_load(&rec->cnt.error_4xx);
        long sqli  = atomic_load(&rec->cnt.sqli_hits);
        long slow  = atomic_load(&rec->cnt.resp_slow);
        long score = total + sqli * 50L + err4 * 3L + slow * 5L;

        const char *rank_col = (i == 0) ? RETRO_CRIT :
                               (i  < 3) ? RETRO_WARN : RETRO_VAL;

        const char *st_str = atomic_load(&rec->banned) ? "BANLI"   :
                             sqli > 0                   ? "SALDIRI" :
                             err4 > 10                  ? "SUPHELI" : "normal";

        const char *st_col = atomic_load(&rec->banned) ? RETRO_CRIT :
                             sqli > 0                   ? RETRO_CRIT :
                             err4 > 10                  ? RETRO_WARN : RETRO_DIM;

        printf("  %s%-3d  %-18s  %-9ld  %-7ld  %-7ld  %-7ld  %-9ld  %s%s" ANSI_RESET,
               rank_col, i + 1, rec->ip, total, err4, sqli, slow, score,
               st_col, st_str);
        erase_eol();
    }
    if (top_rows == 0) {
        goto_rc(g_term_rows - 2, 2);
        printf(RETRO_DIM "Terminal yuksekligi dusuk: Top-10 listesi kisildi." ANSI_RESET);
        erase_eol();
    }

    /* Ban gecmisi listesi */
    int ban_rows_avail = g_term_rows - 28;
    if (ban_rows_avail < 0) ban_rows_avail = 0;
    int ban_rows = BAN_HISTORY_LEN;
    if (ban_rows > ban_rows_avail) ban_rows = ban_rows_avail;
    for (int i = 0; i < ban_rows; i++) {
        goto_rc(27 + i, bx);
        if (i == 0 && stats->ban_history_cnt == 0) {
            printf(RETRO_DIM "-- Ban uygulanmadi --" ANSI_RESET);
        } else if (i < stats->ban_history_cnt) {
            const BanEntry *b = &stats->ban_history[i];
            struct tm *bt = localtime(&b->ts);
            char bts[12];
            snprintf(bts, sizeof(bts), "%02d:%02d:%02d",
                     bt->tm_hour, bt->tm_min, bt->tm_sec);
            printf(RETRO_DIM "%s  " ANSI_RESET RETRO_CRIT "%-16s" ANSI_RESET,
                   bts, b->ip);
        }
        erase_eol();
    }

    /* ----------------------------------------------------------------
     * ALT CUBUK — son satir
     * ---------------------------------------------------------------- */
    goto_rc(g_term_rows, 1);
    printf(RETRO_DIM);
    for (int i = 0; i < g_term_cols; i++) printf(HLINE);
    printf(ANSI_RESET);
    goto_rc(g_term_rows, 2);
    printf(RETRO_DIM " [Q] Cikis  [SPACE] Duraklat  [B] IP Banla  " ANSI_RESET
           RETRO_MESH "[M] Mesh Yay\xc4\xb1nla" ANSI_RESET
           RETRO_DIM "  " VSEP "  " ANSI_RESET
           RETRO_RCE " Zero Trust RCE Aktif " ANSI_RESET);
    erase_eol();

    fflush(stdout);
}

void tui_push_alert(TuiStats *stats, const Alert *a) {
    if (stats->last_alert_cnt < 8) {
        stats->last_alerts[stats->last_alert_cnt++] = *a;
    } else {
        memmove(&stats->last_alerts[0], &stats->last_alerts[1], 7 * sizeof(Alert));
        stats->last_alerts[7] = *a;
    }
    stats->alerts_total++;
    
    /* Ayrıca SIEM'e gönder (eğer aktifse) */
    siem_forwarder_publish(a, "TUI_Alert");
}

void tui_push_ban(TuiStats *stats, const char *ip, time_t ts) {
    BanEntry b;
    size_t len = strlen(ip);
    if (len >= IP_STR_LEN) len = IP_STR_LEN - 1;
    memcpy(b.ip, ip, len);
    b.ip[len] = '\0';
    b.ts = ts;
    if (stats->ban_history_cnt < BAN_HISTORY_LEN) {
        stats->ban_history[stats->ban_history_cnt++] = b;
    } else {
        memmove(&stats->ban_history[0], &stats->ban_history[1],
                (BAN_HISTORY_LEN - 1) * sizeof(BanEntry));
        stats->ban_history[BAN_HISTORY_LEN - 1] = b;
    }
}