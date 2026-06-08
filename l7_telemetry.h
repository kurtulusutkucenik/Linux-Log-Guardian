#ifndef L7_TELEMETRY_H
#define L7_TELEMETRY_H

#include <stdint.h>

void l7_telemetry_init(void);
void l7_telemetry_record(const char *method, int blocked);
void l7_telemetry_ebpf_hit(const char *method);
void l7_telemetry_get_stats(uint64_t *inspected, uint64_t *blocked,
                            uint64_t *ebpf_hits,
                            uint64_t *get_cnt, uint64_t *post_cnt);

#endif
