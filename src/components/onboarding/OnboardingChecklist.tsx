import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, ArrowRight, Sparkles, Compass } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

interface Props {
  /** Hide the card after completion. Defaults to true. */
  autoHideWhenComplete?: boolean;
}

export function OnboardingChecklist({ autoHideWhenComplete = true }: Props) {
  const navigate = useNavigate();
  const {
    state,
    steps,
    completedCount,
    totalCount,
    percent,
    isComplete,
    isDismissed,
    markStep,
    unmarkStep,
    dismissChecklist,
    skipTour,
    startTour,
  } = useOnboarding();

  if (!state || steps.length === 0) return null;
  if (isDismissed) return null;
  if (autoHideWhenComplete && isComplete) return null;

  const completed = new Set(state.completed_steps);

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Primeiros passos no Nexus</CardTitle>
          </div>
          <CardDescription className="mt-1">
            {isComplete
              ? "Você concluiu o tour inicial."
              : `Conclua as etapas para configurar a plataforma (${completedCount}/${totalCount}).`}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Dispensar"
          onClick={() => dismissChecklist()}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percent} className="h-2" />
        {!isComplete && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => startTour(false)}>
              <Compass className="h-4 w-4 mr-1.5" />
              {completedCount === 0 ? "Iniciar tour guiado" : "Retomar tour guiado"}
            </Button>
            <Button size="sm" variant="ghost" className="sm:w-auto" onClick={() => skipTour()}>
              Dispensar tour
            </Button>
          </div>
        )}
        <ul className="space-y-2">
          {steps.map((step) => {
            const done = completed.has(step.id);
            return (
              <li
                key={step.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  done ? "bg-muted/40 border-border" : "border-border hover:bg-muted/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => (done ? unmarkStep(step.id) : markStep(step.id))}
                  aria-label={done ? "Desmarcar etapa" : "Marcar como concluída"}
                  className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition-colors ${
                    done
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {done && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      done ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                {step.route && !done && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-primary"
                    onClick={() => navigate(step.route!)}
                  >
                    {step.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
