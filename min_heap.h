#ifndef MIN_HEAP_H
#define MIN_HEAP_H

#include "ip_map.h"
#include <stddef.h>
#include <pthread.h>

// Top-K saldirgan icin Min-Heap
// En kucuk eleman kokte — k'inci buyuk hep bilinir
#define HEAP_K 10

typedef struct {
    IpRecord       *entries[HEAP_K];
    size_t          size;
    pthread_mutex_t lock;
} MinHeap;

void      heap_init(MinHeap *h);
void      heap_try_insert(MinHeap *h, IpRecord *rec);
IpRecord *heap_peek_min(MinHeap *h);
void      heap_sort_desc(MinHeap *h, IpRecord *out[HEAP_K]);

#endif /* MIN_HEAP_H */