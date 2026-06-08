#ifndef GEOIP_FEED_H
#define GEOIP_FEED_H

void geoip_feed_set_interval_hours(int hours);
void geoip_feed_set_rules_path(const char *path);
void geoip_feed_init(void);
void geoip_feed_stop(void);

#endif
