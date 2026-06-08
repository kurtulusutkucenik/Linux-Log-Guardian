/* lg_stub.h — Opsiyonel / ortam bagimli ozellik isaretleri (Sprint E)
 *
 * LG_STUB: Derleme veya runtime'da tam prod degil; kapı testleri stub ile gecer.
 * Gercek prod: ilgili HAVE_* bayragi + docs/WASM_PROD_CHECKLIST.md vb.
 */
#ifndef LG_STUB_H
#define LG_STUB_H

#define LG_STUB_WASM_RUNTIME    "wasm_runtime.c (HAVE_WASM=0)"
#define LG_STUB_MESH_ZMQ        "mesh_intel.c (HAVE_ZMQ=0)"
#define LG_STUB_XDP_NIC         "ebpf_daemon.c (xdp_init fail → ipset)"
#define LG_STUB_ETCD_MESH       "etcd_mesh.c (MESH_ETCD_ENDPOINTS bos)"

#endif /* LG_STUB_H */
