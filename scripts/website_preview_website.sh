#!/usr/bin/env bash
# Alias: bash scripts/preview_website.sh
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/preview_website.sh" "$@"
