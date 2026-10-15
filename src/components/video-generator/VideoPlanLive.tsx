import { useEffect, useRef } from "react";
import { HOST_SURFACE } from "@/components/hosting/my-sites/my-sites-theme";
import type { OpenRouterAppStreamDelta } from "@/lib/openrouter-app-api";
import { cn } from "@/lib/utils";

/** The Director's text as it streams in: thinking in muted type, then the plan JSON. Fixed height, scrolls to the newest line. */
export function VideoPlanLive({ live }: { live: OpenRouterAppStreamDelta }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [live.reasoning.length, live.content.length]);
  return (
    <div className={cn(HOST_SURFACE, "flex h-[40rem] flex-col")}>
      <p className="flex h-12 shrink-0 items-center px-5 text-muted-foreground">
        Director is writing the scene plan
        <span className="ml-auto tabular-nums">{(live.reasoning.length + live.content.length).toLocaleString()} chars</span>
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <pre className="whitespace-pre-wrap break-words font-sans text-base text-muted-foreground">{live.reasoning}</pre>
        <pre className="whitespace-pre-wrap break-words font-mono text-base text-foreground">{live.content}</pre>
        <div ref={endRef} />
      </div>
    </div>
  );
}
