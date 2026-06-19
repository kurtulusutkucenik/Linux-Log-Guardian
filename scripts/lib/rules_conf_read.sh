#!/usr/bin/env bash
# rules.conf okuma — 640 root:log-guardian (normal kullanici icin sudo grep)
# shellcheck shell=bash
[[ -n "${LG_RULES_CONF_READ_SH:-}" ]] && return 0
LG_RULES_CONF_READ_SH=1

lg_rules_conf_path() {
  echo "${LG_RULES:-/etc/log-guardian/rules.conf}"
}

lg_rules_grep() {
  local pattern="$1"
  local conf
  conf=$(lg_rules_conf_path)
  [[ -f "$conf" ]] || return 1
  if [[ -r "$conf" ]]; then
    grep -E "$pattern" "$conf" 2>/dev/null || return 1
  elif command -v sudo >/dev/null 2>&1; then
    sudo grep -E "$pattern" "$conf" 2>/dev/null || return 1
  else
    return 1
  fi
}

lg_rules_kv() {
  local key="$1"
  lg_rules_grep "^${key}=" | tail -1 | cut -d= -f2- || true
}
