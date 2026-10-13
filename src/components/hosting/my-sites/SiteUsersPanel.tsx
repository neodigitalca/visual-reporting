import { useCallback, useEffect, useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  addUserToAllSites,
  createHostedSiteUser,
  deleteHostedSiteUser,
  fetchHostedSiteUsers,
  updateHostedSiteUser,
  type HostedBulkUserResult,
  type HostedEnvironment,
  type HostedSiteRole,
  type HostedSiteUser,
  type HostedUserInput,
} from "@/lib/hosting-api";
import type { TeamMember } from "@/lib/teams-types";
import { HOST_DIVIDER, MY_SITES_FIELD, MY_SITES_POPOVER, MY_SITES_PRIMARY_BTN } from "./my-sites-theme";

export type SiteUsersPanelProps = {
  /** Null = add one user to every provisioned site. */
  env: HostedEnvironment | null;
  teamMembers: TeamMember[];
  canAdmin: boolean;
  /** Height class for the scrolling list area. */
  listClassName?: string;
};

const ROLES: HostedSiteRole[] = ["administrator", "editor", "author", "contributor", "subscriber"];
const MANUAL = "manual";
const ICON_BTN = "h-7 w-7 shrink-0 rounded-none p-0 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground";
const SELECT_TRIGGER = `${MY_SITES_FIELD} whitespace-nowrap [&>span]:line-clamp-none [&_svg]:text-muted-foreground`;
const SELECT_CONTENT = MY_SITES_POPOVER;
const ROW = `grid h-11 grid-cols-[1fr_1fr_9rem_4rem] items-center gap-2 border-t ${HOST_DIVIDER} px-2`;

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => PASSWORD_ALPHABET[b % PASSWORD_ALPHABET.length]).join("");
}

function RoleSelect({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (role: HostedSiteRole) => void }) {
  return (
    <Select value={value} disabled={disabled} onValueChange={(v) => onChange(v as HostedSiteRole)}>
      <SelectTrigger className={SELECT_TRIGGER} aria-label="Role">
        <SelectValue placeholder="Role" />
      </SelectTrigger>
      <SelectContent className={SELECT_CONTENT}>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Users table + inline add row for one environment, or add-to-all-sites results when `env` is null. */
export function SiteUsersPanel({ env, teamMembers, canAdmin, listClassName = "min-h-[14rem] max-h-[24rem]" }: SiteUsersPanelProps) {
  const [users, setUsers] = useState<HostedSiteUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [source, setSource] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<HostedSiteRole | "">("");
  const [bulkResults, setBulkResults] = useState<HostedBulkUserResult[]>([]);
  const envId = env?.id ?? null;

  const load = useCallback(async () => {
    if (!envId) return;
    setLoading(true);
    const res = await fetchHostedSiteUsers(envId);
    setLoading(false);
    if (res.ok === false) {
      setError(res.error);
      return;
    }
    setUsers(res.users);
  }, [envId]);

  useEffect(() => {
    setUsers([]);
    setBulkResults([]);
    setError("");
    setNotice("");
    setSource("");
    setEmail("");
    setRole("");
    void load();
  }, [load]);

  async function run<R extends { ok: boolean }>(action: () => Promise<R>): Promise<Extract<R, { ok: true }> | null> {
    setBusy(true);
    setError("");
    const res = await action();
    setBusy(false);
    if (res.ok === false) {
      setError((res as { error?: string }).error ?? "Request failed.");
      return null;
    }
    return res as Extract<R, { ok: true }>;
  }

  function buildInput(): HostedUserInput | null {
    if (!role) return null;
    if (source === MANUAL) {
      const address = email.trim();
      if (!address) return null;
      return { email: address, password: generatePassword(), role };
    }
    const pulseUserId = Number(source);
    return pulseUserId > 0 ? { pulseUserId, role } : null;
  }

  async function add() {
    const input = buildInput();
    if (!input) return;
    setNotice("");
    if (env) {
      const res = await run(() => createHostedSiteUser(env.id, input));
      if (!res) return;
      setUsers((prev) => [...prev, res.user]);
    } else {
      const res = await run(() => addUserToAllSites(input));
      if (!res) return;
      setBulkResults(res.results);
    }
    const label = "email" in input ? input.email : (teamMembers.find((m) => m.userId === input.pulseUserId)?.email ?? "user");
    setNotice("password" in input ? `${label} added. Password (shown once): ${input.password}` : `${label} added with their Pulse password.`);
    setSource("");
    setEmail("");
    setRole("");
  }

  async function changeRole(user: HostedSiteUser, next: HostedSiteRole) {
    if (!env) return;
    const res = await run(() => updateHostedSiteUser(env.id, user.id, { role: next }));
    if (res) setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
  }

  async function resetPassword(user: HostedSiteUser) {
    if (!env) return;
    const password = generatePassword();
    const res = await run(() => updateHostedSiteUser(env.id, user.id, { password }));
    if (res) setNotice(`New password for ${user.email} (shown once): ${password}`);
  }

  async function remove(user: HostedSiteUser) {
    if (!env) return;
    const res = await run(() => deleteHostedSiteUser(env.id, user.id));
    if (res) setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  const canAdd = canAdmin && !busy && Boolean(role) && (source === MANUAL ? email.trim().length > 0 : Number(source) > 0);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_1fr_9rem_4rem] items-center gap-2">
        <Select
          value={source}
          disabled={!canAdmin}
          onValueChange={(v) => {
            setSource(v);
            setEmail(teamMembers.find((m) => String(m.userId) === v)?.email ?? "");
          }}
        >
          <SelectTrigger className={SELECT_TRIGGER} aria-label="Pulse team member">
            <SelectValue placeholder="Pulse team member" />
          </SelectTrigger>
          <SelectContent className={SELECT_CONTENT}>
            {teamMembers
              .filter((m) => !m.isBot)
              .map((m) => (
                <SelectItem key={m.userId} value={String(m.userId)}>
                  {m.displayName || m.email}
                </SelectItem>
              ))}
            <SelectItem value={MANUAL}>Someone else (email)</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className={MY_SITES_FIELD}
          placeholder="Email"
          aria-label="Email"
          type="email"
          value={email}
          disabled={!canAdmin}
          onChange={(e) => setEmail(e.target.value)}
        />
        <RoleSelect value={role} disabled={!canAdmin} onChange={setRole} />
        <Button type="button" className={MY_SITES_PRIMARY_BTN} disabled={!canAdd} onClick={() => void add()}>
          Add
        </Button>
      </div>

      <div className={`flex flex-col overflow-y-auto ${listClassName}`}>
        {env ? (
          <>
            <div className="grid h-9 grid-cols-[1fr_1fr_9rem_4rem] items-center gap-2 px-2 font-medium text-muted-foreground">
              <span>User</span>
              <span>Email</span>
              <span>Role</span>
              <span />
            </div>
            {loading ? Array.from({ length: 3 }, (_, i) => <div key={i} className={`${ROW} animate-pulse`} />) : null}
            {!loading && users.length === 0 ? <div className={`flex h-11 items-center border-t ${HOST_DIVIDER} px-2 text-muted-foreground`}>No users returned</div> : null}
            {users.map((user) => (
              <div key={user.id} className={ROW}>
                <span className="truncate" title={user.login}>
                  {user.displayName || user.login}
                </span>
                <span className="truncate text-muted-foreground" title={user.email}>
                  {user.email}
                </span>
                <RoleSelect value={user.roles[0] ?? ""} disabled={!canAdmin || busy} onChange={(next) => void changeRole(user, next)} />
                <span className="flex justify-end gap-1">
                  <Button type="button" variant="ghost" className={ICON_BTN} aria-label={`Reset password for ${user.email}`} disabled={!canAdmin || busy} onClick={() => void resetPassword(user)}>
                    <KeyRound className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button type="button" variant="ghost" className={ICON_BTN} aria-label={`Remove ${user.email}`} disabled={!canAdmin || busy} onClick={() => void remove(user)}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </Button>
                </span>
              </div>
            ))}
          </>
        ) : (
          <>
            {bulkResults.length === 0 ? <div className="flex h-11 items-center px-2 text-muted-foreground">Pick a user and role, then Add. Results per site appear here.</div> : null}
            {bulkResults.map((r) => (
              <div key={r.siteId} className={`grid h-11 grid-cols-[1fr_6rem_1fr] items-center gap-2 border-t ${HOST_DIVIDER} px-2`}>
                <span className="truncate">{r.slug}</span>
                <span className="text-muted-foreground">{r.environment}</span>
                <span className={`truncate ${r.ok ? "text-primary" : "text-red-300"}`} title={r.error ?? undefined}>
                  {r.ok ? "Added" : r.error}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <p className="min-h-6 break-all text-primary">{notice}</p>
      <p className="h-6 truncate text-red-300" title={error || undefined}>
        {error}
      </p>
    </div>
  );
}
