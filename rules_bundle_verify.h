/* rules_bundle_verify.h — CRS/rules dosya bütünlüğü (manifest sha256) */
#pragma once

/** manifest JSON: {"files":{"rules/crs-bundle.rules":"<sha256hex>"}}
 *  RULES_VERIFY=0 veya manifest yok → 0 (atla). Uyumsuzluk → -1. */
int rules_bundle_verify_file(const char *rules_path, const char *manifest_path);
