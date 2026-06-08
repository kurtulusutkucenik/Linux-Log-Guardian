#ifndef MEMORY_POOL_H
#define MEMORY_POOL_H

#include <stddef.h>
#include <stdint.h>
#include <unistd.h>
#include <pthread.h>
#include <stdatomic.h>

/* Primary pool: 512 MB */
#define POOL_SIZE             (512UL * 1024 * 1024)

/* Her yedek slab boyutu (primary ile ayni) */
#define POOL_SLAB_SIZE        POOL_SIZE

/* Maksimum zincirlenebilir slab sayisi */
#define POOL_MAX_SLABS        4

/* Janitor: bu oran asildiktan sonra LRU eviction tetiklenir */
#define POOL_GC_THRESHOLD     0.85

/* Janitor eviction flag: pool_alloc() veya pool_gc_thread() tarafindan set edilir */
extern _Atomic int g_janitor_evict_needed;

/* Free-List dugumu: evict edilen bloklar icin */
typedef struct FreeNode {
    struct FreeNode *next;
} FreeNode;

/*
 * MemoryPool — Lock-free TLAB tabanli bellek yoneticisi.
 */
typedef struct MemoryPool {
    uint8_t          *base;
    size_t            capacity;
    size_t            total_map;
    _Atomic size_t    offset;        /* Lock-free allocation */
    _Atomic(FreeNode*) free_list;    /* Lock-free stack */
    _Atomic size_t    free_count;
    
    struct MemoryPool *overflow;
    size_t            slab_size;
    size_t            slab_count;
    size_t            max_slabs;
    pthread_mutex_t   expansion_lock; /* Sadece yeni slab acarken kullanilir */
} MemoryPool;

int    pool_init(MemoryPool *p, size_t size);
void  *pool_alloc(MemoryPool *p, size_t bytes);
void   pool_free(MemoryPool *p, void *ptr);
void   pool_destroy(MemoryPool *p);

/* Toplam doluluk orani [0.0, 1.0] */
double pool_usage_ratio(const MemoryPool *p);

/* Global havuz */
extern MemoryPool g_pool;

#endif /* MEMORY_POOL_H */