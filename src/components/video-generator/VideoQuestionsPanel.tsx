import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HOST_SURFACE, MY_SITES_FIELD } from "@/components/hosting/my-sites/my-sites-theme";
import type { VideoClarifyQuestion } from "@/lib/video-generator/video-generator-types";
import { cn } from "@/lib/utils";

type VideoQuestionsPanelProps = {
  /** null while the Director is still reading the brief: four placeholder cards keep the layout fixed. */
  questions: VideoClarifyQuestion[] | null;
  answers: Record<string, string>;
  disabled: boolean;
  onAnswer: (id: string, value: string) => void;
};

const PLACEHOLDER_CARDS = 4;

/** Director's multiple-choice questions, each with a blank row for the user's own answer. */
export function VideoQuestionsPanel({ questions, answers, disabled, onAnswer }: VideoQuestionsPanelProps) {
  if (!questions) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
          <div key={i} className={cn(HOST_SURFACE, "min-h-[14rem] p-4 text-muted-foreground")}>
            {i === 0 ? "Director is reading the brief" : ""}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {questions.map((q, qi) => {
        const answer = answers[q.id] ?? "";
        const custom = answer !== "" && !q.options.includes(answer) ? answer : "";
        return (
          <div key={q.id} className={cn(HOST_SURFACE, "flex min-h-[14rem] flex-col gap-3 p-4")}>
            <p className="font-semibold text-white">
              <span className="tabular-nums text-muted-foreground">{qi + 1}.</span> {q.text}
            </p>
            <RadioGroup value={answer} onValueChange={(v) => onAnswer(q.id, v)} disabled={disabled} className="gap-2">
              {q.options.map((opt, oi) => {
                const id = `${q.id}-${oi}`;
                return (
                  <div key={id} className="flex items-center gap-3 bg-zinc-900 px-3 py-2">
                    <RadioGroupItem id={id} value={opt} />
                    <Label htmlFor={id} className="cursor-pointer text-base font-normal text-foreground">
                      {opt}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
            <Input
              value={custom}
              onChange={(e) => onAnswer(q.id, e.target.value)}
              disabled={disabled}
              aria-label={`Your own answer to question ${qi + 1}`}
              placeholder="Your own answer"
              className={cn(MY_SITES_FIELD, "text-base", custom && "ring-1 ring-primary/60")}
            />
          </div>
        );
      })}
    </div>
  );
}
