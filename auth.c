#define _GNU_SOURCE
#include "auth.h"
#include "crypto_utils.h"

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <termios.h>
#include <sys/stat.h>
#include <ctype.h>
#include <errno.h>
#include <pwd.h>
#include <grp.h>
#include <seccomp.h>

/* ── Internal helpers ───────────────────────────────────────── */

static char *auth_trim_ws(char *s) {
    while (*s && isspace((unsigned char)*s)) s++;
    if (*s == '\0') return s;
    char *end = s + strlen(s) - 1;
    while (end > s && isspace((unsigned char)*end)) { *end = '\0'; end--; }
    return s;
}

static int prompt_hidden_input(const char *prompt, char *out, size_t out_cap) {
    if (!prompt || !out || out_cap == 0) return -1;
    struct termios old_tio, no_echo;
    if (tcgetattr(STDIN_FILENO, &old_tio) != 0) return -1;
    no_echo = old_tio;
    no_echo.c_lflag &= (tcflag_t)~(ECHO);
    if (tcsetattr(STDIN_FILENO, TCSANOW, &no_echo) != 0) return -1;

    fprintf(stderr, "%s", prompt); fflush(stderr);
    char buf[256];
    if (!fgets(buf, sizeof(buf), stdin)) {
        tcsetattr(STDIN_FILENO, TCSANOW, &old_tio); return -1;
    }
    tcsetattr(STDIN_FILENO, TCSANOW, &old_tio);
    fprintf(stderr, "\n");

    char *val = auth_trim_ws(buf);
    size_t n = strlen(val);
    if (n >= out_cap) n = out_cap - 1;
    memcpy(out, val, n); out[n] = '\0';
    return 0;
}

static int read_password_file(const char *path, char *out, size_t out_cap) {
    if (!path || !*path || !out || out_cap == 0) return -1;
    if (is_secure_file(path, 1) != 0) {
        fprintf(stderr, "[ERISIM] Guvensiz parola dosyasi izinleri: %s (onerilen: 600)\n", path);
        return -1;
    }
    FILE *fp = fopen(path, "r");
    if (!fp) return -1;
    char buf[256];
    if (!fgets(buf, sizeof(buf), fp)) { fclose(fp); return -1; }
    fclose(fp);
    char *val = auth_trim_ws(buf);
    size_t n = strlen(val);
    if (n >= out_cap) n = out_cap - 1;
    memcpy(out, val, n); out[n] = '\0';
    secure_zero(buf, sizeof(buf));
    return 0;
}

/* ── Public API ─────────────────────────────────────────────── */

int is_secure_file(const char *path, int strict_owner_only) {
    struct stat st;
    if (stat(path, &st) != 0) return -1;
    if (!S_ISREG(st.st_mode)) return -1;
    mode_t bad = strict_owner_only ? (S_IRWXG | S_IRWXO) : (S_IWGRP | S_IRWXO);
    if ((st.st_mode & bad) != 0) return -1;
    return 0;
}

int enforce_startup_auth(void) {
    if (g_access_password_kdf[0] == '\0' && g_access_password_hash[0] == '\0') {
        fprintf(stderr,
                "[ERISIM] ACCESS_PASSWORD_KDF tanimli degil. "
                "rules.conf icine ACCESS_PASSWORD_KDF=pbkdf2$iter$salt$hash ekleyin.\n");
        return -1;
    }
    if (g_access_password_hash[0] != '\0' && !is_hex_64(g_access_password_hash)) {
        fprintf(stderr, "[ERISIM] ACCESS_PASSWORD_HASH gecersiz. 64 hex olmalidir.\n");
        return -1;
    }
    if (g_access_password_kdf[0] == '\0' && g_access_password_hash[0] != '\0' && !g_output_json) {
        fprintf(stderr,
                "[ERISIM] UYARI: ACCESS_PASSWORD_HASH legacy. "
                "ACCESS_PASSWORD_KDF kullanin.\n");
    }

    const char *env_pw = getenv("LOGANALYZER_PASSWORD");

    for (int attempt = 1; attempt <= g_auth_max_attempts; attempt++) {
        char entered[128] = {0};
        if (g_password_file_path[0] != '\0') {
            if (read_password_file(g_password_file_path, entered, sizeof(entered)) != 0) {
                fprintf(stderr, "[ERISIM] Parola dosyasi okunamadi: %s\n", g_password_file_path);
                return -1;
            }
        } else if (env_pw && *env_pw) {
            size_t n = strlen(env_pw);
            if (n >= sizeof(entered)) n = sizeof(entered) - 1;
            memcpy(entered, env_pw, n); entered[n] = '\0';
        } else {
            if (!isatty(STDIN_FILENO)) {
                fprintf(stderr,
                        "[ERISIM] Interaktif terminal yok. "
                        "--password-file veya LOGANALYZER_PASSWORD kullanin.\n");
                return -1;
            }
            if (prompt_hidden_input("[ERISIM] Parola: ", entered, sizeof(entered)) != 0) {
                fprintf(stderr, "[ERISIM] Parola okunamadi.\n");
                return -1;
            }
        }

        int ok = 0;
        if (g_access_password_kdf[0] != '\0') {
            ok = validate_kdf_and_verify(g_access_password_kdf, entered);
        } else {
            char entered_hash[65];
            sha256_hex(entered, entered_hash);
            ok = secure_equals(entered_hash, g_access_password_hash);
            secure_zero(entered_hash, sizeof(entered_hash));
        }
        secure_zero(entered, sizeof(entered));
        if (ok) return 0;

        int remain = g_auth_max_attempts - attempt;
        if (remain > 0) {
            fprintf(stderr, "[ERISIM] Parola hatali. Kalan deneme: %d\n", remain);
            usleep(250000 * (useconds_t)attempt);
        }
        if ((env_pw && *env_pw) || g_password_file_path[0] != '\0') break;
    }
    fprintf(stderr, "[ERISIM] 3 kez yanlis parola girildi. Sistemden cikis yapiliyor.\n");
    return -1;
}

void maybe_drop_privileges(void) {
    if (!g_drop_privs) return;
    if (geteuid() != 0) return;
    if (g_allow_ban) {
        if (!g_output_json)
            fprintf(stderr, "[ERISIM] --drop-privs aktif ama ban acik; root yetkisi korunuyor.\n");
        return;
    }
    const char *sudo_uid = getenv("SUDO_UID");
    const char *sudo_gid = getenv("SUDO_GID");
    if (!sudo_uid || !sudo_gid) {
        if (!g_output_json) fprintf(stderr, "[ERISIM] SUDO_UID/GID yok; privilege drop atlandi.\n");
        return;
    }
    uid_t uid = (uid_t)strtoul(sudo_uid, NULL, 10);
    gid_t gid = (gid_t)strtoul(sudo_gid, NULL, 10);
    if (setgid(gid) != 0 || setuid(uid) != 0) {
        fprintf(stderr, "[ERISIM] Privilege drop basarisiz.\n");
    } else if (!g_output_json) {
        fprintf(stderr, "[ERISIM] Privilege drop uygulandi: uid=%u gid=%u\n",
                (unsigned)uid, (unsigned)gid);
    }
}

void setup_seccomp(void) {
    scmp_filter_ctx ctx = seccomp_init(SCMP_ACT_KILL_PROCESS);
    if (!ctx) { fprintf(stderr, "[SECCOMP] init failed\n"); exit(1); }

    int allowed[] = {
        SCMP_SYS(read), SCMP_SYS(write), SCMP_SYS(open), SCMP_SYS(openat), SCMP_SYS(close),
        SCMP_SYS(stat), SCMP_SYS(fstat), SCMP_SYS(lstat), SCMP_SYS(lseek),
        SCMP_SYS(mmap), SCMP_SYS(mprotect), SCMP_SYS(munmap), SCMP_SYS(brk),
        SCMP_SYS(rt_sigaction), SCMP_SYS(rt_sigprocmask), SCMP_SYS(rt_sigreturn),
        SCMP_SYS(ioctl), SCMP_SYS(pread64), SCMP_SYS(pwrite64), SCMP_SYS(readv), SCMP_SYS(writev),
        SCMP_SYS(pipe), SCMP_SYS(pipe2), SCMP_SYS(epoll_wait), SCMP_SYS(epoll_ctl), SCMP_SYS(epoll_create1),
        SCMP_SYS(socket), SCMP_SYS(connect), SCMP_SYS(accept), SCMP_SYS(accept4),
        SCMP_SYS(recvfrom), SCMP_SYS(sendto), SCMP_SYS(setsockopt), SCMP_SYS(getsockopt),
        SCMP_SYS(getsockname), SCMP_SYS(getpeername),
        SCMP_SYS(bind), SCMP_SYS(listen), SCMP_SYS(shutdown),
        SCMP_SYS(recvmsg), SCMP_SYS(sendmsg),
        SCMP_SYS(sendmmsg), SCMP_SYS(recvmmsg),
        SCMP_SYS(getpid), SCMP_SYS(getuid), SCMP_SYS(geteuid), SCMP_SYS(getgid), SCMP_SYS(getegid),
        SCMP_SYS(futex), SCMP_SYS(clone), SCMP_SYS(clone3), SCMP_SYS(madvise),
        SCMP_SYS(exit), SCMP_SYS(exit_group), SCMP_SYS(nanosleep), SCMP_SYS(clock_nanosleep),
        SCMP_SYS(io_uring_setup), SCMP_SYS(io_uring_enter), SCMP_SYS(io_uring_register),
        SCMP_SYS(fcntl), SCMP_SYS(dup), SCMP_SYS(dup2), SCMP_SYS(dup3),
        SCMP_SYS(inotify_init1), SCMP_SYS(inotify_add_watch), SCMP_SYS(inotify_rm_watch),
        SCMP_SYS(getdents64), SCMP_SYS(statfs), SCMP_SYS(fstatfs), SCMP_SYS(socketpair),
        SCMP_SYS(setuid), SCMP_SYS(setgid), SCMP_SYS(setresuid), SCMP_SYS(setresgid),
        SCMP_SYS(capset), SCMP_SYS(capget), SCMP_SYS(bpf), SCMP_SYS(prctl),
        SCMP_SYS(uname), SCMP_SYS(access), SCMP_SYS(sysinfo), SCMP_SYS(sched_yield),
        SCMP_SYS(wait4), SCMP_SYS(getrusage), SCMP_SYS(clock_gettime), SCMP_SYS(getcwd),
        SCMP_SYS(rseq), SCMP_SYS(set_robust_list), SCMP_SYS(prlimit64), SCMP_SYS(getrandom),
        SCMP_SYS(poll), SCMP_SYS(ppoll), SCMP_SYS(select), SCMP_SYS(pselect6),
        SCMP_SYS(eventfd2), SCMP_SYS(timerfd_create), SCMP_SYS(timerfd_settime),
        SCMP_SYS(newfstatat), SCMP_SYS(statx), SCMP_SYS(readlink), SCMP_SYS(readlinkat),
        SCMP_SYS(fsync), SCMP_SYS(fdatasync), SCMP_SYS(ftruncate),
        SCMP_SYS(unlink), SCMP_SYS(unlinkat),
        /* ipset/iptables/notify-send: fork+execve child */
        SCMP_SYS(execve), SCMP_SYS(execveat)
    };

    for (size_t i = 0; i < sizeof(allowed)/sizeof(allowed[0]); i++)
        seccomp_rule_add(ctx, SCMP_ACT_ALLOW, allowed[i], 0);

    if (seccomp_load(ctx) < 0) {
        fprintf(stderr, "[SECCOMP] failed to load profile\n"); exit(1);
    }
    seccomp_release(ctx);
    fprintf(stderr, "[SECCOMP] BPF syscall whitelist active (kill-on-violation).\n");
}
