#!/usr/bin/env bash
# ipset log_analyzer_block_v4 entry sayisi (grep -c || echo 0 "0\n0" uretir — kullanma)
ipset_v4_entry_count() {
  if ! command -v ipset >/dev/null 2>&1; then
    echo 0
    return
  fi
  if ! ipset list log_analyzer_block_v4 &>/dev/null; then
    echo 0
    return
  fi
  local n
  n=$(set +o pipefail
    ipset list log_analyzer_block_v4 2>/dev/null \
      | awk '/^Number of entries:/ {print $4; exit}' 2>/dev/null || true)
  echo "${n:-0}"
}
