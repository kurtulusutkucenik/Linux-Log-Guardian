/* crypto_utils.h — SHA-256, HMAC-SHA256, PBKDF2, secure helpers
 * Extracted from main.c to reduce god-node coupling.
 * All functions are self-contained; no external deps beyond stdint/stddef.
 */
#pragma once
#include <stdint.h>
#include <stddef.h>

/* ── Secure helpers ─────────────────────────────────────────── */
int    secure_equals(const char *a, const char *b);
void   secure_zero(void *p, size_t n);

/* ── SHA-256 ─────────────────────────────────────────────────── */
typedef struct {
    uint8_t  data[64];
    uint32_t datalen;
    uint64_t bitlen;
    uint32_t state[8];
} Sha256Ctx;

void sha256_init     (Sha256Ctx *ctx);
void sha256_update   (Sha256Ctx *ctx, const uint8_t *data, size_t len);
void sha256_final    (Sha256Ctx *ctx, uint8_t hash[32]);
void sha256_hex      (const char *in, char out_hex[65]);
void sha256_transform(Sha256Ctx *ctx, const uint8_t data[]);

/* ── HMAC-SHA-256 ────────────────────────────────────────────── */
void hmac_sha256(const uint8_t *key, size_t key_len,
                 const uint8_t *msg, size_t msg_len,
                 uint8_t out[32]);

/* ── PBKDF2-SHA-256 ──────────────────────────────────────────── */
/* Returns 0 on success, -1 on invalid args.
 * out_hex: 64-byte hex string (+ NUL terminator → 65 bytes) */
int pbkdf2_sha256_hex(const char *password,
                      const uint8_t *salt, size_t salt_len,
                      int iters, char out_hex[65]);

/* ── Misc helpers ────────────────────────────────────────────── */
int is_hex_64   (const char *s);
int hex_decode  (const char *hex, uint8_t *out, size_t out_cap, size_t *out_len);

/* ── KDF verify ─────────────────────────────────────────────── */
/* Format: pbkdf2$<iter>$<salt_hex>$<hash_hex>
 * Returns 1 if password matches, 0 otherwise. */
int validate_kdf_and_verify(const char *kdf_str, const char *password);
