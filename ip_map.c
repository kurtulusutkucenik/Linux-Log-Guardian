#include "ip_map.h"
#include "memory_pool.h"
#include "logger.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <emmintrin.h>

// FNV-1a hash fonksiyonu
static uint64_t fnv1a(const char *data, size_t len) {
    uint64_t h = 14695981039346656037ULL;
    for (size_t i=0;i<len;i++) { h ^= (uint8_t)data[i]; h *= 1099511628211ULL; }
    return h;
}

int ipmap_init(IpMap *m) {
    m->capacity = MAP_CAPACITY;
    size_t need = MAP_CAPACITY * sizeof(IpRecord);
    /*
     * IP tablosu tek parca ~80MB+ olabilir; --pool-mb kucukken slab
     * genislemesi cakisan mmap bolgeleri uretip cokertebilir.
     * Havuz kapasitesinden buyukse dogrudan calloc kullan.
     */
    if (need > g_pool.capacity) {
        m->slots = calloc(MAP_CAPACITY, sizeof(IpRecord));
    } else {
        m->slots = pool_alloc(&g_pool, need);
    }
    if (!m->slots) return -1;
    memset(m->slots, 0, MAP_CAPACITY * sizeof(IpRecord));
    atomic_store(&m->size, 0);
    return 0;
}

IpRecord *ipmap_get_or_create(IpMap *m, StrView ip_sv) {
    if (!ip_sv.len || ip_sv.len >= IP_STR_LEN) return NULL;

    uint64_t hash  = fnv1a(ip_sv.ptr, ip_sv.len);
    size_t   idx   = hash & (m->capacity - 1);
    size_t   probe = 0;
    const size_t MAX_PROBE_LEN = 200;

    while (probe < MAX_PROBE_LEN) {
        IpRecord *rec = &m->slots[idx];
        uint8_t expected_state = 0;

        // 1. Adım: Slot boşsa atomik olarak "YAZILIYOR" (1) durumuna çek
        if (atomic_compare_exchange_strong(&rec->state, &expected_state, 1)) {
            // Güvenli alan: Sadece bu thread bu slota yazabilir
            memcpy(rec->ip, ip_sv.ptr, ip_sv.len);
            rec->ip[ip_sv.len] = '\0';
            
            // Veri tamamen yazıldı, artık "HAZIR" (2) durumuna çek
            atomic_fetch_add(&m->size, 1);
            atomic_store_explicit(&rec->state, 2, memory_order_release);
            return rec;
        }

        // 2. Adım: Eğer slot zaten kullanımda veya yazım aşamasındaysa
        uint8_t current_state = atomic_load_explicit(&rec->state, memory_order_acquire);
        if (current_state == 1) {
            // Başka thread yazıyor! Tamamen READY (2) olana kadar donanım seviyesinde spin-wait yap
            while (atomic_load_explicit(&rec->state, memory_order_acquire) == 1) {
                _mm_pause(); 
            }
            current_state = atomic_load_explicit(&rec->state, memory_order_acquire);
        }

        if (current_state == 2) {
            if (strncmp(rec->ip, ip_sv.ptr, ip_sv.len) == 0 && !rec->ip[ip_sv.len]) {
                return rec;
            }
        }

        idx = (idx + 1) & (m->capacity - 1);
        probe++;
    }

    /* Blind Spot 5: Hash Collision DoS / Sonsuz Döngü Koruması. 
     * Eğer MAX_PROBE_LEN kadar denedik ve boş/eşleşen bulamadıysak,
     * probed aralığındaki en eski kaydı zorla tahliye et. */
    IpRecord *oldest = NULL;
    uint64_t min_lru = ~(0ULL);
    for (size_t i = 0; i < probe; i++) {
        size_t pidx = (hash + i) & (m->capacity - 1);
        IpRecord *r = &m->slots[pidx];
        if (atomic_load_explicit(&r->state, memory_order_acquire) == 2 && 
            atomic_load(&r->threat_stage) < 2) { // Sadece tehlikeli olmayanlari ez
            uint64_t seq = atomic_load(&r->cnt.lru_seq);
            if (seq < min_lru) { min_lru = seq; oldest = r; }
        }
    }

    if (oldest) {
        uint8_t exp = 2;
        if (atomic_compare_exchange_strong(&oldest->state, &exp, 1)) {
            /* ABA problemi icin versiyonu artir */
            atomic_fetch_add(&oldest->version, 1);
            
            memcpy(oldest->ip, ip_sv.ptr, ip_sv.len);
            oldest->ip[ip_sv.len] = '\0';
            
            atomic_store(&oldest->cnt.total_requests, 0);
            atomic_store(&oldest->cnt.error_4xx, 0);
            atomic_store(&oldest->cnt.error_5xx, 0);
            atomic_store(&oldest->cnt.sqli_hits, 0);
            atomic_store(&oldest->cnt.resp_slow, 0);
            atomic_store(&oldest->cnt.lru_seq, 0);
            for(int k=0; k<MAX_ENDPOINT_LIMITS; k++) atomic_store(&oldest->cnt.endpoint_hits[k], 0);

            oldest->first_seen = 0;
            oldest->last_seen = 0;
            atomic_store(&oldest->threat_stage, 0);
            atomic_store(&oldest->window.head, 0);
            atomic_store(&oldest->window.count, 0);
            
            atomic_store_explicit(&oldest->state, 2, memory_order_release);
            return oldest;
        }
    }

    /* Kapasite tamamen doldu ve evict edilecek güvenli IP bulunamadı */
    atomic_store(&g_janitor_evict_needed, 1);
    log_rl(LOG_WARNING, "[IPMAP] Kapasite doldu! Gecici veri kaybi yasanabilir.");
    return NULL;
}

void ipmap_update(IpRecord *rec, const LogEntry *e) {
    atomic_fetch_add(&rec->cnt.total_requests, 1);
    atomic_fetch_add(&rec->cnt.lru_seq, 1);

    if      (e->status>=400 && e->status<500) atomic_fetch_add(&rec->cnt.error_4xx, 1);
    else if (e->status>=500)                   atomic_fetch_add(&rec->cnt.error_5xx, 1);

    if (!rec->first_seen) rec->first_seen = e->ts;
    rec->last_seen = e->ts;
    window_push(&rec->window, e->ts);
}

size_t ipmap_size(const IpMap *m) { return atomic_load(&m->size); }

void window_push(SlidingWindow *w, time_t ts) {
    uint32_t current_head = atomic_fetch_add(&w->head, 1);
    uint32_t slot = current_head % WINDOW_SLOTS;
    w->times[slot] = ts;
    
    if (atomic_load(&w->count) < WINDOW_SLOTS) {
        atomic_fetch_add(&w->count, 1);
    }
}

uint32_t window_count_since(SlidingWindow *w, time_t since) {
    uint32_t cnt=0;
    uint32_t total=w->count<WINDOW_SLOTS?w->count:WINDOW_SLOTS;
    for (uint32_t i=0;i<total;i++)
        if(w->times[i]>=since) cnt++;
    return cnt;
}

uint32_t ipmap_window_count_since(IpRecord *rec, time_t since) {
    if (!rec) return 0;
    return window_count_since(&rec->window, since);
}

/*
 * ipmap_evict_lru — LRU tabanli temizlik.
 * threat_stage < 2 olan (CLEAN / LOW_RISK) en eski kayitlari siler.
 * threat_stage >= 2 (SUSPECT, HIGH, PERSISTENT) kayitlara dokunmaz.
 *
 * Algoritma:
 *   1. Tum slotlari tara, evict edilebilir adaylari topla.
 *   2. lru_seq'e gore sirala (en kucuk = en eski).
 *   3. evict_count kadar kaydi atomik olarak state=0 yap.
 */
typedef struct {
    IpRecord *rec;
    uint64_t  lru_seq;
} EvictCandidate;

static int cmp_evict_candidate(const void *a, const void *b) {
    const EvictCandidate *ca = (const EvictCandidate *)a;
    const EvictCandidate *cb = (const EvictCandidate *)b;
    if (ca->lru_seq < cb->lru_seq) return -1;
    if (ca->lru_seq > cb->lru_seq) return  1;
    return 0;
}

size_t ipmap_evict_lru(IpMap *m, size_t evict_count) {
    if (!m || !m->slots || evict_count == 0) return 0;

    /* Adaylari dinamik diziye topla */
    size_t cap  = atomic_load(&m->size);
    if (cap == 0) return 0;
    /* En fazla tum haritayi tara */
    cap = m->capacity;

    EvictCandidate *cands = malloc(cap * sizeof(EvictCandidate));
    if (!cands) return 0;

    size_t n = 0;
    time_t now = time(NULL);

    for (size_t i = 0; i < m->capacity; i++) {
        IpRecord *rec = &m->slots[i];
        uint8_t st = atomic_load_explicit(&rec->state, memory_order_acquire);
        if (st != 2) continue;  /* Bos veya yaziliyor */

        /* KORUMA: threat_stage >= 2 (SUSPECT, HIGH, PERSISTENT) → asla evict etme */
        uint8_t stage = atomic_load(&rec->threat_stage);
        if (stage >= 2) continue;

        /* KORUMA: banli kayitlar → asla evict etme */
        if (atomic_load(&rec->banned)) continue;

        /* KORUMA: son 5 dakikada aktif olanlar → koru */
        if (now - rec->last_seen < 300) continue;

        cands[n].rec     = rec;
        cands[n].lru_seq = atomic_load(&rec->cnt.lru_seq);
        n++;
    }

    if (n == 0) {
        free(cands);
        return 0;
    }

    /* En eski (lru_seq en kucuk) once */
    qsort(cands, n, sizeof(EvictCandidate), cmp_evict_candidate);

    size_t target  = n < evict_count ? n : evict_count;
    size_t evicted = 0;

    for (size_t i = 0; i < target; i++) {
        IpRecord *rec = cands[i].rec;

        /* CAS: state=2 → state=1 (yaziliyor). Basarili olursa bu thread sahip oldu. */
        uint8_t expected = 2;
        if (!atomic_compare_exchange_strong_explicit(
                &rec->state, &expected, 1,
                memory_order_acquire, memory_order_relaxed)) {
            continue;  /* Baska thread zaten kullaniyordu */
        }

        /* Tehdit seviyesi degistiyse vazgec */
        if (atomic_load(&rec->threat_stage) >= 2 ||
            atomic_load(&rec->banned)) {
            atomic_store_explicit(&rec->state, 2, memory_order_release);
            continue;
        }

        /* ABA problemi için versiyonu artır */
        atomic_fetch_add(&rec->version, 1);

        /* Tamamen sifirla */
        memset(rec->ip, 0, IP_STR_LEN);
        atomic_store(&rec->cnt.total_requests, 0);
        atomic_store(&rec->cnt.error_4xx,      0);
        atomic_store(&rec->cnt.error_5xx,      0);
        atomic_store(&rec->cnt.sqli_hits,      0);
        atomic_store(&rec->cnt.resp_slow,      0);
        atomic_store(&rec->cnt.lru_seq,        0);
        for(int k=0; k<MAX_ENDPOINT_LIMITS; k++) atomic_store(&rec->cnt.endpoint_hits[k], 0);
        
        atomic_store(&rec->banned,             0);
        atomic_store(&rec->ban_until_ts,       0);
        atomic_store(&rec->last_alert_ts,      0);
        atomic_store(&rec->threat_stage,       0);
        rec->first_seen = 0;
        rec->last_seen  = 0;
        memset(&rec->window, 0, sizeof(rec->window));

        /* Slotu bos isaretle */
        atomic_store_explicit(&rec->state, 0, memory_order_release);
        atomic_fetch_sub(&m->size, 1);
        evicted++;
    }

    free(cands);
    return evicted;
}

size_t ipmap_expire_bans(IpMap *m, time_t now,
                         int (*cb)(const char *ip, void *ctx), void *ctx)
{
    if (!m || !m->slots || !cb) return 0;
    size_t n = 0;
    for (size_t i = 0; i < m->capacity; i++) {
        IpRecord *rec = &m->slots[i];
        if (atomic_load_explicit(&rec->state, memory_order_acquire) != 2)
            continue;
        if (!atomic_load(&rec->banned)) continue;
        time_t until = atomic_load(&rec->ban_until_ts);
        if (until <= 0 || now < until) continue;
        if (cb(rec->ip, ctx) == 0) {
            atomic_store(&rec->banned, 0);
            atomic_store(&rec->ban_until_ts, 0);
            n++;
        }
    }
    return n;
}