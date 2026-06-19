/* bpf_compat.h — CO-RE vmlinux veya geleneksel linux basliklari */
#ifndef LG_BPF_COMPAT_H
#define LG_BPF_COMPAT_H

#ifdef __BPF_TRACING__

# if __has_include("vmlinux.h") && !defined(BPF_NO_VMLINUX)
#  include "vmlinux.h"
#  ifdef __VMLINUX_H__
#   define VMLINUX_LOADED 1
#  endif
# endif

# ifndef VMLINUX_LOADED
#  include <linux/bpf.h>
#  include <linux/ptrace.h>
#  include <linux/types.h>
#  include <linux/in.h>

struct trace_entry {
	unsigned short type;
	unsigned char flags;
	unsigned char preempt_count;
	int pid;
};

struct trace_event_raw_sys_enter {
	struct trace_entry ent;
	long id;
	unsigned long args[6];
};

# endif

# include <bpf/bpf_helpers.h>
# include <bpf/bpf_tracing.h>
# include <bpf/bpf_core_read.h>

#endif /* __BPF_TRACING__ */

#endif /* LG_BPF_COMPAT_H */
