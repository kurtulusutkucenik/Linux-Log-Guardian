/* deception.h — Active Cyber Deception (Tarpit + Honey-Response) Engine
 *
 * İki katmanlı aktif aldatma:
 *
 *  Katman A — Kademeli Tarpit:
 *    LFI/WAF tespitinde XDP tarpit olasılığı 10%→30%→70%→95%
 *    Saldırganın bağlantısı kademeli yavaşlar; ani kopuş şüphe uyandırmaz.
 *
 *  Katman B — Honey-Credential Injection:
 *    LFI/path-traversal deneyen IP'ye sahte /etc/passwd, sahte API key
 *    ve sahte yapılandırma dosyası içerikleri log'lanır; bu tuzak
 *    bilgiler başka yerde kullanıldığında saldırganı ifşa eder.
 */
#ifndef DECEPTION_H
#define DECEPTION_H

#include "parser.h"
#include <stdint.h>
#include <time.h>

/* Tuzak kimlik bilgisi */
typedef struct {
    char    token[64];      /* "honeyadmin", sahte API key, vs. */
    char    context[64];    /* "fake_passwd", "fake_api_key", vs. */
    char    ip[48];         /* Hangi IP'ye sunuldu */
    time_t  planted_ts;
    uint32_t trigger_count; /* Kaç kez tetiklendi */
} HoneyToken;

/* Tek bir saldırgan için deception durumu */
typedef struct {
    char     ip[48];
    uint8_t  tarpit_prob;       /* Mevcut tarpit olasılığı (0-95) */
    uint8_t  lfi_attempts;      /* LFI deneme sayısı */
    uint8_t  c2_encounters;     /* C2 aracı tespiti sayısı */
    time_t   first_encounter;
    time_t   last_encounter;
    uint8_t  honey_served;      /* Tuzak dosya sunuldu mu */
} DeceptionRecord;

#define DECEPTION_MAX_RECORDS 4096
#define DECEPTION_MAX_TOKENS  64

/* Sahte /etc/passwd içeriği (honey-credential içerir) */
extern const char HONEY_PASSWD_CONTENT[];
/* Sahte /etc/shadow içeriği */
extern const char HONEY_SHADOW_CONTENT[];
/* Sahte .env dosyası */
extern const char HONEY_ENV_CONTENT[];

/* ── API ──────────────────────────────────────────────────────────── */
void deception_init(void);

/*
 * LFI saldırısında tetiklenir:
 *  - Tarpit olasılığını artırır (IPC üzerinden daemon'a gönderilir)
 *  - Honey-credential log'lanır
 *  - Saldırgana gösterilen içerik tipini döner
 */
int deception_trigger_lfi(const char *ip, StrView url,
                          int ipc_fd);  /* ipc_fd: daemon soket, -1=devre dışı */

/* C2 araç tespitinde tarpit escalate eder */
int deception_trigger_c2_tool(const char *ip, const char *tool_name,
                               int ipc_fd);

/* Mevcut tarpit olasılığını sorgula (0-95) */
uint8_t deception_get_tarpit_prob(const char *ip);

/* Tüm honey-token'ları döker */
void deception_dump_tokens(void);

/* İstatistikler */
void deception_get_stats(uint64_t *lfi_traps, uint64_t *c2_traps,
                         uint64_t *honey_served);

#endif /* DECEPTION_H */
