#include "min_heap.h"
#include <stddef.h>
#include <string.h>

// Tehdit skoru: SQLi agirlikli
static long threat_score(const IpRecord *r) {
    if (!r) return 0;
    return atomic_load(&r->cnt.total_requests)
         + atomic_load(&r->cnt.sqli_hits)  * 50L
         + atomic_load(&r->cnt.error_4xx)  * 3L
         + atomic_load(&r->cnt.error_5xx)  * 5L;
}

static void sift_up(MinHeap *h, size_t i) {
    while (i>0) {
        size_t parent=(i-1)/2;
        if (threat_score(h->entries[parent])>threat_score(h->entries[i])) {
            IpRecord *tmp=h->entries[parent];
            h->entries[parent]=h->entries[i];
            h->entries[i]=tmp;
            i=parent;
        } else break;
    }
}

static void sift_down(MinHeap *h, size_t i) {
    while (1) {
        size_t s=i, l=2*i+1, r=2*i+2;
        if (l<h->size && threat_score(h->entries[l])<threat_score(h->entries[s])) s=l;
        if (r<h->size && threat_score(h->entries[r])<threat_score(h->entries[s])) s=r;
        if (s==i) break;
        IpRecord *tmp=h->entries[s]; h->entries[s]=h->entries[i]; h->entries[i]=tmp;
        i=s;
    }
}

void heap_init(MinHeap *h) {
    h->size=0;
    memset(h->entries, 0, sizeof(h->entries));
    pthread_mutex_init(&h->lock, NULL);
}

void heap_try_insert(MinHeap *h, IpRecord *rec) {
    if (!rec) return;
    long score=threat_score(rec);

    pthread_mutex_lock(&h->lock);

    // Zaten heapte mi?
    for (size_t k=0;k<h->size;k++) {
        if (h->entries[k]==rec) {
            sift_up(h,k); sift_down(h,k);
            pthread_mutex_unlock(&h->lock);
            return;
        }
    }

    if (h->size<HEAP_K) {
        h->entries[h->size]=rec;
        sift_up(h,h->size);
        h->size++;
    } else if (score>threat_score(h->entries[0])) {
        h->entries[0]=rec;
        sift_down(h,0);
    }
    pthread_mutex_unlock(&h->lock);
}

IpRecord *heap_peek_min(MinHeap *h) {
    pthread_mutex_lock(&h->lock);
    IpRecord *res=(h->size==0)?NULL:h->entries[0];
    pthread_mutex_unlock(&h->lock);
    return res;
}

void heap_sort_desc(MinHeap *h, IpRecord *out[HEAP_K]) {
    for (int k=0;k<HEAP_K;k++) out[k]=NULL;
    pthread_mutex_lock(&h->lock);
    MinHeap tmp=*h;
    pthread_mutex_unlock(&h->lock);

    int i=(int)tmp.size-1;
    while (i>=0 && tmp.size>0) {
        out[i]=tmp.entries[0];
        tmp.size--;
        if (tmp.size>0) { tmp.entries[0]=tmp.entries[tmp.size]; sift_down(&tmp,0); }
        i--;
    }
}