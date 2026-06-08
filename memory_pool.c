#define _GNU_SOURCE
#include "memory_pool.h"
#include "logger.h"
#include <sys/mman.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>

MemoryPool g_pool;

/* Janitor thread bu flag'i gorur ve LRU eviction baslatir */
_Atomic int g_janitor_evict_needed = 0;

static MemoryPool *slab_mmap_new(size_t size) {
    size_t page  = (size_t)sysconf(_SC_PAGESIZE);
    size_t total = size + page;

    MemoryPool *s = calloc(1, sizeof(MemoryPool));
    if (!s) return NULL;

    s->base = mmap(NULL, total, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (s->base == MAP_FAILED) {
        free(s);
        return NULL;
    }

    if (mprotect(s->base + size, page, PROT_NONE) != 0) {
        munmap(s->base, total);
        free(s);
        return NULL;
    }

    s->capacity  = size;
    s->total_map = total;
    atomic_init(&s->offset, 0);
    s->overflow  = NULL;
    return s;
}

int pool_init(MemoryPool *p, size_t size) {
    size_t page  = (size_t)sysconf(_SC_PAGESIZE);
    size_t total = size + page;

    p->base = mmap(NULL, total, PROT_READ | PROT_WRITE,
                   MAP_PRIVATE | MAP_ANONYMOUS, -1, 0);
    if (p->base == MAP_FAILED) {
        log_rl(LOG_ERR, "[POOL] mmap basarisiz: %s", strerror(errno));
        return -1;
    }

    if (mprotect(p->base + size, page, PROT_NONE) != 0) {
        log_rl(LOG_ERR, "[POOL] mprotect guard page basarisiz: %s", strerror(errno));
        munmap(p->base, total);
        return -1;
    }

    p->capacity   = size;
    p->total_map  = total;
    atomic_init(&p->offset, 0);
    atomic_init(&p->free_list, NULL);
    atomic_init(&p->free_count, 0);
    p->overflow   = NULL;
    p->slab_size  = size;
    p->slab_count = 1;
    p->max_slabs  = POOL_MAX_SLABS;
    pthread_mutex_init(&p->expansion_lock, NULL);
    return 0;
}

void *pool_alloc(MemoryPool *p, size_t bytes) {
    size_t aligned = (bytes + 63u) & ~63u;

    /* 1) Lock-free pop from free_list (CAS loop) */
    FreeNode *old_head, *new_head;
    do {
        old_head = atomic_load(&p->free_list);
        if (!old_head) break;
        new_head = old_head->next;
    } while (!atomic_compare_exchange_weak(&p->free_list, &old_head, new_head));

    if (old_head) {
        atomic_fetch_sub(&p->free_count, 1);
        memset(old_head, 0, aligned);
        return old_head;
    }

    /* 2) Lock-free linear allocation via atomic_fetch_add */
    MemoryPool *slab = p;

    while (slab) {
        size_t my_off = atomic_fetch_add(&slab->offset, aligned);
        if (my_off + aligned <= slab->capacity) {
            return slab->base + my_off;
        }
        slab = slab->overflow;
    }

    /* 3) Fallback: Expand with new slab (requires expansion_lock) */
    pthread_mutex_lock(&p->expansion_lock);
    
    // Double check if another thread created overflow while we waited
    slab = p;
    while (slab->overflow) {
        slab = slab->overflow;
    }
    
    // Try one more time on the last slab
    size_t my_off = atomic_fetch_add(&slab->offset, aligned);
    if (my_off + aligned <= slab->capacity) {
        pthread_mutex_unlock(&p->expansion_lock);
        return slab->base + my_off;
    }
    
    if (p->slab_count < p->max_slabs) {
        MemoryPool *ns = slab_mmap_new(p->slab_size);
        if (ns) {
            slab->overflow = ns;
            p->slab_count++;
            size_t new_off = atomic_fetch_add(&ns->offset, aligned);
            /* Yeni slab acildi: doluluk esigini kontrol et */
            double cur_usage = pool_usage_ratio(p);
            if (cur_usage > POOL_GC_THRESHOLD) {
                atomic_store(&g_janitor_evict_needed, 1);
            }
            pthread_mutex_unlock(&p->expansion_lock);
            return ns->base + new_off;
        }
    }

    /* Maksimum slab sayisina ulasild: Janitor'i acil tetikle */
    atomic_store(&g_janitor_evict_needed, 1);
    log_rl(LOG_WARNING, "[POOL] Havuz tamamen doldu! Janitor tetiklendi.");
    pthread_mutex_unlock(&p->expansion_lock);
    return NULL;
}

void pool_free(MemoryPool *p, void *ptr) {
    if (!ptr) return;

    /* Verify ptr is within pool bounds (for all slabs) */
    MemoryPool *slab = p;
    int valid = 0;
    while (slab) {
        uint8_t *up = (uint8_t *)ptr;
        if (up >= slab->base && up < slab->base + slab->capacity) {
            valid = 1;
            break;
        }
        slab = slab->overflow;
    }

    if (!valid) return;

    /* Lock-free push to free_list (CAS loop) */
    FreeNode *node = (FreeNode *)ptr;
    FreeNode *old_head;
    do {
        old_head = atomic_load(&p->free_list);
        node->next = old_head;
    } while (!atomic_compare_exchange_weak(&p->free_list, &old_head, node));

    atomic_fetch_add(&p->free_count, 1);
}

double pool_usage_ratio(const MemoryPool *p) {
    if (!p) return 1.0;
    size_t total_cap  = 0;
    size_t total_used = 0;
    const MemoryPool *slab = p;
    while (slab && slab->base && slab->base != MAP_FAILED) {
        total_cap  += slab->capacity;
        size_t off = atomic_load(&slab->offset);
        if (off > slab->capacity) off = slab->capacity;
        total_used += off;
        slab = slab->overflow;
    }
    /* free_list'e dusen bloklari used'dan cikar */
    size_t f_count = atomic_load(&p->free_count);
    size_t freed_bytes = f_count * 256; /* Approximated for IpRecord size */
    if (total_used > freed_bytes) total_used -= freed_bytes;

    return total_cap > 0 ? (double)total_used / (double)total_cap : 1.0;
}

void pool_destroy(MemoryPool *p) {
    if (!p) return;

    MemoryPool *slab = p->overflow;
    while (slab) {
        MemoryPool *next = slab->overflow;
        if (slab->base && slab->base != MAP_FAILED)
            munmap(slab->base, slab->total_map);
        free(slab);
        slab = next;
    }

    if (p->base && p->base != MAP_FAILED)
        munmap(p->base, p->total_map);

    pthread_mutex_destroy(&p->expansion_lock);
    p->base     = NULL;
    p->overflow = NULL;
}
