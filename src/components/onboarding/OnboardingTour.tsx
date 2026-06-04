import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Joyride, { type CallBackProps, STATUS, EVENTS, ACTIONS, type Step } from "react-joyride";
import { useLocation, useNavigate } from "react-router-dom";
import { useOnboarding, getTourStartIndex } from "@/hooks/useOnboarding";

/**
 * Espera o seletor aparecer no DOM (MutationObserver com timeout).
 */
function waitForElement(selector: string, timeoutMs = 4000): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve(true);
    const obs = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        obs.disconnect();
        resolve(true);
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      obs.disconnect();
      resolve(!!document.querySelector(selector));
    }, timeoutMs);
  });
}

export function OnboardingTour() {
  const { steps, running, stopTour, skipTour, markStep, currentStepIndex } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetReady, setTargetReady] = useState(false);
  const wasRunningRef = useRef(false);
  const lastNavigatedRef = useRef<string | null>(null);
  // Bump para forçar Joyride a re-resolver targets quando o DOM mudar.
  const [targetsTick, setTargetsTick] = useState(0);

  // Inicialização: só roda quando o tour vira running (transição false->true).
  useEffect(() => {
    if (running && !wasRunningRef.current) {
      const start = getTourStartIndex(currentStepIndex);
      const clamped = Math.max(0, Math.min(start, Math.max(0, steps.length - 1)));
      setStepIndex(clamped);
      setTargetReady(false);
      lastNavigatedRef.current = null;
    }
    if (!running && wasRunningRef.current) {
      setTargetReady(false);
      lastNavigatedRef.current = null;
    }
    wasRunningRef.current = running;
    // Não dependemos de currentStepIndex aqui — evita resetar o stepIndex
    // sempre que markStep concluído atualizar o "primeiro não concluído".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Garante navegação + presença do alvo antes de mostrar o passo atual.
  useEffect(() => {
    if (!running || steps.length === 0) return;
    const step = steps[stepIndex];
    if (!step) return;
    let cancelled = false;

    (async () => {
      if (step.route && location.pathname !== step.route) {
        if (lastNavigatedRef.current !== step.route) {
          lastNavigatedRef.current = step.route;
          setTargetReady(false);
          navigate(step.route);
        }
        return; // efeito reentra quando location mudar
      }
      lastNavigatedRef.current = location.pathname;

      if (step.target) {
        setTargetReady(false);
        const found = await waitForElement(step.target);
        if (cancelled) return;
        setTargetsTick((t) => t + 1);
        setTargetReady(true);
        if (!found) {
          // Sem destino — Joyride cairá em "body"/center.
        }
      } else {
        setTargetReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepIndex, location.pathname, steps]);

  const joyrideSteps: Step[] = useMemo(
    () =>
      steps.map((s) => {
        const hasTarget = !!s.target && !!document.querySelector(s.target);
        const target = hasTarget ? (s.target as string) : "body";
        return {
          target,
          title: s.title,
          content: s.description,
          placement: hasTarget ? (s.placement ?? "auto") : "center",
          disableBeacon: true,
          spotlightClicks: !!s.spotlightClicks,
        };
      }),
    // Recalcula quando o conjunto de passos muda OU quando algum target apareceu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [steps, targetsTick],
  );

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, type, index, action } = data;

      // Skip/Close = sair de vez (persiste).
      if (action === ACTIONS.SKIP || status === STATUS.SKIPPED) {
        void skipTour();
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        const finished = steps[index];
        if (finished) void markStep(finished.id);

        if (action === ACTIONS.PREV) {
          setStepIndex(Math.max(0, index - 1));
          setTargetReady(false);
        } else if (action === ACTIONS.NEXT) {
          if (index + 1 < steps.length) {
            setStepIndex(index + 1);
            setTargetReady(false);
          } else {
            stopTour();
          }
        } else if (action === ACTIONS.CLOSE) {
          // Fechou no X — encerra sem dispensar permanentemente
          stopTour();
        }
      }

      if (status === STATUS.FINISHED) {
        stopTour();
      }
    },
    [markStep, steps, stopTour, skipTour],
  );

  if (!running || steps.length === 0) return null;

  return (
    <Joyride
      steps={joyrideSteps}
      stepIndex={stepIndex}
      run={running && targetReady}
      continuous
      showProgress
      showSkipButton
      disableScrolling={false}
      scrollToFirstStep
      disableCloseOnEsc
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        open: "Abrir dica",
        skip: "Pular tour",
        nextLabelWithProgress: "Próximo ({step} de {steps})",
      }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--card))",
          arrowColor: "hsl(var(--card))",
          overlayColor: "hsla(0, 0%, 0%, 0.55)",
          zIndex: 10000,
        },
        tooltip: { borderRadius: 12, padding: 16 },
        tooltipTitle: { fontSize: 15, fontWeight: 600 },
        tooltipContent: { fontSize: 13, lineHeight: 1.5 },
        buttonNext: { borderRadius: 8, padding: "8px 14px" },
        buttonBack: { color: "hsl(var(--muted-foreground))" },
        buttonSkip: { color: "hsl(var(--muted-foreground))" },
      }}
    />
  );
}
