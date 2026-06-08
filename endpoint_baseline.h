/* endpoint_baseline.h — Path bazli 7 gun EMA baseline (Faz 3.3) */
#ifndef ENDPOINT_BASELINE_H
#define ENDPOINT_BASELINE_H

#include <stdint.h>
#include <time.h>

void endpoint_baseline_init(void);
void endpoint_baseline_set_enabled(int on);
void endpoint_baseline_set_window_days(int days);

/* Her istekte path + anlik RPM; ADAPTIVE_BAN benzeri karar */
int endpoint_baseline_check(const char *path, uint32_t rpm_now,
                          char *reason_out, size_t reason_sz);

void endpoint_baseline_persist(void);

#endif /* ENDPOINT_BASELINE_H */
