import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createHostedEnvironment, type HostedEnvironmentKind, type HostedSiteGroup } from "@/lib/hosting-api";
import { MY_SITES_FIELD, MY_SITES_POPOVER, MY_SITES_PRIMARY_BTN } from "./my-sites-theme";

export type AddSiteDialogProps = {
  open: boolean;
  /** When set, adds an environment to this existing site instead of creating a new one. */
  group: HostedSiteGroup | null;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const KINDS: Array<{ value: HostedEnvironmentKind; label: string }> = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

export function AddSiteDialog({ open, group, onOpenChange, onCreated }: AddSiteDialogProps) {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState<HostedEnvironmentKind | "">("");
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setDomain("");
    setError("");
    const used = new Set(group?.environments.map((e) => e.environment) ?? []);
    setEnvironment(group ? (KINDS.find((k) => !used.has(k.value))?.value ?? "") : "production");
  }, [open, group]);

  const taken = new Set(group?.environments.map((e) => e.environment) ?? []);
  const canSubmit = Boolean(environment) && (group ? true : name.trim().length > 0) && !busy;

  async function submit() {
    if (!environment) return;
    setBusy(true);
    setError("");
    const res = await createHostedEnvironment({
      name: group ? undefined : name.trim(),
      groupId: group?.id,
      environment,
      primaryDomain: domain.trim() || undefined,
    });
    setBusy(false);
    if (res.ok === false) {
      setError(res.error);
      return;
    }
    onOpenChange(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-none bg-zinc-950 p-5 text-base">
        <DialogHeader>
          <DialogTitle className="text-lg text-white">{group ? `Add environment to ${group.name}` : "Add site"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {group ? null : (
            <Input
              className={MY_SITES_FIELD}
              placeholder="Site name"
              aria-label="Site name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          )}
          <Select value={environment} onValueChange={(v) => setEnvironment(v as HostedEnvironmentKind)}>
            <SelectTrigger className={`${MY_SITES_FIELD} [&_svg]:text-muted-foreground`} aria-label="Environment">
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent className={MY_SITES_POPOVER}>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value} disabled={taken.has(k.value)}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className={MY_SITES_FIELD}
            placeholder="Custom domain (optional)"
            aria-label="Custom domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="h-6 truncate text-red-300" title={error || undefined}>
            {error}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" className="h-8 rounded-none" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" className={MY_SITES_PRIMARY_BTN} disabled={!canSubmit} onClick={() => void submit()}>
              {busy ? "Creating…" : group ? "Add environment" : "Create site"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
