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

# Wait for MariaDB, install WordPress on first boot, and activate neo-pulse-wp (host-report endpoint).
install_wordpress() {
  local host="${WORDPRESS_DB_HOST%%:*}"
  local port="${WORDPRESS_DB_HOST##*:}"
  [[ "$port" == "$host" ]] && port=3306
  local attempt
  for attempt in $(seq 1 90); do
    if mariadb-admin ping -h "$host" -P "$port" -u "$WORDPRESS_DB_USER" -p"$WORDPRESS_DB_PASSWORD" --silent >/dev/null 2>&1; then
      break
    fi
    if [[ "$attempt" == 90 ]]; then
      echo "[pulse-host] MariaDB at ${host}:${port} not reachable after 180s" >&2
      exit 1
    fi
    sleep 2
  done
  # wp-config.php is written by the official entrypoint right before apache starts.
  for attempt in $(seq 1 30); do
    [[ -f /var/www/html/wp-config.php ]] && break
    sleep 1
  done
  cd /var/www/html
  if ! wp core is-installed --allow-root >/dev/null 2>&1; then
    wp core install --allow-root --skip-email \
      --url="$WORDPRESS_SITE_URL" \
      --title="${WORDPRESS_SITE_TITLE:-Pulse Host}" \
      --admin_user="$WORDPRESS_ADMIN_USER" \
      --admin_password="$WORDPRESS_ADMIN_PASSWORD" \
      --admin_email="$WORDPRESS_ADMIN_EMAIL"
    echo "[pulse-host] WordPress installed at $WORDPRESS_SITE_URL"
  fi
  wp plugin activate neo-pulse-wp --allow-root
}

copy_plugins

docker-entrypoint.sh apache2-foreground &
apache_pid=$!
install_wordpress
wait "$apache_pid"
