/* daemon_ipc.h — Privilege Separation IPC Protokolü
 *
 * Root yetkili eBPF daemon ile yetkisiz analyzer arasındaki
 * Unix domain socket mesaj formatını tanımlar.
 *
 * Socket yolu: /run/log-guardian/ipc.sock (SOCK_SEQPACKET)
 * Framing garantisi: her write() = bir IpcMessage, atomik teslim.
 */
#ifndef DAEMON_IPC_H
#define DAEMON_IPC_H

#include <stdint.h>

#define DAEMON_IPC_SOCK_PATH "/run/log-guardian/ipc.sock"
#define DAEMON_IPC_BACKLOG   32

/* Komut kodları (1 byte, packed) */
typedef enum __attribute__((packed)) {
    IPC_CMD_BAN_V4      = 1,  /* IPv4 ban (CIDR dahil)              */
    IPC_CMD_BAN_V6      = 2,  /* IPv6 ban                           */
    IPC_CMD_UNBAN_V4    = 3,  /* IPv4 unban                         */
    IPC_CMD_UNBAN_V6    = 4,  /* IPv6 unban                         */
    IPC_CMD_PING        = 5,  /* Daemon sağlık kontrolü             */
    IPC_CMD_SHUTDOWN    = 6,  /* Daemon'ı durdur                    */
    IPC_CMD_TARPIT_V4   = 7,  /* IPv4 Tarpit (Deception)            */
    IPC_CMD_TARPIT_V6   = 8,  /* IPv6 Tarpit (Deception)            */
    IPC_CMD_RCE_ALERT   = 9,  /* execve uprobe RCE tespiti (kernel) */
    IPC_CMD_TARPIT_START= 10, /* AF_XDP XSK tarpit havuzu başlat    */
    IPC_CMD_TARPIT_STOP = 11, /* IP'yi tarpit havuzundan çıkar      */
} IpcCmd;

/* İstek mesajı: 116 byte sabit boyut
 * RCE_ALERT için pid + cmdline alanları kullanılır.
 * Diğer komutlar için yalnızca ip/prefix/prob geçerlidir. */
typedef struct __attribute__((packed)) {
    IpcCmd   cmd;           /* Komut kodu (1 byte)            */
    uint8_t  prefix;        /* Prefix uzunluğu 0=host         */
    char     ip[46];        /* IP string, null-sonlu          */
    uint8_t  prob;          /* Tarpit Olasılığı (0-100)       */
    uint8_t  _pad[3];       /* hizalama                       */
    uint32_t auth_token;    /* fnv1a32(LOG_GUARDIAN_IPC_TOKEN)*/
    /* RCE_ALERT alanları (diğer komutlarda sıfır) */
    uint32_t pid;           /* Shell spawn eden PID           */
    char     cmdline[64];   /* execve argv[0] + argv[1]       */
} IpcMessage;

/* Yanıt mesajı: 64 byte sabit boyut */
typedef struct __attribute__((packed)) {
    int8_t   ok;            /* 0=başarı, -1=hata      */
    char     errmsg[63];    /* Hata açıklaması        */
} IpcResponse;

/* ────────────────────────────────────────────────────────────
 * Client API (analyzer process tarafından kullanılır)
 * ──────────────────────────────────────────────────────────── */

/* Daemon socket'ine bağlan. fd döndürür, hata: -1 */
int  daemon_ipc_connect(void);

/* Mesaj gönder, yanıt al. 0=başarı, -1=hata */
int  daemon_ipc_send(int sock_fd, const IpcMessage *msg, IpcResponse *resp);

/* Bağlantıyı kapat */
void daemon_ipc_close(int sock_fd);

/* Mesaj auth_token alanini doldurur (dogrudan IpcMessage kullanan cagri icin) */
void daemon_ipc_fill_auth(IpcMessage *msg);

/* Kolaylık sarmalayıcılar — her biri iç connect/send/close döngüsü yapar */
int  daemon_ipc_ban_ipv4(const char *ip_cidr);
int  daemon_ipc_ban_ipv6(const char *ip);
int  daemon_ipc_unban_ipv4(const char *ip_cidr);
int  daemon_ipc_unban_ipv6(const char *ip);
int  daemon_ipc_tarpit_ipv4(const char *ip_cidr, uint8_t probability);
int  daemon_ipc_tarpit_ipv6(const char *ip_cidr, uint8_t probability);
int  daemon_ipc_ping(void);

#endif /* DAEMON_IPC_H */
