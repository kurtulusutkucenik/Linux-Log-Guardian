#ifndef SIEM_FORWARDER_H
#define SIEM_FORWARDER_H

#include "anomaly.h"

typedef struct {
    int enabled;
    char host[128];
    int port;
} SiemForwarderConfig;

extern SiemForwarderConfig g_siem_config;

/* SIEM Forwarder'ı başlatır */
void siem_forwarder_init(void);

/* Yeni bir alert'i asenkron kuyruğa atar */
void siem_forwarder_publish(const Alert *alert, const char *sensor_type);

/* Kernel ban olayini SIEM akisina ekle (JSON event_type=ban) */
void siem_forwarder_publish_ban(const char *ip, time_t ts, const char *reason,
                                double risk_score, const char *policy);

/* SIEM Forwarder'ı durdurur */
void siem_forwarder_stop(void);

#endif /* SIEM_FORWARDER_H */
