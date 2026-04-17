#!/bin/bash
set -e

if ! command -v chromium >/dev/null 2>&1; then
  apt-get update
  apt-get install -y --no-install-recommends chromium fonts-liberation
fi
