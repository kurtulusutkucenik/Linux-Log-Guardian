/* mesh_backend.h — Production mesh: etcd OR zmq, not both */
#ifndef MESH_BACKEND_H
#define MESH_BACKEND_H

typedef enum {
    MESH_BACKEND_NONE = 0,
    MESH_BACKEND_ETCD = 1,
    MESH_BACKEND_ZMQ  = 2,
} MeshBackendMode;

void mesh_backend_configure(const char *backend_cfg,
                            const char *etcd_endpoints,
                            int zmq_pub_enabled,
                            int zmq_sub_enabled);

MeshBackendMode mesh_backend_mode(void);
int mesh_backend_use_etcd(void);
int mesh_backend_use_zmq(void);
const char *mesh_backend_mode_str(void);

#endif /* MESH_BACKEND_H */
