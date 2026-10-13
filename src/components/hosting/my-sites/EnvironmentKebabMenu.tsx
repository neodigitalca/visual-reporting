import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HostedEnvironment } from "@/lib/hosting-api";

export type EnvironmentAction = "backup" | "cache-clear" | "redeploy" | "retry-provision" | "delete" | "copy";

export type EnvironmentKebabMenuProps = {
  env: HostedEnvironment;
  canAdmin: boolean;
  onAction: (action: EnvironmentAction, env: HostedEnvironment) => void;
};

export function EnvironmentKebabMenu({ env, canAdmin, onAction }: EnvironmentKebabMenuProps) {
  const provisioned = Boolean(env.renderServiceId);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-8 w-8 shrink-0 rounded-none p-0 text-muted-foreground hover:bg-zinc-800 hover:text-foreground"
          aria-label={`Actions for ${env.slug}`}
        >
          <MoreVertical className="h-4 w-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-none border-0 bg-zinc-900 text-base">
        <DropdownMenuItem asChild disabled={!env.wpAdminUrl}>
          <a href={env.wpAdminUrl ?? "#"} target="_blank" rel="noreferrer">
            WP Admin
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={!env.siteUrl}>
          <a href={env.siteUrl ?? "#"} target="_blank" rel="noreferrer">
            Visit site
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem disabled={!canAdmin} onSelect={() => onAction("copy", env)}>
          Copy environment
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canAdmin || !provisioned} onSelect={() => onAction("backup", env)}>
          Backup now
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canAdmin || !provisioned} onSelect={() => onAction("cache-clear", env)}>
          Clear cache
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canAdmin || !provisioned} onSelect={() => onAction("redeploy", env)}>
          Redeploy
        </DropdownMenuItem>
        {!provisioned ? (
          <DropdownMenuItem disabled={!canAdmin || env.status === "provisioning"} onSelect={() => onAction("retry-provision", env)}>
            Retry provision
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem disabled={!canAdmin} className="text-red-300 focus:text-red-200" onSelect={() => onAction("delete", env)}>
          Delete environment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
