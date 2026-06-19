#ifndef GEOIP_LOOKUP_H
#define GEOIP_LOOKUP_H

#include <stddef.h>

void geoip_lookup_set_enabled(int on);
int  geoip_lookup_enabled(void);

/* cc_out: 2 harf ISO, veya LAN/TEST; basari=1 */
int geoip_lookup_country(const char *ip, char *cc_out, size_t cc_cap);

/* Ornek: "🇺🇸 US", "🏠 LAN" */
void geoip_lookup_label(const char *ip, char *out, size_t cap);

/* plain/html mesaj sonuna "\nUlke: …" satiri ekler (geoip kapaliysa no-op) */
void geoip_lookup_append_lines(const char *ip, char *plain, size_t plain_sz,
                               char *html, size_t html_sz);

#endif /* GEOIP_LOOKUP_H */
