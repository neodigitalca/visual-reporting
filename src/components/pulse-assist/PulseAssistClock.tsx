import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatEdmontonCalendarTooltip } from "@/lib/edmonton-time";
import { cn } from "@/lib/utils";

type PulseAssistClockProps = {
  className?: string;
};

export function PulseAssistClock({ className }: PulseAssistClockProps) {
  const [tooltip, setTooltip] = useState(() => formatEdmontonCalendarTooltip());

  useEffect(() => {
    setTooltip(formatEdmontonCalendarTooltip());
    const id = window.setInterval(() => setTooltip(formatEdmontonCalendarTooltip()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "pulse-assist-panel-header__icon-btn pulse-assist-clock shrink-0 text-white",
            className,
          )}
          aria-label={tooltip}
        >
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-none text-base">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
