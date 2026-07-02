#ifndef CPU_PAUSE_H
#define CPU_PAUSE_H

/* Spin-wait hint — x86 _mm_pause, ARM yield, diger mimariler no-op */
#if defined(__x86_64__) || defined(__i386__) || defined(_M_X64) || defined(_M_IX86)
#include <emmintrin.h>
#define LG_CPU_PAUSE() _mm_pause()
#elif defined(__aarch64__) || defined(__arm__) || defined(__ARM_ARCH)
#define LG_CPU_PAUSE() __asm__ __volatile__("yield" ::: "memory")
#else
#define LG_CPU_PAUSE() ((void)0)
#endif

#endif
