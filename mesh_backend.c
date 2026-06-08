/* mesh_backend.c — Tek production mesh kanali (Faz 1.3 / 5.3) */
#define _GNU_SOURCE
#include "mesh_backend.h"
#include <stdio.h>
#include <string.h>
#include <strings.h>

extern int g_operator_quiet;

static MeshBackendMode g_mode = MESH_BACKEND_NONE;
static int g_logged = 0;

static MeshBackendMode parse_cfg(const char *s)
{
    if (!s || !s[0]) return MESH_BACKEND_NONE;
    if (strcasecmp(s, "etcd") == 0) return MESH_BACKEND_ETCD;
    if (strcasecmp(s, "zmq") == 0)  return MESH_BACKEND_ZMQ;
    if (strcasecmp(s, "none") == 0) return MESH_BACKEND_NONE;
    return MESH_BACKEND_NONE;
}

void mesh_backend_configure(const char *backend_cfg,
                            const char *etcd_endpoints,
                            int zmq_pub_enabled,
                            int zmq_sub_enabled)
{
    /* MESH_BACKEND=none acikca verildiyse auto etcd devreye girmesin */
    if (backend_cfg && backend_cfg[0] &&
        strcasecmp(backend_cfg, "none") == 0) {
        g_mode = MESH_BACKEND_NONE;
    } else {
        MeshBackendMode explicit = parse_cfg(backend_cfg);
        if (explicit != MESH_BACKEND_NONE) {
            g_mode = explicit;
        } else {
            /* auto: etcd oncelikli (production varsayilan) */
            if (etcd_endpoints && etcd_endpoints[0])
                g_mode = MESH_BACKEND_ETCD;
            else if (zmq_pub_enabled || zmq_sub_enabled)
                g_mode = MESH_BACKEND_ZMQ;
            else
                g_mode = MESH_BACKEND_NONE;
        }
    }

    if (!g_logged && !g_operator_quiet) {
        fprintf(stderr, "[MESH] backend=%s (etcd=%s zmq_pub=%d zmq_sub=%d)\n",
                mesh_backend_mode_str(),
                (etcd_endpoints && etcd_endpoints[0]) ? "configured" : "off",
                zmq_pub_enabled, zmq_sub_enabled);
        g_logged = 1;
    } else if (!g_logged) {
        g_logged = 1;
    }
}

MeshBackendMode mesh_backend_mode(void) { return g_mode; }

int mesh_backend_use_etcd(void)
{
    return g_mode == MESH_BACKEND_ETCD;
}

int mesh_backend_use_zmq(void)
{
    return g_mode == MESH_BACKEND_ZMQ;
}

const char *mesh_backend_mode_str(void)
{
    switch (g_mode) {
    case MESH_BACKEND_ETCD: return "etcd";
    case MESH_BACKEND_ZMQ:  return "zmq";
    default:                return "none";
    }
}
