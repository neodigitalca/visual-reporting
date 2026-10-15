import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { HOST_SURFACE, MY_SITES_FIELD, MY_SITES_POPOVER } from "@/components/hosting/my-sites/my-sites-theme";
import type { VideoBrief } from "@/lib/video-generator/video-generator-types";
import {
  VIDEO_ASPECTS,
  VIDEO_LENGTH_OPTIONS,
  resolutionsForVideoModel,
  type VideoAspect,
  type VideoLengthSeconds,
  type VideoResolution,
} from "@/lib/video-generator/video-model-defaults";
import { cn } from "@/lib/utils";

type VideoBriefPanelProps = {
  brief: VideoBrief;
  videoModel: string;
  disabled: boolean;
  onPromptChange: (v: string) => void;
  onLengthChange: (v: VideoLengthSeconds) => void;
  onAspectChange: (v: VideoAspect) => void;
  onResolutionChange: (v: VideoResolution) => void;
};

const SELECT_TRIGGER = `${MY_SITES_FIELD} w-44 whitespace-nowrap [&>span]:line-clamp-none [&>svg]:text-muted-foreground`;

export function VideoBriefPanel({
  brief,
  videoModel,
  disabled,
  onPromptChange,
  onLengthChange,
  onAspectChange,
  onResolutionChange,
}: VideoBriefPanelProps) {
  const resolutions = resolutionsForVideoModel(videoModel);
  return (
    <div className="flex flex-col gap-4">
      <div className={cn(HOST_SURFACE, "flex flex-col gap-3 p-4")}>
        <Textarea
          value={brief.prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={disabled}
          rows={6}
          aria-label="Video brief"
          placeholder="Describe the video you want: subject, story, mood, audience, where it will run"
          className={cn(MY_SITES_FIELD, "h-auto min-h-[9rem] resize-y py-2")}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(brief.lengthSeconds)} onValueChange={(v) => onLengthChange(Number(v) as VideoLengthSeconds)} disabled={disabled}>
            <SelectTrigger className={SELECT_TRIGGER} aria-label="Length">
              <SelectValue placeholder="Length" />
            </SelectTrigger>
            <SelectContent className={MY_SITES_POPOVER}>
              {VIDEO_LENGTH_OPTIONS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  Length: {s} s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brief.aspect} onValueChange={(v) => onAspectChange(v as VideoAspect)} disabled={disabled}>
            <SelectTrigger className={SELECT_TRIGGER} aria-label="Aspect ratio">
              <SelectValue placeholder="Aspect ratio" />
            </SelectTrigger>
            <SelectContent className={MY_SITES_POPOVER}>
              {VIDEO_ASPECTS.map((a) => (
                <SelectItem key={a} value={a}>
                  Aspect: {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={brief.resolution} onValueChange={(v) => onResolutionChange(v as VideoResolution)} disabled={disabled}>
            <SelectTrigger className={SELECT_TRIGGER} aria-label="Resolution">
              <SelectValue placeholder="Resolution" />
            </SelectTrigger>
            <SelectContent className={MY_SITES_POPOVER}>
              {resolutions.map((r) => (
                <SelectItem key={r} value={r}>
                  Resolution: {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
