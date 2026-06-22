#define _GNU_SOURCE
#include "db.h"
#include "xdp_loader.h"
#include <arpa/inet.h>
#include <pthread.h>
#include <stdio.h>
#include <string.h>
#include <sqlite3.h>
#include <time.h>
#include <unistd.h>
#include <stdatomic.h>

static char g_db_path[256];
static int  g_db_ready = 0;
static pthread_mutex_t g_db_mutex = PTHREAD_MUTEX_INITIALIZER;
static sqlite3 *g_db = NULL;

/* Asenkron DB Loglama Ring Buffer (Lock-Free) */
#define ASYNC_QUEUE_SIZE 4096

typedef struct {
    Alert alert;
    char ip[46];
    int total_requests;
    int error_4xx;
    int sqli_hits;
    int resp_slow;
    int banned;
} DbTask;

static DbTask g_db_queue[ASYNC_QUEUE_SIZE];
static _Atomic uint32_t g_queue_head = 0;
static _Atomic uint32_t g_queue_tail = 0;
static _Atomic uint64_t g_db_dropped = 0;
static pthread_t g_db_writer_thread;
static volatile int g_db_writer_running = 0;

static void *db_writer_thread_fn(void *arg) {
    (void)arg;
    sqlite3_exec(g_db, "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL;", NULL, NULL, NULL);

    while (g_db_writer_running || atomic_load(&g_queue_head) != atomic_load(&g_queue_tail)) {
        uint32_t head = atomic_load(&g_queue_head);
        uint32_t tail = atomic_load(&g_queue_tail);

        if (head == tail) {
            usleep(10000); // 10ms
            continue;
        }

        pthread_mutex_lock(&g_db_mutex);
        sqlite3_exec(g_db, "BEGIN TRANSACTION;", NULL, NULL, NULL);
        
        sqlite3_stmt *stmt = NULL;
        const char *sql =
            "INSERT INTO alerts (ts,ip,level,message,incident_id,total_requests,"
            "error_4xx,sqli_hits,resp_slow,banned) VALUES (?,?,?,?,?,?,?,?,?,?);";
        if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) == SQLITE_OK) {
            while (head != tail) {
                uint32_t slot = head % ASYNC_QUEUE_SIZE;
                DbTask *task = &g_db_queue[slot];

                sqlite3_bind_int64(stmt, 1, (sqlite3_int64)task->alert.ts);
                sqlite3_bind_text(stmt,  2, task->ip, -1, SQLITE_TRANSIENT);
                sqlite3_bind_int(stmt,   3, (int)task->alert.level);
                sqlite3_bind_text(stmt,  4, task->alert.message, -1, SQLITE_TRANSIENT);
                sqlite3_bind_text(stmt,  5,
                    task->alert.incident_id[0] ? task->alert.incident_id : "",
                    -1, SQLITE_TRANSIENT);
                sqlite3_bind_int64(stmt, 6, (sqlite3_int64)task->total_requests);
                sqlite3_bind_int64(stmt, 7, (sqlite3_int64)task->error_4xx);
                sqlite3_bind_int64(stmt, 8, (sqlite3_int64)task->sqli_hits);
                sqlite3_bind_int64(stmt, 9, (sqlite3_int64)task->resp_slow);
                sqlite3_bind_int(stmt,  10, task->banned);
                
                sqlite3_step(stmt);
                sqlite3_reset(stmt);
                sqlite3_clear_bindings(stmt);

                head++;
                atomic_store(&g_queue_head, head);
            }
            sqlite3_finalize(stmt);
        }
        sqlite3_exec(g_db, "COMMIT;", NULL, NULL, NULL);
        pthread_mutex_unlock(&g_db_mutex);
    }
    return NULL;
}


static int exec_sql(const char *sql) {
    char *errmsg = NULL;
    int rc = sqlite3_exec(g_db, sql, NULL, NULL, &errmsg);
    if (rc != SQLITE_OK) {
        if (errmsg) {
            fprintf(stderr, "[DB] SQL hata: %s\n", errmsg);
            sqlite3_free(errmsg);
        }
        return -1;
    }
    return 0;
}

/* Eski DB'lerde kolon yoksa ALTER; zaten varsa sessiz gec */
static int exec_sql_migrate_col(const char *sql) {
    char *errmsg = NULL;
    int rc = sqlite3_exec(g_db, sql, NULL, NULL, &errmsg);
    if (rc == SQLITE_OK) return 0;
    if (errmsg && strstr(errmsg, "duplicate column name:")) {
        sqlite3_free(errmsg);
        return 0;
    }
    if (errmsg) {
        fprintf(stderr, "[DB] SQL hata: %s\n", errmsg);
        sqlite3_free(errmsg);
    }
    return -1;
}

int db_init(const char *path) {
    if (!path || !*path) return -1;
    size_t n = strlen(path);
    if (n >= sizeof(g_db_path)) n = sizeof(g_db_path) - 1;
    memcpy(g_db_path, path, n);
    g_db_path[n] = '\0';

    if (sqlite3_open(g_db_path, &g_db) != SQLITE_OK) {
        fprintf(stderr, "[DB] Acilamadi: %s\n", sqlite3_errmsg(g_db));
        if (g_db) sqlite3_close(g_db);
        g_db = NULL;
        g_db_ready = 0;
        return -1;
    }

    if (exec_sql("CREATE TABLE IF NOT EXISTS alerts ("
                 "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                 "ts INTEGER NOT NULL, ip TEXT NOT NULL,"
                 "level INTEGER NOT NULL, message TEXT NOT NULL,"
                 "incident_id TEXT,"
                 "total_requests INTEGER NOT NULL, error_4xx INTEGER NOT NULL,"
                 "sqli_hits INTEGER NOT NULL, resp_slow INTEGER NOT NULL,"
                 "banned INTEGER NOT NULL);") != 0) {
        sqlite3_close(g_db);
        g_db = NULL;
        return -1;
    }
    (void)exec_sql_migrate_col("ALTER TABLE alerts ADD COLUMN incident_id TEXT;");

    if (exec_sql("CREATE TABLE IF NOT EXISTS ban_events ("
                 "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                 "ts INTEGER NOT NULL, ip TEXT NOT NULL,"
                 "action TEXT NOT NULL, reason TEXT NOT NULL);") != 0) {
        sqlite3_close(g_db);
        g_db = NULL;
        return -1;
    }

    (void)exec_sql_migrate_col("ALTER TABLE ban_events ADD COLUMN risk_score REAL;");
    (void)exec_sql_migrate_col("ALTER TABLE ban_events ADD COLUMN policy TEXT;");

    if (exec_sql("CREATE TABLE IF NOT EXISTS telegram_acks ("
                 "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                 "ts INTEGER NOT NULL, chat_id TEXT NOT NULL,"
                 "ack_key TEXT NOT NULL, incident_id TEXT);") != 0) {
        sqlite3_close(g_db);
        g_db = NULL;
        return -1;
    }
    (void)exec_sql_migrate_col(
        "ALTER TABLE telegram_acks ADD COLUMN operator_id TEXT;");
    (void)exec_sql_migrate_col(
        "ALTER TABLE telegram_acks ADD COLUMN operator_name TEXT;");

    g_db_ready = 1;
    g_db_writer_running = 1;
    pthread_create(&g_db_writer_thread, NULL, db_writer_thread_fn, NULL);
    return 0;
}


void db_load_previous_bans(IpMap *map) {
    if (!g_db_ready || !g_db || !map) return;

    /* Son ban_events aksiyonu BAN olan IP'ler (alerts.banned stale olabilir) */
    const char *sql =
        "SELECT b.ip FROM ban_events b "
        "INNER JOIN (SELECT ip, MAX(id) AS mid FROM ban_events GROUP BY ip) x "
        "ON b.ip = x.ip AND b.id = x.mid "
        "WHERE UPPER(b.action) = 'BAN';";
    sqlite3_stmt *stmt = NULL;

    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        int loaded_count = 0;
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            const unsigned char *ip_str = sqlite3_column_text(stmt, 0);
            if (ip_str) {
                StrView sv = { (const char*)ip_str, strlen((const char*)ip_str) };
                IpRecord *rec = ipmap_get_or_create(map, sv);
                if (rec && !atomic_load(&rec->banned)) {
                    atomic_store(&rec->banned, 1);
                    atomic_store(&rec->ban_until_ts, time(NULL) + 86400);
                    loaded_count++;
                }
            }
        }
        sqlite3_finalize(stmt);
        if (loaded_count > 0)
            fprintf(stderr, "[DB] %d adet onceki ban RAM'e (ip_map) yuklendi.\n",
                    loaded_count);
    }
}


/*
 * db_sync_xdp_bans — Boot-Sync Mekanizması
 *
 * Veritabanındaki ban_events tablosunu tarayarak "ban" aksiyonlu tüm IP'leri
 * XDP kernel map'ine (xdp_ban_ipv4 / xdp_ban_ipv6) yükler.
 * Bu fonksiyon xdp_loader_init() başarıyla tamamlandıktan hemen sonra çağrılmalıdır.
 */
void db_sync_xdp_bans(void) {
    if (!g_db_ready || !g_db) return;
    if (!xdp_loader_active()) return;

    const char *sql =
        "SELECT DISTINCT ip FROM ban_events WHERE action = 'ban';";
    sqlite3_stmt *stmt = NULL;

    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        fprintf(stderr, "[DB] db_sync_xdp_bans: sorgu hazirlanamadi: %s\n",
                sqlite3_errmsg(g_db));
        return;
    }

    int synced = 0;
    int failed = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        const unsigned char *ip_raw = sqlite3_column_text(stmt, 0);
        if (!ip_raw) continue;
        const char *ip = (const char *)ip_raw;

        int rc;
        /* IPv6 adresi ':' karakteri içerir */
        if (strchr(ip, ':'))
            rc = xdp_ban_ipv6(ip);
        else
            rc = xdp_ban_ipv4(ip);

        if (rc == 0) synced++;
        else         failed++;
    }
    sqlite3_finalize(stmt);

    fprintf(stderr,
            "[DB] Boot-sync: %d IP XDP kernel map'ine yuklendi, %d basarisiz.\n",
            synced, failed);
}

void db_close(void) {
    if (g_db_writer_running) {
        g_db_writer_running = 0;
        pthread_join(g_db_writer_thread, NULL);
    }
    pthread_mutex_lock(&g_db_mutex);
    g_db_ready = 0;
    if (g_db) {
        sqlite3_close(g_db);
        g_db = NULL;
    }
    pthread_mutex_unlock(&g_db_mutex);
}

void db_enqueue_alert(const Alert *a, const IpRecord *rec) {
    if (!g_db_ready || !a || !rec) return;

    uint32_t tail = atomic_load(&g_queue_tail);
    uint32_t head = atomic_load(&g_queue_head);
    if (tail - head >= ASYNC_QUEUE_SIZE) {
        atomic_fetch_add(&g_db_dropped, 1);
        return;
    }

    uint32_t current_tail = atomic_fetch_add(&g_queue_tail, 1);
    uint32_t slot = current_tail % ASYNC_QUEUE_SIZE;

    g_db_queue[slot].alert = *a;
    strncpy(g_db_queue[slot].ip, rec->ip, sizeof(g_db_queue[slot].ip) - 1);
    g_db_queue[slot].ip[sizeof(g_db_queue[slot].ip)-1] = '\0';
    g_db_queue[slot].total_requests = atomic_load(&rec->cnt.total_requests);
    g_db_queue[slot].error_4xx = atomic_load(&rec->cnt.error_4xx);
    g_db_queue[slot].sqli_hits = atomic_load(&rec->cnt.sqli_hits);
    g_db_queue[slot].resp_slow = atomic_load(&rec->cnt.resp_slow);
    g_db_queue[slot].banned = atomic_load(&rec->banned) ? 1 : 0;
}

int db_status_snapshot(const char *path, DbStatusSnapshot *out)
{
    if (!path || !*path || !out) return -1;
    memset(out, 0, sizeof(*out));

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(path, &db, SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
        if (db) sqlite3_close(db);
        return -1;
    }

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db,
            "SELECT COUNT(*) FROM alerts;", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW)
            out->alerts_total = (long)sqlite3_column_int64(stmt, 0);
        sqlite3_finalize(stmt);
    }

    if (sqlite3_prepare_v2(db,
            "SELECT COUNT(*) FROM ban_events b "
            "INNER JOIN ("
            "  SELECT ip, MAX(id) AS max_id FROM ban_events GROUP BY ip"
            ") latest ON b.id = latest.max_id "
            "WHERE UPPER(b.action) = 'BAN';", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW)
            out->bans_active = (long)sqlite3_column_int64(stmt, 0);
        sqlite3_finalize(stmt);
    }

    if (sqlite3_prepare_v2(db,
            "SELECT ts, ip, level, message, COALESCE(incident_id,'') "
            "FROM alerts ORDER BY id DESC LIMIT ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, DB_STATUS_MAX_ALERTS);
        while (sqlite3_step(stmt) == SQLITE_ROW && out->recent_count < DB_STATUS_MAX_ALERTS) {
            DbRecentAlert *a = &out->recent[out->recent_count++];
            a->ts = (time_t)sqlite3_column_int64(stmt, 0);
            const char *ip = (const char *)sqlite3_column_text(stmt, 1);
            if (ip) {
                strncpy(a->ip, ip, sizeof(a->ip) - 1);
                a->ip[sizeof(a->ip) - 1] = '\0';
            }
            a->level = sqlite3_column_int(stmt, 2);
            const char *msg = (const char *)sqlite3_column_text(stmt, 3);
            if (msg) {
                strncpy(a->message, msg, sizeof(a->message) - 1);
                a->message[sizeof(a->message) - 1] = '\0';
            }
            const char *inc = (const char *)sqlite3_column_text(stmt, 4);
            if (inc) {
                strncpy(a->incident_id, inc, sizeof(a->incident_id) - 1);
                a->incident_id[sizeof(a->incident_id) - 1] = '\0';
            }
        }
        sqlite3_finalize(stmt);
    }

    if (sqlite3_prepare_v2(db,
            "SELECT ts, ip, action, reason FROM ban_events "
            "ORDER BY id DESC LIMIT ?;", -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, DB_STATUS_MAX_BANS);
        while (sqlite3_step(stmt) == SQLITE_ROW &&
               out->recent_ban_count < DB_STATUS_MAX_BANS) {
            DbRecentBan *b = &out->recent_bans[out->recent_ban_count++];
            b->ts = (time_t)sqlite3_column_int64(stmt, 0);
            const char *ip = (const char *)sqlite3_column_text(stmt, 1);
            const char *act = (const char *)sqlite3_column_text(stmt, 2);
            const char *rsn = (const char *)sqlite3_column_text(stmt, 3);
            if (ip) {
                strncpy(b->ip, ip, sizeof(b->ip) - 1);
                b->ip[sizeof(b->ip) - 1] = '\0';
            }
            if (act) {
                strncpy(b->action, act, sizeof(b->action) - 1);
                b->action[sizeof(b->action) - 1] = '\0';
            }
            if (rsn) {
                strncpy(b->reason, rsn, sizeof(b->reason) - 1);
                b->reason[sizeof(b->reason) - 1] = '\0';
            }
        }
        sqlite3_finalize(stmt);
    }

    sqlite3_close(db);
    return 0;
}

int db_prune_intel_ban_events(const char *path, int ttl_days)
{
    if (!path || !*path) return -1;

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(path, &db, SQLITE_OPEN_READWRITE, NULL) != SQLITE_OK) {
        if (db) sqlite3_close(db);
        return -1;
    }

    sqlite3_stmt *stmt = NULL;
    int deleted = 0;
    const char *sql =
        "DELETE FROM ban_events WHERE "
        "(reason = 'threat-intel' OR reason LIKE 'threat-intel%' OR "
        " reason LIKE 'geoip%' OR reason IN ('url','stix','abuseipdb','otx'))"
        " AND (? <= 0 OR ts < ?);";

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int(stmt, 1, ttl_days);
        if (ttl_days > 0)
            sqlite3_bind_int64(stmt, 2,
                               (sqlite3_int64)(time(NULL) - (time_t)ttl_days * 86400));
        else
            sqlite3_bind_int64(stmt, 2, (sqlite3_int64)time(NULL) + 1);
        if (sqlite3_step(stmt) == SQLITE_DONE)
            deleted = sqlite3_changes(db);
        sqlite3_finalize(stmt);
    }
    sqlite3_close(db);
    return deleted;
}

void db_log_ban_event(const char *ip, const char *action,
                      const char *reason, time_t ts) {
    db_log_ban_event_ex(ip, action, reason, ts, -1.0, NULL);
}

static void telegram_acks_migrate_conn(sqlite3 *db)
{
    if (!db)
        return;
    char *err = NULL;
    if (sqlite3_exec(db,
            "CREATE TABLE IF NOT EXISTS telegram_acks ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "ts INTEGER NOT NULL, chat_id TEXT NOT NULL,"
            "ack_key TEXT NOT NULL, incident_id TEXT);",
            NULL, NULL, &err) != SQLITE_OK && err) {
        sqlite3_free(err);
        err = NULL;
    }
    if (sqlite3_exec(db,
            "ALTER TABLE telegram_acks ADD COLUMN operator_id TEXT;",
            NULL, NULL, &err) != SQLITE_OK && err) {
        sqlite3_free(err);
        err = NULL;
    }
    if (sqlite3_exec(db,
            "ALTER TABLE telegram_acks ADD COLUMN operator_name TEXT;",
            NULL, NULL, &err) != SQLITE_OK && err)
        sqlite3_free(err);
}

static int telegram_ack_operator_exists(sqlite3 *db, const char *ack_key,
                                        const char *operator_id)
{
    if (!db || !ack_key || !ack_key[0] || !operator_id || !operator_id[0])
        return 0;

    sqlite3_stmt *stmt = NULL;
    const char *sql =
        "SELECT 1 FROM telegram_acks WHERE ack_key = ? AND operator_id = ? "
        "LIMIT 1;";
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK)
        return 0;
    sqlite3_bind_text(stmt, 1, ack_key, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, operator_id, -1, SQLITE_STATIC);
    int found = (sqlite3_step(stmt) == SQLITE_ROW);
    sqlite3_finalize(stmt);
    return found;
}

static int telegram_ack_insert(sqlite3 *db, const char *chat_id,
                                 const char *ack_key, const char *incident_id,
                                 const char *operator_id,
                                 const char *operator_name)
{
    if (!db || !chat_id || !chat_id[0] || !ack_key || !ack_key[0])
        return -1;

    telegram_acks_migrate_conn(db);

    const char *op_id = (operator_id && operator_id[0]) ? operator_id : chat_id;
    if (telegram_ack_operator_exists(db, ack_key, op_id))
        return 1;

    sqlite3_stmt *stmt = NULL;
    const char *sql =
        "INSERT INTO telegram_acks "
        "(ts,chat_id,ack_key,incident_id,operator_id,operator_name) "
        "VALUES (?,?,?,?,?,?);";
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK)
        return -1;

    sqlite3_bind_int64(stmt, 1, (sqlite3_int64)time(NULL));
    sqlite3_bind_text(stmt, 2, chat_id, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, ack_key, -1, SQLITE_TRANSIENT);
    if (incident_id && incident_id[0])
        sqlite3_bind_text(stmt, 4, incident_id, -1, SQLITE_TRANSIENT);
    else
        sqlite3_bind_null(stmt, 4);
    sqlite3_bind_text(stmt, 5, op_id, -1, SQLITE_TRANSIENT);
    if (operator_name && operator_name[0])
        sqlite3_bind_text(stmt, 6, operator_name, -1, SQLITE_TRANSIENT);
    else
        sqlite3_bind_null(stmt, 6);
    int rc = (sqlite3_step(stmt) == SQLITE_DONE) ? 0 : -1;
    sqlite3_finalize(stmt);
    return rc;
}

void db_log_telegram_ack(const char *chat_id, const char *ack_key,
                         const char *incident_id) {
    if (!g_db_ready || !chat_id || !chat_id[0] || !ack_key || !ack_key[0])
        return;

    pthread_mutex_lock(&g_db_mutex);
    if (!g_db_ready || !g_db) {
        pthread_mutex_unlock(&g_db_mutex);
        return;
    }
    (void)telegram_ack_insert(g_db, chat_id, ack_key, incident_id, NULL, NULL);
    pthread_mutex_unlock(&g_db_mutex);
}

int db_log_telegram_ack_path(const char *db_path, const char *chat_id,
                             const char *ack_key, const char *incident_id)
{
    return db_telegram_ack_register_path(db_path, chat_id, ack_key, incident_id,
                                         NULL, NULL);
}

int db_telegram_ack_register_path(const char *db_path, const char *chat_id,
                                  const char *ack_key, const char *incident_id,
                                  const char *operator_id,
                                  const char *operator_name)
{
    if (!db_path || !db_path[0])
        return -1;

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(db_path, &db, SQLITE_OPEN_READWRITE, NULL) != SQLITE_OK) {
        if (db)
            sqlite3_close(db);
        return -1;
    }

    int rc = telegram_ack_insert(db, chat_id, ack_key, incident_id,
                                 operator_id, operator_name);
    sqlite3_close(db);
    return rc;
}

int db_telegram_ack_names_path(const char *db_path, const char *ack_key,
                               char *buf, size_t cap)
{
    if (!db_path || !db_path[0] || !ack_key || !ack_key[0] || !buf || cap < 2)
        return -1;
    buf[0] = '\0';

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(db_path, &db, SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
        if (db)
            sqlite3_close(db);
        return -1;
    }
    telegram_acks_migrate_conn(db);

    const char *inc = (strncmp(ack_key, "INC-", 4) == 0) ? ack_key : "";
    sqlite3_stmt *stmt = NULL;
    const char *sql =
        "SELECT DISTINCT COALESCE(NULLIF(operator_name,''), chat_id) "
        "FROM telegram_acks WHERE ack_key = ? "
        "OR (? != '' AND incident_id = ?) ORDER BY ts ASC LIMIT 12;";
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        sqlite3_close(db);
        return -1;
    }
    sqlite3_bind_text(stmt, 1, ack_key, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, inc, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, inc, -1, SQLITE_STATIC);

    size_t pos = 0;
    int n = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        const char *name = (const char *)sqlite3_column_text(stmt, 0);
        if (!name || !name[0])
            continue;
        if (n > 0 && pos + 2 < cap) {
            buf[pos++] = ',';
            buf[pos++] = ' ';
            buf[pos] = '\0';
        }
        size_t len = strlen(name);
        if (pos + len >= cap)
            break;
        memcpy(buf + pos, name, len);
        pos += len;
        buf[pos] = '\0';
        n++;
    }
    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return n > 0 ? 0 : -1;
}

int db_telegram_ack_count_path(const char *db_path, time_t since_ts, long *out)
{
    if (!db_path || !db_path[0] || !out)
        return -1;
    *out = 0;

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(db_path, &db, SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
        if (db)
            sqlite3_close(db);
        return -1;
    }

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db,
            "SELECT COUNT(*) FROM telegram_acks WHERE ts >= ?;",
            -1, &stmt, NULL) != SQLITE_OK) {
        sqlite3_close(db);
        return -1;
    }
    sqlite3_bind_int64(stmt, 1, (sqlite3_int64)since_ts);
    if (sqlite3_step(stmt) == SQLITE_ROW)
        *out = (long)sqlite3_column_int64(stmt, 0);
    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return 0;
}

static const char ack_exists_sql[] =
        "SELECT 1 FROM telegram_acks t WHERE "
        "t.ack_key = ? OR t.ack_key = ? "
        "OR (? != '' AND t.incident_id = ?) LIMIT 1;";

static int db_row_acked(sqlite3 *db, const char *incident_id, const char *ip)
{
    if (!db || !ip || !ip[0])
        return 0;
    const char *inc = (incident_id && incident_id[0]) ? incident_id : "";

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, ack_exists_sql, -1, &stmt, NULL) != SQLITE_OK)
        return 0;

    const char *key = inc[0] ? inc : ip;
    sqlite3_bind_text(stmt, 1, key, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, ip, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, inc, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, inc, -1, SQLITE_STATIC);

    int found = (sqlite3_step(stmt) == SQLITE_ROW);
    sqlite3_finalize(stmt);
    return found;
}

int db_unacked_count_path(const char *db_path, time_t since_ts, long *out)
{
    if (!db_path || !db_path[0] || !out)
        return -1;
    *out = 0;

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(db_path, &db, SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
        if (db)
            sqlite3_close(db);
        return -1;
    }

    sqlite3_stmt *stmt = NULL;
    const char *alert_sql =
        "SELECT COALESCE(incident_id,''), ip FROM alerts "
        "WHERE level >= 2 AND ts >= ? ORDER BY id DESC LIMIT 64;";
    if (sqlite3_prepare_v2(db, alert_sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, (sqlite3_int64)since_ts);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            const char *inc = (const char *)sqlite3_column_text(stmt, 0);
            const char *ip = (const char *)sqlite3_column_text(stmt, 1);
            if (!ip || !ip[0])
                continue;
            if (!db_row_acked(db, inc ? inc : "", ip))
                (*out)++;
        }
        sqlite3_finalize(stmt);
    }

    const char *ban_sql =
        "SELECT ip FROM ban_events "
        "WHERE UPPER(action) = 'BAN' AND ts >= ? ORDER BY id DESC LIMIT 32;";
    if (sqlite3_prepare_v2(db, ban_sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, (sqlite3_int64)since_ts);
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            const char *ip = (const char *)sqlite3_column_text(stmt, 0);
            if (!ip || !ip[0])
                continue;
            if (!db_row_acked(db, "", ip))
                (*out)++;
        }
        sqlite3_finalize(stmt);
    }

    sqlite3_close(db);
    return 0;
}

static const char *level_short(int level)
{
    switch (level) {
    case 3: return "CRIT";
    case 2: return "WARN";
    default: return "ALRT";
    }
}

int db_unacked_format_path(const char *db_path, time_t since_ts,
                           char *buf, size_t cap)
{
    if (!db_path || !db_path[0] || !buf || cap < 32)
        return -1;
    buf[0] = '\0';

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(db_path, &db, SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
        if (db)
            sqlite3_close(db);
        snprintf(buf, cap, "events.db okunamadi.");
        return -1;
    }

    size_t pos = 0;
    int lines = 0;

    sqlite3_stmt *stmt = NULL;
    const char *alert_sql =
        "SELECT ts, ip, level, message, COALESCE(incident_id,'') "
        "FROM alerts WHERE level >= 2 AND ts >= ? "
        "ORDER BY id DESC LIMIT 64;";
    if (sqlite3_prepare_v2(db, alert_sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, (sqlite3_int64)since_ts);
        while (sqlite3_step(stmt) == SQLITE_ROW && lines < DB_UNACKED_MAX) {
            const char *ip = (const char *)sqlite3_column_text(stmt, 1);
            const char *inc = (const char *)sqlite3_column_text(stmt, 4);
            if (!ip || !ip[0])
                continue;
            if (db_row_acked(db, inc ? inc : "", ip))
                continue;

            time_t ts = (time_t)sqlite3_column_int64(stmt, 0);
            int level = sqlite3_column_int(stmt, 2);
            const char *msg = (const char *)sqlite3_column_text(stmt, 3);

            struct tm *tm_info = localtime(&ts);
            char tsbuf[16] = "?";
            if (tm_info)
                strftime(tsbuf, sizeof(tsbuf), "%d.%m %H:%M", tm_info);

            char msg_short[40] = "";
            if (msg) {
                strncpy(msg_short, msg, sizeof(msg_short) - 1);
                for (char *s = msg_short; *s; s++) {
                    if (*s == '\n' || *s == '\r') {
                        *s = ' ';
                        break;
                    }
                }
            }

            pos += (size_t)snprintf(buf + pos, cap - pos,
                                    "%s <code>%s</code> %s",
                                    level_short(level), ip, tsbuf);
            if (msg_short[0])
                pos += (size_t)snprintf(buf + pos, cap - pos, " · %s",
                                        msg_short);
            if (inc && inc[0])
                pos += (size_t)snprintf(buf + pos, cap - pos,
                                        " · <code>%s</code>", inc);
            if (pos + 2 < cap) {
                buf[pos++] = '\n';
                buf[pos] = '\0';
            }
            lines++;
        }
        sqlite3_finalize(stmt);
    }

    const char *ban_sql =
        "SELECT ts, ip, reason FROM ban_events "
        "WHERE UPPER(action) = 'BAN' AND ts >= ? "
        "ORDER BY id DESC LIMIT 32;";
    if (sqlite3_prepare_v2(db, ban_sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, (sqlite3_int64)since_ts);
        while (sqlite3_step(stmt) == SQLITE_ROW && lines < DB_UNACKED_MAX) {
            const char *ip = (const char *)sqlite3_column_text(stmt, 1);
            if (!ip || !ip[0])
                continue;
            if (db_row_acked(db, "", ip))
                continue;

            time_t ts = (time_t)sqlite3_column_int64(stmt, 0);
            const char *rsn = (const char *)sqlite3_column_text(stmt, 2);

            struct tm *tm_info = localtime(&ts);
            char tsbuf[16] = "?";
            if (tm_info)
                strftime(tsbuf, sizeof(tsbuf), "%d.%m %H:%M", tm_info);

            char rsn_short[36] = "";
            if (rsn) {
                strncpy(rsn_short, rsn, sizeof(rsn_short) - 1);
                for (char *s = rsn_short; *s; s++) {
                    if (*s == '\n' || *s == '\r') {
                        *s = ' ';
                        break;
                    }
                }
            }

            pos += (size_t)snprintf(buf + pos, cap - pos,
                                    "BAN <code>%s</code> %s", ip, tsbuf);
            if (rsn_short[0])
                pos += (size_t)snprintf(buf + pos, cap - pos, " · %s",
                                        rsn_short);
            if (pos + 2 < cap) {
                buf[pos++] = '\n';
                buf[pos] = '\0';
            }
            lines++;
        }
        sqlite3_finalize(stmt);
    }

    sqlite3_close(db);
    if (lines == 0)
        snprintf(buf, cap, "Son 24 saatte onay bekleyen yok.");
    return lines;
}

int db_incident_format_path(const char *db_path, const char *incident_id,
                            char *buf, size_t cap)
{
    if (!db_path || !db_path[0] || !incident_id || !incident_id[0]
        || !buf || cap < 64)
        return -1;
    buf[0] = '\0';

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(db_path, &db, SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
        if (db)
            sqlite3_close(db);
        snprintf(buf, cap, "events.db okunamadi.");
        return -1;
    }

    size_t pos = 0;
    pos += (size_t)snprintf(buf + pos, cap - pos,
                            "<code>%s</code>\n", incident_id);

    char primary_ip[46] = "";
    int alert_n = 0;

    sqlite3_stmt *stmt = NULL;
    const char *alert_sql =
        "SELECT ts, ip, level, message FROM alerts "
        "WHERE incident_id = ? ORDER BY id DESC LIMIT 8;";
    if (sqlite3_prepare_v2(db, alert_sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, incident_id, -1, SQLITE_STATIC);
        while (sqlite3_step(stmt) == SQLITE_ROW && pos + 64 < cap) {
            time_t ts = (time_t)sqlite3_column_int64(stmt, 0);
            const char *ip = (const char *)sqlite3_column_text(stmt, 1);
            int level = sqlite3_column_int(stmt, 2);
            const char *msg = (const char *)sqlite3_column_text(stmt, 3);
            if (ip && ip[0] && !primary_ip[0]) {
                strncpy(primary_ip, ip, sizeof(primary_ip) - 1);
            }

            struct tm *tm_info = localtime(&ts);
            char tsbuf[16] = "?";
            if (tm_info)
                strftime(tsbuf, sizeof(tsbuf), "%d.%m %H:%M", tm_info);

            char msg_short[48] = "";
            if (msg) {
                strncpy(msg_short, msg, sizeof(msg_short) - 1);
                for (char *s = msg_short; *s; s++) {
                    if (*s == '\n' || *s == '\r') {
                        *s = ' ';
                        break;
                    }
                }
            }

            pos += (size_t)snprintf(buf + pos, cap - pos,
                                    "• %s <code>%s</code> %s · %s\n",
                                    level_short(level),
                                    ip ? ip : "?",
                                    tsbuf, msg_short[0] ? msg_short : "-");
            alert_n++;
        }
        sqlite3_finalize(stmt);
    }

    if (alert_n == 0) {
        sqlite3_close(db);
        snprintf(buf, cap, "<code>%s</code> bulunamadi.", incident_id);
        return -1;
    }

    if (primary_ip[0]) {
        const char *ban_sql =
            "SELECT ts, reason FROM ban_events "
            "WHERE ip = ? AND UPPER(action) = 'BAN' "
            "ORDER BY id DESC LIMIT 3;";
        if (sqlite3_prepare_v2(db, ban_sql, -1, &stmt, NULL) == SQLITE_OK) {
            sqlite3_bind_text(stmt, 1, primary_ip, -1, SQLITE_STATIC);
            int ban_n = 0;
            while (sqlite3_step(stmt) == SQLITE_ROW && pos + 64 < cap) {
                time_t ts = (time_t)sqlite3_column_int64(stmt, 0);
                const char *rsn = (const char *)sqlite3_column_text(stmt, 1);
                struct tm *tm_info = localtime(&ts);
                char tsbuf[16] = "?";
                if (tm_info)
                    strftime(tsbuf, sizeof(tsbuf), "%d.%m %H:%M", tm_info);
                if (ban_n == 0)
                    pos += (size_t)snprintf(buf + pos, cap - pos, "\nBan:\n");
                pos += (size_t)snprintf(buf + pos, cap - pos,
                                        "• <code>%s</code> %s · %s\n",
                                        primary_ip, tsbuf,
                                        rsn ? rsn : "-");
                ban_n++;
            }
            sqlite3_finalize(stmt);
        }
    }

    if (db_row_acked(db, incident_id, primary_ip[0] ? primary_ip : "")) {
        pos += (size_t)snprintf(buf + pos, cap - pos, "\n✅ Onaylandi");
    } else {
        pos += (size_t)snprintf(buf + pos, cap - pos,
                                "\n⏳ Onay bekliyor");
    }

    sqlite3_close(db);
    return alert_n;
}

static int db_count_since(sqlite3 *db, const char *sql, time_t since_ts, long *out)
{
    if (!db || !sql || !out)
        return -1;
    *out = 0;
    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK)
        return -1;
    sqlite3_bind_int64(stmt, 1, (sqlite3_int64)since_ts);
    if (sqlite3_step(stmt) == SQLITE_ROW)
        *out = (long)sqlite3_column_int64(stmt, 0);
    sqlite3_finalize(stmt);
    return 0;
}

int db_daily_summary_path(const char *db_path, time_t since_ts, DbDailySummary *out)
{
    if (!db_path || !db_path[0] || !out)
        return -1;
    memset(out, 0, sizeof(*out));

    sqlite3 *db = NULL;
    if (sqlite3_open_v2(db_path, &db, SQLITE_OPEN_READONLY, NULL) != SQLITE_OK) {
        if (db)
            sqlite3_close(db);
        return -1;
    }

    (void)db_count_since(db, "SELECT COUNT(*) FROM alerts WHERE ts >= ?;",
                         since_ts, &out->alerts_total);
    (void)db_count_since(db,
                         "SELECT COUNT(*) FROM alerts WHERE ts >= ? AND level >= 3;",
                         since_ts, &out->alerts_crit);
    (void)db_count_since(db,
                         "SELECT COUNT(*) FROM alerts WHERE ts >= ? AND level = 2;",
                         since_ts, &out->alerts_warn);
    (void)db_count_since(db,
                         "SELECT COUNT(*) FROM alerts WHERE ts >= ? AND level = 1;",
                         since_ts, &out->alerts_info);
    (void)db_count_since(db,
                         "SELECT COUNT(*) FROM ban_events WHERE ts >= ? "
                         "AND UPPER(action) = 'BAN';",
                         since_ts, &out->bans_new);
    (void)db_count_since(db,
                         "SELECT COUNT(*) FROM alerts WHERE ts >= ? "
                         "AND message LIKE 'TUZAK%';",
                         since_ts, &out->traps);
    (void)db_telegram_ack_count_path(db_path, since_ts, &out->acks);
    (void)db_unacked_count_path(db_path, since_ts, &out->unacked);

    sqlite3_stmt *stmt = NULL;
    if (sqlite3_prepare_v2(db,
            "SELECT COUNT(*) FROM ban_events b "
            "INNER JOIN ("
            "  SELECT ip, MAX(id) AS max_id FROM ban_events GROUP BY ip"
            ") latest ON b.id = latest.max_id "
            "WHERE UPPER(b.action) = 'BAN';", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW)
            out->bans_active = (long)sqlite3_column_int64(stmt, 0);
        sqlite3_finalize(stmt);
    }

    sqlite3_close(db);
    return 0;
}

void db_log_ban_event_ex(const char *ip, const char *action,
                         const char *reason, time_t ts,
                         double risk_score, const char *policy) {
    if (!g_db_ready || !ip || !action || !reason) return;
    pthread_mutex_lock(&g_db_mutex);
    if (!g_db_ready || !g_db) {
        pthread_mutex_unlock(&g_db_mutex);
        return;
    }

    sqlite3_stmt *stmt = NULL;
    const char *sql =
        "INSERT INTO ban_events (ts,ip,action,reason,risk_score,policy) "
        "VALUES (?,?,?,?,?,?);";
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_int64(stmt, 1, (sqlite3_int64)ts);
        sqlite3_bind_text(stmt,  2, ip, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt,  3, action, -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt,  4, reason, -1, SQLITE_TRANSIENT);
        if (risk_score >= 0.0)
            sqlite3_bind_double(stmt, 5, risk_score);
        else
            sqlite3_bind_null(stmt, 5);
        if (policy && policy[0])
            sqlite3_bind_text(stmt, 6, policy, -1, SQLITE_TRANSIENT);
        else
            sqlite3_bind_null(stmt, 6);
        (void)sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }
    pthread_mutex_unlock(&g_db_mutex);
}