import type { HostedEnvironment } from "@/lib/hosting-api";
import type { TeamMember } from "@/lib/teams-types";
import { SiteUsersPanel } from "../my-sites/SiteUsersPanel";
import { PROFILE_CARD_HEAD, PROFILE_CARD_TITLE } from "./site-profile-theme";

export type SiteUsersSectionProps = {
  env: HostedEnvironment;
  teamMembers: TeamMember[];
  canAdmin: boolean;
};

export function SiteUsersSection({ env, teamMembers, canAdmin }: SiteUsersSectionProps) {
  return (
    <section className="flex flex-col gap-2" aria-label="Users">
      <div className={PROFILE_CARD_HEAD}>
        <h2 className={PROFILE_CARD_TITLE}>Users</h2>
      </div>
      {env.renderServiceId ? (
        <SiteUsersPanel key={env.id} env={env} teamMembers={teamMembers} canAdmin={canAdmin} listClassName="min-h-[14rem]" />
      ) : (
        <div className="flex min-h-[14rem] items-center justify-center bg-zinc-900/60 text-muted-foreground">Users are available once this environment is provisioned.</div>
      )}
    </section>
  );
}
