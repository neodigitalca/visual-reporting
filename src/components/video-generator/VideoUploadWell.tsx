import { useRef, type DragEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadTile } from "@/components/generator/image/ImageReferenceUploadPanel";
import { HOST_SURFACE } from "@/components/hosting/my-sites/my-sites-theme";
import { cn } from "@/lib/utils";

export type SidebarUpload = {
  id: string;
  fileName: string;
  caption: string;
  src: string;
  kind: "image" | "video";
  onRemove: () => void;
};

type VideoUploadWellProps = {
  label: string;
  accept: string;
  isPreparing: boolean;
  disabled: boolean;
  uploads: SidebarUpload[];
  onAddFiles: (files: FileList | File[]) => void;
};

/** Left-column upload field: drop or pick files, then every upload as a fixed 16:9 tile below it. Lives where the scenes appear later. */
export function VideoUploadWell({ label, accept, isPreparing, disabled, uploads, onAddFiles }: VideoUploadWellProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const controlsDisabled = disabled || isPreparing;
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!controlsDisabled && event.dataTransfer.files.length) onAddFiles(event.dataTransfer.files);
  };
  return (
    <div className="flex flex-col gap-3" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className={cn(HOST_SURFACE, "flex flex-col gap-2 p-3")}>
        <p className="text-base font-semibold text-foreground">{label}</p>
        <Button type="button" variant="secondary" size="sm" className="w-full text-base" disabled={controlsDisabled} onClick={() => inputRef.current?.click()}>
          {isPreparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {isPreparing ? "Preparing" : "Drop or upload files"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          disabled={controlsDisabled}
          onChange={(event) => {
            const files = event.target.files;
            if (files?.length) onAddFiles(files);
            event.target.value = "";
          }}
        />
      </div>
      {uploads.map((u) => (
        <UploadTile key={u.id} fileName={u.fileName} caption={u.caption} disabled={controlsDisabled} onRemove={u.onRemove}>
          {u.kind === "video" ? (
            <video src={u.src} muted playsInline controls className="absolute inset-0 h-full w-full object-contain" />
          ) : (
            <img src={u.src} alt={u.fileName} className="absolute inset-0 h-full w-full object-contain" />
          )}
        </UploadTile>
      ))}
    </div>
  );
}
