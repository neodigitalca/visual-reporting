import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HOST_DIVIDER, HOST_SURFACE } from "@/components/hosting/my-sites/my-sites-theme";
import type { ProductLockState, ProductSpec } from "@/lib/video-generator/video-generator-types";
import { VIDEO_ASPECT_BOX_CLASS, type VideoAspect } from "@/lib/video-generator/video-model-defaults";
import { cn } from "@/lib/utils";

type VideoProductPanelProps = {
  aspect: VideoAspect;
  product: ProductLockState;
  disabled: boolean;
  onRegenerateView: (viewId: string) => void;
};

export function VideoProductPanel({ aspect, product, disabled, onRegenerateView }: VideoProductPanelProps) {
  const spec = product.spec;
  return (
    <div className={cn(HOST_SURFACE, "flex flex-col gap-4 p-5")}>
      <div>
        <p className="font-semibold text-white">Product lock</p>
        <p className="text-muted-foreground">
          Four studio views of your product, built from the subject photos. Once locked they become the harness the Director and every storyboard frame follow.
        </p>
      </div>
      {spec ? <ProductSpecSummary spec={spec} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {product.views.map((view) => {
          const spinning = view.status === "generating";
          return (
            <div key={view.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">{view.label}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-base"
                  disabled={disabled || spinning}
                  onClick={() => onRegenerateView(view.id)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                  Regenerate
                </Button>
              </div>
              <div className={cn("relative w-full bg-black", VIDEO_ASPECT_BOX_CLASS[aspect])}>
                {view.imageDataUrl ? (
                  <img src={view.imageDataUrl} alt={view.label} className="absolute inset-0 h-full w-full object-contain" />
                ) : null}
                {spinning ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Generating view" />
                  </span>
                ) : null}
              </div>
              {view.error ? <p className="text-red-300">{view.error}</p> : null}
            </div>
          );
        })}
      </div>
      {product.locked ? (
        <p className={cn("border-t pt-3 text-muted-foreground", HOST_DIVIDER)}>Product locked. These renders are the subject harness for the Director and every storyboard frame.</p>
      ) : null}
    </div>
  );
}

function ProductSpecSummary({ spec }: { spec: ProductSpec }) {
  return (
    <div className={cn("flex flex-col gap-2 border-t pt-4", HOST_DIVIDER)}>
      <p className="font-medium text-foreground">{spec.name}</p>
      <p>{spec.summary}</p>
      <p className="text-muted-foreground">
        {spec.proportions} · {spec.cladding} · {spec.glazing}
      </p>
      {spec.mustNotChange.length ? (
        <ul className="list-inside list-disc text-muted-foreground">
          {spec.mustNotChange.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
