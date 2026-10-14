import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { TASK_FORM_FLAT_CONTROL_CLASS, TaskFormFlatField } from "@/components/manager/tasks/TaskFormLayout";
import type { WordPressSite } from "../types";
import { propertyWpEngineInstall } from "./property-profile-view-model";

export type WpEngineHostingFieldsProps = {
  site: WordPressSite | null | undefined;
  onPatchSite?: (siteId: string, patch: Partial<WordPressSite>) => void;
};

/** WP Engine install + account id (Settings → Integrations). Persists on blur via onPatchSite, like service area fields. */
export function WpEngineHostingFields({ site, onPatchSite }: WpEngineHostingFieldsProps) {
  const [install, setInstall] = useState(site?.wpEngineInstall ?? "");
  const [accountId, setAccountId] = useState(site?.wpEngineAccountId ?? "");

  useEffect(() => {
    setInstall(site?.wpEngineInstall ?? "");
    setAccountId(site?.wpEngineAccountId ?? "");
  }, [site?.id, site?.wpEngineInstall, site?.wpEngineAccountId]);

  const persist = () => {
    if (!site || !onPatchSite) return;
    onPatchSite(site.id, {
      wpEngineInstall: install.trim() || undefined,
      wpEngineAccountId: accountId.trim() || undefined,
    });
  };

  return (
    <>
      <TaskFormFlatField label="WP Engine install">
        <Input
          value={install}
          onChange={(e) => setInstall(e.target.value)}
          onBlur={persist}
          placeholder={site ? `WP Engine install (default: ${propertyWpEngineInstall({ ...site, wpEngineInstall: "" }) || "from site URL"})` : "WP Engine install"}
          aria-label="WP Engine install"
          autoComplete="off"
          disabled={!site}
          className={TASK_FORM_FLAT_CONTROL_CLASS}
        />
      </TaskFormFlatField>
      <TaskFormFlatField label="WP Engine account ID">
        <Input
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          onBlur={persist}
          placeholder="account_id from my.wpengine.com"
          aria-label="WP Engine account ID"
          autoComplete="off"
          disabled={!site}
          className={TASK_FORM_FLAT_CONTROL_CLASS}
        />
      </TaskFormFlatField>
    </>
  );
}
