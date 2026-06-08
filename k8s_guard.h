/* k8s_guard.h — Zero Trust Konteyner Koruma Katmanı
 *
 * Bir web prosesi (Nginx, PHP-FPM, Node.js) execve() çağırırsa
 * (RCE tespiti), bu modül:
 *   1. PID'in hangi konteyner/cgroup'a ait olduğunu tespit eder
 *   2. Konteynerin metadata'sını (container_id, workload_name) çıkarır
 *   3. Prosesi SIGKILL ile derhal öldürür (Zero Trust: güven yok)
 *   4. ebpf_daemon cgroup izleme listesini günceller
 */
#ifndef K8S_GUARD_H
#define K8S_GUARD_H

#include <stdint.h>
#include <sys/types.h>

/* ── Konteyner bilgisi ─────────────────────────────────────────────────── */
typedef struct {
    char     container_id[65];   /* Docker/containerd ID (64 hex + \0) */
    char     workload_name[128]; /* K8s pod adı veya compose service   */
    char     image_name[128];    /* Konteyner imajı (env'den çıkar)    */
    uint64_t cgroup_id;          /* cgroup v2 numeric ID               */
    int      is_container;       /* 0=bare-metal, 1=konteyner          */
} ContainerInfo;

/* ── RCE Olayı ─────────────────────────────────────────────────────────── */
typedef struct {
    pid_t         pid;              /* Shell spawn eden PID              */
    char          filename[64];     /* execve filename                   */
    char          argv1[64];        /* execve argv[1]                    */
    char          parent_comm[16];  /* Üst proses adı (nginx, php-fpm…) */
    ContainerInfo container;        /* Hangi konteynerden geldi          */
    uint64_t      timestamp_ns;     /* Olay zamanı (monotonic)           */
} RceEvent;

/* ── API ────────────────────────────────────────────────────────────────── */

/* Modülü başlat (BPF fd ile cgroup izleme listesini bağla).
 * watched_cgroups_map_fd: syscall_uprobe.o'daki watched_cgroups BPF map fd'i
 * Negatif ise cgroup izleme atlanır (fallback: tüm execve izlenir). */
void k8s_guard_init(int watched_cgroups_map_fd);

/* Modülü durdur / kaynakları serbest bırak */
void k8s_guard_stop(void);

/* PID'e ait konteyner bilgisini /proc/<pid>/cgroup'dan çıkar.
 * Dönüş: 1=konteyner içi, 0=host prosesi */
int k8s_guard_resolve_pid(pid_t pid, ContainerInfo *out);

/* Prosesi derhal SIGKILL ile öldür ve durumu logla.
 * Dönüş: 0=başarı, -1=hata (PID artık yok veya izin yok) */
int k8s_guard_kill_process(const RceEvent *ev);

/* Konteynerin cgroup ID'sini BPF izleme listesine ekle
 * (bu konteynerden gelen execve'ler izlenmeye devam eder). */
int k8s_guard_watch_cgroup(uint64_t cgroup_id);

/* Mevcut istatistikler */
void k8s_guard_get_stats(uint64_t *kills, uint64_t *containers_watched);

#endif /* K8S_GUARD_H */
