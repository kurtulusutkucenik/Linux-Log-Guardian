#ifndef IP_MAP_H
#define IP_MAP_H
#define IPV4_ADDR_LEN (16)
#define IPV6_ADDR_LEN (32)
#include "parser.h"
#include <stdatomic.h>
#include <stdint.h>
#include <time.h>

// Sliding Time Window — Low & Slow tespiti icin
// Son N saniyedeki istek zaman damgalari saklanir
#define WINDOW_SLOTS   128
#define WINDOW_SECONDS 300   // 5 dakikalik pencere


typedef struct {
    time_t   times[WINDOW_SLOTS];  // dairesel tampon
    _Atomic uint32_t head;         // yazma indeksi (atomik)
    _Atomic uint32_t count;        // penceredeki toplam (atomik)
} SlidingWindow;

// IP kaydı — 64-byte cache satirina hizali (false sharing onlemi)
#define IP_STR_LEN 46   // IPv6 max 45 karakter

/*
 * IpCounters — Yuksek frekanslı yazilan sayaclar KENDI 64-byte cache
 * satirinda izole edilir. Boylece Thread-A total_requests yazarken
 * Thread-B error_4xx yazsa dahi CPU cache invalidation olmaz.
 *
 * Boyut: 6 x 8 = 48 byte + 16 byte dolgu = 64 byte (tek cache satiri).
 */
#define MAX_ENDPOINT_LIMITS 8

typedef struct __attribute__((aligned(128))) {
    _Atomic long     total_requests;
    _Atomic long     error_4xx;
    _Atomic long     error_5xx;
    _Atomic long     sqli_hits;
    _Atomic long     resp_slow;
    _Atomic uint64_t lru_seq;      /* LRU: her guncelleme artar */
    _Atomic uint16_t endpoint_hits[MAX_ENDPOINT_LIMITS];
    uint8_t          _pad[128 - (5*8 + 8 + MAX_ENDPOINT_LIMITS*2)]; /* 128 byte hizalama */
} IpCounters;

/*
 * IpRecord — Kimlik + kontrol alanlari IpCounters'tan ayri cache satirinda.
 * `cnt` alani baska bir cache satirina hizalandiginden, farkli thread'lerin
 * ayni kayit uzerindeki sayac ve kimlik alanlari birbirini kirletmez.
 */
typedef struct __attribute__((aligned(64))) {
    char             ip[IP_STR_LEN];
    _Atomic uint8_t  state;         /* 0: bos, 1: rezerve, 2: hazir */
    _Atomic uint32_t version;       /* ABA / Tahliye versiyonu */
    _Atomic uint8_t  threat_stage;  /* SIEM FSM: 0=CLEAN..4=PERSISTENT */
    _Atomic int      banned;        /* 1 = ipset block listesine eklendi */
    _Atomic time_t   ban_until_ts;  /* ban bitis zamani */
    _Atomic time_t   last_alert_ts; /* alarm spam cooldown */
    time_t           first_seen;
    time_t           last_seen;
    SlidingWindow    window;
    IpCounters       cnt;           /* Ayri cache satirinda hot counter'lar */
} IpRecord;

// Hash Map (open-addressing)
#define MAP_CAPACITY  (1 << 16)   // 65536 slot, 2^n olmali
#define MAP_LOAD_MAX  0.75

typedef struct {
    IpRecord    *slots;
    size_t       capacity;
    _Atomic size_t size;
} IpMap;

int       ipmap_init(IpMap *m);
IpRecord *ipmap_get_or_create(IpMap *m, StrView ip_sv);
void      ipmap_update(IpRecord *rec, const LogEntry *e);
size_t    ipmap_size(const IpMap *m);

/*
 * ipmap_evict_lru — En eski (lru_seq en kucuk) ve dusuk tehdit seviyeli
 * (threat_stage < 2) kayitlari haritadan kaldirir.
 * evict_count: kaldirilacak maksimum kayit sayisi.
 * Donus: gercekte evict edilen kayit sayisi.
 */
size_t    ipmap_evict_lru(IpMap *m, size_t evict_count);

void     window_push(SlidingWindow *w, time_t ts);
uint32_t window_count_since(SlidingWindow *w, time_t since);
uint32_t ipmap_window_count_since(IpRecord *rec, time_t since);

/* TTL dolmus banlari kaldir; cb(ip) 0 donerse unban basarili sayilir */
size_t ipmap_expire_bans(IpMap *m, time_t now,
                         int (*cb)(const char *ip, void *ctx), void *ctx);

#endif /* IP_MAP_H */