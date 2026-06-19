#define _GNU_SOURCE
#include "geoip_lookup.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <ctype.h>
#include <time.h>
#include <stdint.h>
#include <pthread.h>
#include <arpa/inet.h>
#include <curl/curl.h>

#define GEO_CACHE_MAX 128
#define GEO_CACHE_TTL 86400

typedef struct {
    char ip[46];
    char cc[4];
    time_t until;
} GeoCacheEntry;

static int              g_enabled = 0;
static GeoCacheEntry    g_cache[GEO_CACHE_MAX];
static pthread_mutex_t  g_cache_mu = PTHREAD_MUTEX_INITIALIZER;

void geoip_lookup_set_enabled(int on)
{
    g_enabled = on ? 1 : 0;
}

int geoip_lookup_enabled(void)
{
    return g_enabled;
}

static void cache_put(const char *ip, const char *cc)
{
    if (!ip || !cc || !cc[0])
        return;
    time_t now = time(NULL);
    pthread_mutex_lock(&g_cache_mu);
    int slot = -1;
    time_t oldest = now;
    for (int i = 0; i < GEO_CACHE_MAX; i++) {
        if (g_cache[i].ip[0] && strcmp(g_cache[i].ip, ip) == 0) {
            slot = i;
            break;
        }
        if (!g_cache[i].ip[0]) {
            slot = i;
            break;
        }
        if (g_cache[i].until < oldest) {
            oldest = g_cache[i].until;
            slot = i;
        }
    }
    if (slot >= 0) {
        strncpy(g_cache[slot].ip, ip, sizeof(g_cache[slot].ip) - 1);
        g_cache[slot].ip[sizeof(g_cache[slot].ip) - 1] = '\0';
        strncpy(g_cache[slot].cc, cc, sizeof(g_cache[slot].cc) - 1);
        g_cache[slot].cc[sizeof(g_cache[slot].cc) - 1] = '\0';
        g_cache[slot].until = now + GEO_CACHE_TTL;
    }
    pthread_mutex_unlock(&g_cache_mu);
}

static int is_documentation_net(uint32_t addr)
{
    uint8_t b0 = (addr >> 24) & 0xff;
    uint8_t b1 = (addr >> 16) & 0xff;

    /* RFC 5737 — gercek ulke yok; yanlis bayrak gosterme */
    if (b0 == 203 && b1 == 0 && ((addr >> 8) & 0xff) == 113)
        return 1;
    if (b0 == 198 && b1 == 51 && ((addr >> 8) & 0xff) == 100)
        return 1;
    if (b0 == 192 && b1 == 0 && ((addr >> 8) & 0xff) == 2)
        return 1;
    return 0;
}

static int ipv4_documentation_net(const char *ip)
{
    struct in_addr v4;
    if (!ip || inet_pton(AF_INET, ip, &v4) != 1)
        return 0;
    return is_documentation_net(ntohl(v4.s_addr));
}

static int cache_get(const char *ip, char *cc_out, size_t cc_cap)
{
    if (!ip || !cc_out || cc_cap < 2)
        return 0;
    if (ipv4_documentation_net(ip))
        return 0;
    time_t now = time(NULL);
    int found = 0;
    pthread_mutex_lock(&g_cache_mu);
    for (int i = 0; i < GEO_CACHE_MAX; i++) {
        if (g_cache[i].ip[0] && strcmp(g_cache[i].ip, ip) == 0 &&
            g_cache[i].until >= now) {
            strncpy(cc_out, g_cache[i].cc, cc_cap - 1);
            cc_out[cc_cap - 1] = '\0';
            found = 1;
            break;
        }
    }
    pthread_mutex_unlock(&g_cache_mu);
    return found;
}

static int is_private_or_special(uint32_t addr, char *cc_out, size_t cc_cap)
{
    uint8_t b0 = (addr >> 24) & 0xff;
    uint8_t b1 = (addr >> 16) & 0xff;

    if (b0 == 10)
        goto lan;
    if (b0 == 172 && b1 >= 16 && b1 <= 31)
        goto lan;
    if (b0 == 192 && b1 == 168)
        goto lan;
    if (b0 == 127)
        goto lan;

    return 0;

lan:
    snprintf(cc_out, cc_cap, "LAN");
    return 1;
}

static size_t curl_write_cb(void *ptr, size_t size, size_t nmemb, void *ud)
{
    size_t total = size * nmemb;
    char **buf = ud;
    size_t cur = *buf ? strlen(*buf) : 0;
    char *n = realloc(*buf, cur + total + 1);
    if (!n)
        return 0;
    memcpy(n + cur, ptr, total);
    n[cur + total] = '\0';
    *buf = n;
    return total;
}

static int http_lookup_country(const char *ip, char *cc_out, size_t cc_cap)
{
    const char *tpl = getenv("GEOIP_LOOKUP_URL");
    if (!tpl || !tpl[0])
        tpl = "http://ip-api.com/json/%s?fields=countryCode";

    char url[384];
    snprintf(url, sizeof(url), tpl, ip);

    CURL *curl = curl_easy_init();
    if (!curl)
        return 0;

    char *resp = NULL;
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 2L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 1L);
    curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1L);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "Log-Guardian/1.0");

    CURLcode rc = curl_easy_perform(curl);
    long code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &code);
    curl_easy_cleanup(curl);

    if (rc != CURLE_OK || code < 200 || code >= 300 || !resp) {
        free(resp);
        return 0;
    }

    const char *p = strstr(resp, "\"countryCode\":\"");
    if (!p) {
        free(resp);
        return 0;
    }
    p += 15;
    size_t n = 0;
    while (p[n] && p[n] != '"' && n + 1 < cc_cap) {
        cc_out[n] = (char)toupper((unsigned char)p[n]);
        n++;
    }
    cc_out[n] = '\0';
    free(resp);
    return (n == 2) ? 1 : 0;
}

int geoip_lookup_country(const char *ip, char *cc_out, size_t cc_cap)
{
    if (!g_enabled || !ip || !ip[0] || !cc_out || cc_cap < 2)
        return 0;
    cc_out[0] = '\0';

    struct in_addr v4;
    if (inet_pton(AF_INET, ip, &v4) == 1) {
        uint32_t addr = ntohl(v4.s_addr);
        if (is_private_or_special(addr, cc_out, cc_cap))
            return 1;
        if (is_documentation_net(addr))
            return 0;
    }

    if (cache_get(ip, cc_out, cc_cap))
        return 1;

    if (http_lookup_country(ip, cc_out, cc_cap)) {
        cache_put(ip, cc_out);
        return 1;
    }
    return 0;
}

static void flag_emoji(const char *cc, char *out, size_t cap)
{
    if (!out || cap < 8)
        return;
    out[0] = '\0';

    if (!cc || !cc[0]) {
        snprintf(out, cap, "🌐");
        return;
    }
    if (strcmp(cc, "LAN") == 0) {
        snprintf(out, cap, "🏠");
        return;
    }
    if (strlen(cc) != 2)
        return;

    char u0 = (char)toupper((unsigned char)cc[0]);
    char u1 = (char)toupper((unsigned char)cc[1]);
    if (u0 < 'A' || u0 > 'Z' || u1 < 'A' || u1 > 'Z')
        return;

    size_t pos = 0;
    uint32_t cp0 = 0x1F1E6u + (unsigned)(u0 - 'A');
    uint32_t cp1 = 0x1F1E6u + (unsigned)(u1 - 'A');
    if (pos + 4 < cap) {
        out[pos++] = (char)(0xF0 | ((cp0 >> 18) & 0x07));
        out[pos++] = (char)(0x80 | ((cp0 >> 12) & 0x3F));
        out[pos++] = (char)(0x80 | ((cp0 >> 6) & 0x3F));
        out[pos++] = (char)(0x80 | (cp0 & 0x3F));
    }
    if (pos + 4 < cap) {
        out[pos++] = (char)(0xF0 | ((cp1 >> 18) & 0x07));
        out[pos++] = (char)(0x80 | ((cp1 >> 12) & 0x3F));
        out[pos++] = (char)(0x80 | ((cp1 >> 6) & 0x3F));
        out[pos++] = (char)(0x80 | (cp1 & 0x3F));
    }
    out[pos] = '\0';
}

void geoip_lookup_label(const char *ip, char *out, size_t cap)
{
    if (!out || cap < 8) {
        return;
    }
    out[0] = '\0';
    if (!g_enabled || !ip || !ip[0])
        return;

    char cc[8];
    if (!geoip_lookup_country(ip, cc, sizeof(cc)))
        return;

    char flag[16];
    flag_emoji(cc, flag, sizeof(flag));
    snprintf(out, cap, "%s %s", flag, cc);
}

void geoip_lookup_append_lines(const char *ip, char *plain, size_t plain_sz,
                               char *html, size_t html_sz)
{
    if (!g_enabled || !ip || !ip[0])
        return;

    char cc[8];
    if (!geoip_lookup_country(ip, cc, sizeof(cc)))
        return;

    char flag[16];
    flag_emoji(cc, flag, sizeof(flag));

    if (plain && plain_sz > 1) {
        size_t used = strlen(plain);
        if (used + 32 < plain_sz)
            snprintf(plain + used, plain_sz - used, "\nUlke: %s %s", flag, cc);
    }
    if (html && html_sz > 1) {
        size_t used = strlen(html);
        if (used + 48 < html_sz)
            snprintf(html + used, html_sz - used,
                     "\nUlke: %s <code>%s</code>", flag, cc);
    }
}
