CREATE TABLE IF NOT EXISTS hosting_tenants (
  id SERIAL PRIMARY KEY,
  pulse_team_id BIGINT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Site group: a named site that owns one or more environments (installs).
CREATE TABLE IF NOT EXISTS hosted_site_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES hosting_tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

-- One row per environment / install (production | staging | development).
CREATE TABLE IF NOT EXISTS hosted_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER NOT NULL REFERENCES hosting_tenants(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  display_name TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'staging',
  primary_domain TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT 'ohio',
  render_service_id TEXT,
  render_db_service_id TEXT,
  disk_gb INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending',
  status_message TEXT,
  pulse_integration_site_id TEXT,
  wp_admin_url TEXT,
  site_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);

ALTER TABLE hosted_sites ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES hosted_site_groups(id) ON DELETE CASCADE;
ALTER TABLE hosted_sites ADD COLUMN IF NOT EXISTS report_token TEXT;

-- Backfill: every environment without a group gets a group named after it.
INSERT INTO hosted_site_groups (tenant_id, name)
SELECT DISTINCT s.tenant_id, s.display_name
FROM hosted_sites s
WHERE s.group_id IS NULL
ON CONFLICT (tenant_id, name) DO NOTHING;

UPDATE hosted_sites s
SET group_id = g.id
FROM hosted_site_groups g
WHERE s.group_id IS NULL AND g.tenant_id = s.tenant_id AND g.name = s.display_name;

-- Latest collected facts per environment (health cron upserts).
CREATE TABLE IF NOT EXISTS hosted_env_stats (
  site_id UUID PRIMARY KEY REFERENCES hosted_sites(id) ON DELETE CASCADE,
  php_version TEXT,
  wp_version TEXT,
  wp_update_available TEXT,
  storage_bytes BIGINT,
  bandwidth_bytes_30d BIGINT,
  visits_30d BIGINT,
  plugins_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  themes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  collected_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS hosted_tags (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES hosting_tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS hosted_group_tags (
  group_id UUID NOT NULL REFERENCES hosted_site_groups(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES hosted_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (group_id, tag_id)
);

CREATE TABLE IF NOT EXISTS hosted_deploys (
  id SERIAL PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES hosted_sites(id) ON DELETE CASCADE,
  render_deploy_id TEXT,
  git_commit TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hosted_backups (
  id SERIAL PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES hosted_sites(id) ON DELETE CASCADE,
  storage_uri TEXT NOT NULL DEFAULT '',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hosting_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES hosted_sites(id) ON DELETE SET NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hosting_audit_log (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES hosting_tenants(id) ON DELETE SET NULL,
  actor_user_id BIGINT,
  action TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hosted_sites_tenant ON hosted_sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hosted_sites_group ON hosted_sites(group_id);
CREATE INDEX IF NOT EXISTS idx_hosting_jobs_status ON hosting_jobs(status);
