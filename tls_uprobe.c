/* tls_uprobe.c — eBPF Uprobe: In-Memory TLS/SSL Şifre Çözümü Sensörü
 *
 * SSL_read / SSL_write fonksiyonlarına kernel seviyesinde hook atar.
 * Şifreleme olmadan önce (SSL_write) veya çözüldükten sonra (SSL_read)
 * plaintext veriyi ring buffer üzerinden userspace'e gönderir.
 *
 * HYBRID yaklaşım:
 *   Dinamik OpenSSL: uprobe → /usr/lib/.../libssl.so.X:SSL_read
 *   Statik OpenSSL : uprobe → /usr/bin/nginx:SSL_read (ELF offset)
 *
 * Derleme:
 *   clang -O2 -g -target bpf -D__TARGET_ARCH_x86 -D__BPF_TRACING__ \
 *         -I. -I/usr/include/bpf -c tls_uprobe.c -o tls_uprobe.o
 *
 * Gereksinim: Linux >= 5.5 (uprobe + ring buffer desteği)
 */
#ifdef __BPF_TRACING__

#if __has_include("vmlinux.h") && !defined(BPF_NO_VMLINUX)
# include "vmlinux.h"
# define VMLINUX_LOADED 1
#endif

#ifndef VMLINUX_LOADED
# include <linux/bpf.h>
# include <linux/ptrace.h>
# include <linux/types.h>
#endif

#include <bpf/bpf_helpers.h>
#include <bpf/bpf_tracing.h>
#include <bpf/bpf_core_read.h>

/* ── TLS Plaintext Event yapısı ──────────────────────────────────── */
#define TLS_PAYLOAD_MAX 1024   /* Yakalanan max plaintext boyutu */
#define TLS_EVENT_READ  1      /* SSL_read (gelen veri) */
#define TLS_EVENT_WRITE 2      /* SSL_write (giden veri) */

struct tls_event {
    __u64  pid_tgid;           /* PID << 32 | TGID */
    __u32  fd;                 /* Socket FD (-1 bilinmiyor) */
    __u32  data_len;           /* Gerçek veri uzunluğu */
    __u8   direction;          /* TLS_EVENT_READ / TLS_EVENT_WRITE */
    __u8   truncated;          /* 1 = TLS_PAYLOAD_MAX'ta kesildi */
    __u8   _pad[6];
    __u8   data[TLS_PAYLOAD_MAX];
};

/* Ring buffer: userspace'e event gönderir */
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 4 * 1024 * 1024); /* 4 MB */
} tls_ringbuf SEC(".maps");

/*
 * Per-CPU ara tampon: uprobe'da buf pointer'ı sakla,
 * uretprobe'da buf'ı oku (iki hook arasında data taşımak için).
 */
struct ssl_args {
    __u64 buf_ptr;   /* SSL_read/write buf argümanı */
    __s32 num;       /* İstenen uzunluk */
    __u8  direction;
};

struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, struct ssl_args);
} ssl_args_map SEC(".maps");

/* İstatistik haritası */
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __uint(max_entries, 4);
    __type(key, __u32);
    __type(value, __u64);
} tls_stats SEC(".maps");

#define STAT_TLS_READ_CALLS  0
#define STAT_TLS_WRITE_CALLS 1
#define STAT_TLS_ERRORS      2
#define STAT_TLS_BYTES       3

static __always_inline void bump_tls_stat(__u32 idx, __u64 val) {
    __u64 *v = bpf_map_lookup_elem(&tls_stats, &idx);
    if (v) __sync_fetch_and_add(v, val);
}

/* ── SSL_read entry: buf pointer'ı sakla ────────────────────────── */
/*
 * SSL_read(SSL *ssl, void *buf, int num)
 * PT_REGS_PARM2 = buf (veri kopyalanacak hedef bellek)
 * PT_REGS_PARM3 = num (istek boyutu)
 */
SEC("uprobe/SSL_read")
int uprobe_ssl_read_entry(struct pt_regs *ctx) {
    __u32 key = 0;
    struct ssl_args *args = bpf_map_lookup_elem(&ssl_args_map, &key);
    if (!args) return 0;

    args->buf_ptr  = PT_REGS_PARM2(ctx);
    args->num      = PT_REGS_PARM3(ctx);
    args->direction = TLS_EVENT_READ;

    bump_tls_stat(STAT_TLS_READ_CALLS, 1);
    return 0;
}

/* ── SSL_read return: plaintext'i ring buffer'a yaz ─────────────── */
/*
 * SSL_read dönüş değeri: okunan byte sayısı (>0) veya hata (<= 0)
 */
SEC("uretprobe/SSL_read")
int uretprobe_ssl_read_return(struct pt_regs *ctx) {
    __s32 ret = (__s32)PT_REGS_RC(ctx);
    if (ret <= 0) {
        bump_tls_stat(STAT_TLS_ERRORS, 1);
        return 0;
    }

    __u32 key = 0;
    struct ssl_args *args = bpf_map_lookup_elem(&ssl_args_map, &key);
    if (!args || args->buf_ptr == 0) return 0;

    __u32 to_copy = (__u32)ret;
    __u8  truncated = 0;
    if (to_copy > TLS_PAYLOAD_MAX) {
        to_copy = TLS_PAYLOAD_MAX;
        truncated = 1;
    }

    struct tls_event *evt = bpf_ringbuf_reserve(&tls_ringbuf,
                                                 sizeof(*evt), 0);
    if (!evt) return 0;

    evt->pid_tgid   = bpf_get_current_pid_tgid();
    evt->fd         = 0xFFFFFFFF;   /* FD tespiti platform bağımlı */
    evt->data_len   = to_copy;
    evt->direction  = TLS_EVENT_READ;
    evt->truncated  = truncated;

    long r = bpf_probe_read_user(evt->data, to_copy,
                                  (void *)(long)args->buf_ptr);
    if (r != 0) {
        bpf_ringbuf_discard(evt, 0);
        bump_tls_stat(STAT_TLS_ERRORS, 1);
        return 0;
    }

    bump_tls_stat(STAT_TLS_BYTES, to_copy);
    bpf_ringbuf_submit(evt, 0);

    /* Temizle */
    args->buf_ptr = 0;
    return 0;
}

/* ── SSL_write entry: buf pointer'ı sakla ───────────────────────── */
/*
 * SSL_write(SSL *ssl, const void *buf, int num)
 */
SEC("uprobe/SSL_write")
int uprobe_ssl_write_entry(struct pt_regs *ctx) {
    __u32 key = 0;
    struct ssl_args *args = bpf_map_lookup_elem(&ssl_args_map, &key);
    if (!args) return 0;

    args->buf_ptr   = PT_REGS_PARM2(ctx);
    args->num       = PT_REGS_PARM3(ctx);
    args->direction = TLS_EVENT_WRITE;

    /* SSL_write için veriyi hemen oku (return öncesi buf geçerli) */
    __u32 to_copy = (__u32)args->num;
    __u8  truncated = 0;
    if (to_copy > TLS_PAYLOAD_MAX) {
        to_copy = TLS_PAYLOAD_MAX;
        truncated = 1;
    }
    if (to_copy == 0) return 0;

    struct tls_event *evt = bpf_ringbuf_reserve(&tls_ringbuf,
                                                 sizeof(*evt), 0);
    if (!evt) return 0;

    evt->pid_tgid  = bpf_get_current_pid_tgid();
    evt->fd        = 0xFFFFFFFF;
    evt->data_len  = to_copy;
    evt->direction = TLS_EVENT_WRITE;
    evt->truncated = truncated;

    long r = bpf_probe_read_user(evt->data, to_copy,
                                  (void *)(long)args->buf_ptr);
    if (r != 0) {
        bpf_ringbuf_discard(evt, 0);
        return 0;
    }

    bump_tls_stat(STAT_TLS_WRITE_CALLS, 1);
    bump_tls_stat(STAT_TLS_BYTES, to_copy);
    bpf_ringbuf_submit(evt, 0);
    return 0;
}

char _license[] SEC("license") = "GPL";

#endif /* __BPF_TRACING__ */
