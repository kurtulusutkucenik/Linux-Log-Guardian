/* dist_risk_test.c — /24 + UA fingerprint bonus kaniti */
#include "dist_risk.h"
#include <stdio.h>
#include <stdint.h>

int main(void)
{
    dist_risk_init();
    dist_risk_config(1);
    dist_risk_set_min_ips(3);

    static const char *ips[] = {
        "198.51.100.10", "198.51.100.11", "198.51.100.12",
        "198.51.100.13", "198.51.100.14",
    };
    const char *fp = "deadbeefdeadbeefdeadbeefdeadbeef";
    time_t ts = 1700000000;

    for (size_t i = 0; i < sizeof(ips) / sizeof(ips[0]); i++)
        dist_risk_observe(ips[i], fp, ts + (time_t)i);

    double bonus = dist_risk_bonus(ips[4]);
    if (bonus < 14.0) {
        fprintf(stderr, "[dist_risk_test] FAIL bonus=%.1f (beklenen >=14)\n", bonus);
        return 1;
    }

    uint64_t buckets = 0, bonus_n = 0, obs = 0;
    dist_risk_get_stats(&buckets, &bonus_n, &obs);
    if (obs < 5) {
        fprintf(stderr, "[dist_risk_test] FAIL observe=%lu\n", (unsigned long)obs);
        return 1;
    }
    if (buckets < 2) {
        fprintf(stderr, "[dist_risk_test] FAIL buckets=%lu\n", (unsigned long)buckets);
        return 1;
    }

    (void)dist_risk_bonus(ips[0]);
    dist_risk_get_stats(NULL, &bonus_n, NULL);
    if (bonus_n < 2) {
        fprintf(stderr, "[dist_risk_test] FAIL bonus_applied=%lu\n", (unsigned long)bonus_n);
        return 1;
    }

    printf("[OK] dist_risk_test bonus=%.1f buckets=%lu observe=%lu\n",
           bonus, (unsigned long)buckets, (unsigned long)obs);
    return 0;
}
