#!/usr/bin/env bash
set -euo pipefail

copy_plugins() {
  if [[ -d /usr/src/neo-pulse-wp ]]; then
    mkdir -p /var/www/html/wp-content/plugins
    rsync -a --delete /usr/src/neo-pulse-wp/ /var/www/html/wp-content/plugins/neo-pulse-wp/ 2>/dev/null \
      || cp -a /usr/src/neo-pulse-wp /var/www/html/wp-content/plugins/neo-pulse-wp
  fi
  if [[ -d /usr/src/neo-pulse-app ]]; then
    mkdir -p /var/www/html/wp-content/plugins
    rsync -a --delete /usr/src/neo-pulse-app/ /var/www/html/wp-content/plugins/neo-pulse-app/ 2>/dev/null \
      || cp -a /usr/src/neo-pulse-app /var/www/html/wp-content/plugins/neo-pulse-app
  fi
}

copy_plugins

exec docker-entrypoint.sh apache2-foreground
