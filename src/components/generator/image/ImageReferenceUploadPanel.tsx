import { useRef, type ReactNode } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ManualImageReference } from "@/lib/image-generator/manual-reference-upload";

type ImageReferenceUploadPanelProps = {
  manualReferences: ManualImageReference[];
  isPreparingReferences: boolean;
  disabled: boolean;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveReference: (id: string) => void;
};

export function ImageReferenceUploadPanel({
  manualReferences,
  isPreparingReferences,
  disabled,
  onAddFiles,
  onRemoveReference,
}: ImageReferenceUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const controlsDisabled = disabled || isPreparingReferences;

  return (
    <div className="space-y-3 bg-zinc-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-base font-semibold text-foreground">Reference photos</Label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-w-[9.5rem] text-base"
          disabled={controlsDisabled}
          onClick={() => inputRef.current?.click()}
        >
          {isPreparingReferences ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing…
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-4 w-4" />
              Upload images
            </>
          )}
        </Button>
      </div>

      <p className="text-base text-muted-foreground">
        Optional. When you upload references, Google Images research is skipped and these photos
        are sent to the model instead.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        disabled={controlsDisabled}
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) onAddFiles(files);
          event.target.value = "";
        }}
      />

      {manualReferences.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {manualReferences.map((ref) => (
            <UploadTile key={ref.id} fileName={ref.fileName} caption="Manual upload" disabled={controlsDisabled} onRemove={() => onRemoveReference(ref.id)}>
              <img src={ref.dataUrl} alt={`Reference ${ref.fileName}`} className="absolute inset-0 h-full w-full object-contain" />
            </UploadTile>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** One uploaded file: fixed 16:9 media box (children fill it absolutely) over two fixed-height caption lines, so grid rows never shift. */
export function UploadTile({
  fileName,
  caption,
  disabled,
  onRemove,
  children,
}: {
  fileName: string;
  caption: string;
  disabled: boolean;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-2 bg-black p-3">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 z-10 h-8 w-8 text-muted-foreground hover:text-foreground"
        disabled={disabled}
        aria-label={`Remove ${fileName}`}
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
      <div className="relative aspect-video w-full">{children}</div>
      <p className="h-6 truncate leading-6 text-base text-foreground">{fileName}</p>
      <p className="h-6 leading-6 text-base text-muted-foreground">{caption}</p>
    </div>
  );
}
