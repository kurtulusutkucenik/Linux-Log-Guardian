#define _GNU_SOURCE
#include "rules_bundle_verify.h"
#include "crypto_utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static int sha256_file_hex(const char *path, char out_hex[65])
{
    FILE *f = fopen(path, "rb");
    if (!f)
        return -1;
    Sha256Ctx ctx;
    sha256_init(&ctx);
    uint8_t buf[8192];
    size_t n;
    while ((n = fread(buf, 1, sizeof(buf), f)) > 0)
        sha256_update(&ctx, buf, n);
    fclose(f);
    uint8_t hash[32];
    sha256_final(&ctx, hash);
    static const char hx[] = "0123456789abcdef";
    for (int i = 0; i < 32; i++) {
        out_hex[i * 2]     = hx[(hash[i] >> 4) & 0xf];
        out_hex[i * 2 + 1] = hx[hash[i] & 0xf];
    }
    out_hex[64] = '\0';
    return 0;
}

static const char *basename_only(const char *path)
{
    if (!path)
        return "";
    const char *s = strrchr(path, '/');
    return s ? s + 1 : path;
}

static int extract_sha_for_key(const char *json, const char *key, char *out, size_t cap)
{
    if (!json || !key || !out || cap < 65)
        return -1;
    char needle[512];
    snprintf(needle, sizeof(needle), "\"%s\"", key);
    const char *p = strstr(json, needle);
    if (!p) {
        snprintf(needle, sizeof(needle), "\"%s\"", basename_only(key));
        p = strstr(json, needle);
    }
    if (!p) {
        snprintf(needle, sizeof(needle), "\"rules/%s\"", basename_only(key));
        p = strstr(json, needle);
    }
    if (!p)
        return -1;
    p = strchr(p, ':');
    if (!p)
        return -1;
    p++;
    while (*p && isspace((unsigned char)*p))
        p++;
    if (*p != '"')
        return -1;
    p++;
    size_t i = 0;
    while (p[i] && p[i] != '"' && i + 1 < cap) {
        if (!isxdigit((unsigned char)p[i]))
            return -1;
        out[i] = (char)tolower((unsigned char)p[i]);
        i++;
    }
    out[i] = '\0';
    return (i == 64) ? 0 : -1;
}

int rules_bundle_verify_file(const char *rules_path, const char *manifest_path)
{
    if (!rules_path || !rules_path[0])
        return 0;
    if (!manifest_path || !manifest_path[0])
        return 0;

    FILE *mf = fopen(manifest_path, "rb");
    if (!mf)
        return 0; /* manifest opsiyonel */
    fseek(mf, 0, SEEK_END);
    long sz = ftell(mf);
    if (sz <= 0 || sz > 65536) {
        fclose(mf);
        return -1;
    }
    fseek(mf, 0, SEEK_SET);
    char *json = malloc((size_t)sz + 1);
    if (!json) {
        fclose(mf);
        return -1;
    }
    if (fread(json, 1, (size_t)sz, mf) != (size_t)sz) {
        free(json);
        fclose(mf);
        return -1;
    }
    json[sz] = '\0';
    fclose(mf);

    char expect[65];
    if (extract_sha_for_key(json, rules_path, expect, sizeof(expect)) != 0 &&
        extract_sha_for_key(json, basename_only(rules_path), expect, sizeof(expect)) != 0) {
        free(json);
        return -1;
    }
    free(json);

    char actual[65];
    if (sha256_file_hex(rules_path, actual) != 0)
        return -1;

    if (!secure_equals(expect, actual)) {
        fprintf(stderr,
                "[rules_verify] FAIL: %s hash uyumsuz (manifest != disk)\n",
                rules_path);
        return -1;
    }
    return 0;
}
