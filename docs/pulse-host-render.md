# Pulse Host on Render

Pulse Host is Neo Digital's own managed WordPress hosting, built on Render. The Pulse app shows it as **Dashboard > Pulse Host** (`/#pulse-host`), a **My Sites** page that lists only Pulse Host sites. The **pulse-host-api** service stores site records in Postgres, provisions WordPress + MariaDB pairs on Render, and collects per-environment stats.

## Architecture

| Layer | Render service | Role |
|-------|----------------|------|
| Pulse UI | `neo-pulse-static` / `app.neodigital.ca` | My Sites page (`src/components/hosting`) |
| Hub API proxy | `neodigital.ca` (`neo-pulse-app`) | `/api/hosting/*` forwards to pulse-host-api with team/user headers |
| Control API | `pulse-host-api` | Postgres, jobs, Render orchestration (`hosting/neo-host-api`) |
| Control DB | `pulse-host-control-db` | Render Postgres (`PULSE_HOST_DB_URL`) |
| WP hub | `pulse-host-wp-hub` | `neo-pulse-app` backend for `neo-pulse-static` (`/api/*` rewrite); `NEO_PULSE_HUB=1`; not a My Sites row |
| DB hub | `pulse-host-db-hub` | MariaDB for the hub WP |
| Cron | `pulse-host-backup-cron`, `pulse-host-health-cron` | Daily backup + 15 minute health/stats |

Browser code never calls Render or hosted sites directly. It calls `backendApiUrl("/hosting/...")`; the PHP proxy adds the bearer token and `X-Neo-Pulse-Team-Id`, `X-Neo-Pulse-User-Id`, `X-Neo-Pulse-Hosting-Write` headers.

## Data model

| Table | Meaning |
|-------|---------|
| `hosted_site_groups` | One "site" card on My Sites (a client site) |
| `hosted_sites` | One environment row (production, staging, development) with Render service ids and a `report_token` |
| `hosted_env_stats` | PHP, WordPress, update availability, storage, 30 day bandwidth, 30 day visits, plugin and theme inventory |
| `hosted_tags`, `hosted_group_tags` | Tags shown on cards and used by Filter |
| `hosting_jobs` | provision, deploy, backup, health, cache_clear, ops_agent |

Schema lives in `hosting/neo-host-api/db/schema.sql` and is applied on API start.

## My Sites page

- Header: **Add site** opens a dialog (site name or existing site, environment, optional custom domain). Submitting creates a `provision` job.
- Tabs: All sites, Needs attention (failed or degraded), Needs updates (WP, plugin, or theme update available), Plugins, Themes (inventory tables).
- Toolbar: search, Filter popover (environment, status, tags, PHP version), Manage tags, CSV export.
- Cards: one per site group; rows per environment with Prd/Stg/Dev pill, slug, domain, status, WP Admin link, and a kebab menu (Visit site, Copy environment, Backup now, Clear cache, Redeploy, Retry provision, Delete environment).
- Stats line per environment: PHP, WordPress, Storage, Bandwidth, Visits, Updates. "Stats incomplete" is shown when the last collection recorded an error.

## Provisioning (Add site)

`hosting/neo-host-api/jobs/provision.mjs` creates two Docker services from this repo:

1. `pulse-host-db-<slug>` (private service, `hosting/docker/mariadb/Dockerfile`, disk at `/var/lib/mysql`)
2. `pulse-host-wp-<slug>` (web service, `hosting/docker/wordpress/Dockerfile`, disk at `/var/www/html`, env includes `WORDPRESS_DB_HOST=<db>:3306`, admin credentials, and `PULSE_HOST_REPORT_TOKEN`)

Optional custom domain is added to the WP service. On success the row gets `render_service_id`, `site_url`, `wp_admin_url`, status `active`. On failure status is `failed` with the message, and **Retry provision** replaces any half-created MariaDB service and re-runs the job.

Each service gets a Render **build filter** so it only redeploys when its own paths change (`hosting/docker/mariadb/**` for DB; `hosting/docker/wordpress/**` and both plugins for WP; `hosting/neo-host-api/**`, `hosting/agents/**`, `Dockerfile.neo-host-api`, `package*.json` for the API). MariaDB is always a **private service**: Render health-checks web services over HTTP, which MariaDB cannot answer.

On every WP boot `hosting/docker/wordpress/docker-entrypoint.sh` copies both plugins, waits for MariaDB (up to 10 minutes), runs `wp core install` once (site URL, title, admin from env), activates `neo-pulse-wp`, sets `/%postname%/` permalinks if none are set, and hard-flushes rewrite rules so `/wp-json/` routes through WordPress.

Required env on `pulse-host-api`: `PULSE_HOST_RENDER_REPO`, `PULSE_HOST_RENDER_BRANCH`, `RENDER_OWNER_ID`, `PULSE_HOST_ADMIN_EMAIL`, `RENDER_API_KEY`.

## Stats collection (health cron)

Every 15 minutes `pulse-host-health-cron` calls the API, which for each environment:

1. Checks `/wp-json/` reachability (active or degraded).
2. Calls `GET /wp-json/neo-pulse/v1/host-report` on the hosted site with header `X-Pulse-Host-Token: <report_token>`. The neo-pulse-wp plugin (`class-neo-pulse-wp-host-report.php`) returns PHP version, WP version, available WP update, storage bytes, and plugin/theme inventory.
3. Reads Render metrics for the WP service: `bandwidth` and `http-requests` over 30 days. **Visits = HTTP requests (30 d)**.
4. Upserts `hosted_env_stats`, keeping last known values and recording `error_message` when a step fails.

**Clear cache** posts to `/host-report/purge-cache` on the hosted site with the same token.

The health job checks `site_url` + `/wp-json/`; a row whose URL does not resolve shows **degraded** with "wp-json HTTP unreachable". Provisioned sites use their `*.onrender.com` URL until a custom domain has DNS (Cloudflare CNAME to the onrender host, DNS only, so Render can issue the certificate).

## WP Admin with the Pulse account

Every hosted WordPress gets an administrator `pulse` (`PULSE_ADMIN_EMAIL`) whose `user_pass` is the Pulse hub bcrypt hash (`PULSE_ADMIN_PASSWORD_HASH`). The container entrypoint creates or refreshes it on every boot; the provision job copies both values from `pulse-host-api` to each new WP service. WordPress verifies `$2y$` hashes via `crypt()` / `password_verify()`, so WP Admin accepts `pulse@neodigital.ca` + the Pulse password. If the Pulse password changes, update `PULSE_ADMIN_PASSWORD_HASH` on `pulse-host-api` and each WP service, then redeploy.

## Provision the platform

```bash
PULSE_ADMIN_PASSWORD_HASH='<pulse@ hash>' npm run provision:render-pulse-host
```

Requires `RENDER_API_KEY` or `Downloads/Render API.txt`. Creates Postgres, the hub MariaDB (private service), the hub WordPress, and pulse-host-api if missing; env vars are merged into existing services, never replaced wholesale.

The hub WordPress (`pulse-host-wp-hub`) runs `neo-pulse-app` (`NEO_PULSE_HUB=1`) with `PULSE_HOST_API_BASE` / `PULSE_HOST_API_TOKEN`, and `neo-pulse-static` rewrites `/api/*` to `https://pulse-host-wp-hub.onrender.com/api/*` (Render static site routes, which replace `dist/_redirects`; the `/*` to `/index.html` rule lives there too). It is intentionally not a `hosted_sites` row so the My Sites delete action cannot remove it. Hub users are the `wp_neo-pulse_users` / team tables copied from the local hub with identical password hashes.

## Hub secrets (neodigital.ca and local)

`neo-pulse-app-secrets.php` must define:

```php
define( 'PULSE_HOST_API_BASE', 'https://pulse-host-api.onrender.com' );
define( 'PULSE_HOST_API_TOKEN', '<PULSE_HOST_API_TOKEN from Render>' );
```

Locally, put `PULSE_HOST_API_BASE` and `PULSE_HOST_API_TOKEN` in `.env` (not `.env.local`); `scripts/generate-local-app-secrets.mjs` writes the defines and `scripts/sync-local-wp-plugins.ps1` copies both plugins into the `wpstg-neopulse-local-php` container. Then `http://127.0.0.1:8080/api/hosting/sites` returns JSON (401 without a Pulse session).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run provision:render-pulse-host` | Create/update Pulse Host Render services |
| `npm run start:neo-host-api` | Run control API locally |
| `npm run test:neo-host-api` | Vitest for hosting agents |
| `npx vitest run src/components/hosting/my-sites` | My Sites view model tests |
| `node scripts/neo-host-cron-trigger.mjs health` | Trigger a health/stats run now |

## Auth

Hosting uses team permission area `hosting` (read/write). Owners and admins have write; editors have read unless customized in Teams. Write actions (add, delete, backup, cache clear, redeploy, tags) require write.
