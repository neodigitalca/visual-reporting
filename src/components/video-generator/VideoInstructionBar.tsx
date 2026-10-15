import { Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MY_SITES_FIELD, MY_SITES_ICON_BTN, MY_SITES_POPOVER } from "@/components/hosting/my-sites/my-sites-theme";
import { cn } from "@/lib/utils";
import type { InstructionScope } from "./useVideoGenerator";

type VideoInstructionBarProps = {
  /** No plan yet, busy, or no scene selected for scene scope. */
  disabled: boolean;
  hasSelectedScene: boolean;
  onSend: (scope: InstructionScope, instruction: string) => void;
};

const SCOPE_TRIGGER = `${MY_SITES_FIELD} w-40 whitespace-nowrap [&>span]:line-clamp-none [&>svg]:text-muted-foreground`;

/** Fixed-height row under the stage: scope select, instruction input, send. Enter submits. */
export function VideoInstructionBar({ disabled, hasSelectedScene, onSend }: VideoInstructionBarProps) {
  const [scope, setScope] = useState<InstructionScope>("scene");
  const [text, setText] = useState("");
  const canSend = !disabled && text.trim().length > 0 && (scope === "video" || hasSelectedScene);
  const submit = () => {
    if (!canSend) return;
    onSend(scope, text);
    setText("");
  };
  return (
    <form
      className="flex h-10 shrink-0 items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Select value={scope} onValueChange={(v) => setScope(v as InstructionScope)} disabled={disabled}>
        <SelectTrigger className={SCOPE_TRIGGER} aria-label="Instruction scope">
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent className={MY_SITES_POPOVER}>
          <SelectItem value="scene">This scene</SelectItem>
          <SelectItem value="video">Whole video</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        aria-label="Instruction for the Director"
        placeholder={scope === "scene" ? "Tell the Director what to change in this scene" : "Tell the Director what to change across the video"}
        className={cn(MY_SITES_FIELD, "flex-1")}
      />
      <Button type="submit" variant="ghost" className={MY_SITES_ICON_BTN} disabled={!canSend} aria-label="Send instruction">
        <Send className="h-4 w-4" aria-hidden />
      </Button>
    </form>
  );
}
