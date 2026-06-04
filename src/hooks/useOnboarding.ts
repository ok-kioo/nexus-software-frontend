import { useMemo, useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOnboarding,
  patchOnboarding,
  type OnboardingPatch,
  type OnboardingState,
} from "@/lib/api/onboarding";
import { useAuth } from "@/contexts/AuthContext";
import { getStepsForRole, type OnboardingStep } from "@/data/onboardingSteps";

const QK = ["onboarding", "me"] as const;

const DEFAULT_STATE: OnboardingState = {
  completed_steps: [],
  dismissed: false,
  dismissed_modal: false,
  completed_at: null,
  version: 2,
};

export interface UseOnboardingResult {
  loading: boolean;
  state: OnboardingState | null;
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  percent: number;
  isComplete: boolean;
  isDismissed: boolean;
  showWelcome: boolean;
  running: boolean;
  currentStepIndex: number;
  startTour: (fromStart?: boolean) => void;
  stopTour: () => void;
  skipTour: () => Promise<void>;
  markStep: (stepId: string) => Promise<void>;
  unmarkStep: (stepId: string) => Promise<void>;
  dismissChecklist: () => Promise<void>;
  dismissModal: () => Promise<void>;
  reopenChecklist: () => Promise<void>;
  reset: () => Promise<void>;
}

// Estado global do tour. Sempre inicia em false em load real da página.
let listeners: Array<() => void> = [];
let running = false;
let startAtIndex = -1;

function emit() {
  for (const l of listeners) l();
}

export function useOnboarding(): UseOnboardingResult {
  const { isAuthenticated, role } = useAuth();
  const qc = useQueryClient();
  const [, setTick] = useState(0);

  useEffect(() => {
    const sub = () => setTick((n) => n + 1);
    listeners.push(sub);
    return () => {
      listeners = listeners.filter((l) => l !== sub);
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      try {
        return await fetchOnboarding();
      } catch {
        return DEFAULT_STATE;
      }
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (patch: OnboardingPatch) => patchOnboarding(patch),
    onSuccess: (next) => qc.setQueryData(QK, next),
    onError: () => {
      /* silencioso */
    },
  });

  const steps = useMemo(() => getStepsForRole(role), [role]);
  const validStepIds = useMemo(() => new Set(steps.map((s) => s.id)), [steps]);
  const state = data ?? null;
  // Filtra IDs antigos (não mais existentes para o papel atual).
  const completedSet = new Set(
    (state?.completed_steps ?? []).filter((id) => validStepIds.has(id)),
  );
  const completedCount = steps.filter((s) => completedSet.has(s.id)).length;
  const totalCount = steps.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const isComplete = totalCount > 0 && completedCount >= totalCount;
  const isDismissed = !!state?.dismissed;
  const showWelcome =
    !!state && !state.dismissed_modal && !isComplete && totalCount > 0 && completedCount === 0;

  const firstUncompleted = steps.findIndex((s) => !completedSet.has(s.id));
  const currentStepIndex = firstUncompleted === -1 ? 0 : firstUncompleted;

  const apply = async (patch: OnboardingPatch) => {
    try {
      await mutation.mutateAsync(patch);
    } catch {
      /* silencioso */
    }
  };

  /**
   * Marca um passo como concluído E todos os anteriores na ordem atual.
   * Evita inconsistência em que um passo posterior aparece concluído
   * enquanto um anterior segue pendente.
   */
  const markStep = async (stepId: string) => {
    const idx = steps.findIndex((s) => s.id === stepId);
    if (idx < 0) return;
    const prefixIds = steps.slice(0, idx + 1).map((s) => s.id);
    const existing = (state?.completed_steps ?? []).filter((id) => validStepIds.has(id));
    const next = Array.from(new Set([...existing, ...prefixIds]));
    const willComplete = steps.length > 0 && steps.every((s) => next.includes(s.id));
    await apply({
      completed_steps: next,
      ...(willComplete ? { completed_at: new Date().toISOString() } : {}),
    });
  };

  const unmarkStep = async (stepId: string) => {
    const next = (state?.completed_steps ?? []).filter((s) => s !== stepId);
    await apply({ completed_steps: next, completed_at: null });
  };

  const startTour = useCallback((fromStart = false) => {
    startAtIndex = fromStart ? 0 : -1;
    running = true;
    emit();
  }, []);

  const stopTour = useCallback(() => {
    if (!running) return;
    running = false;
    startAtIndex = -1;
    emit();
  }, []);

  const skipTour = useCallback(async () => {
    running = false;
    startAtIndex = -1;
    emit();
    await apply({ dismissed: true, dismissed_modal: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading: isLoading,
    state,
    steps,
    completedCount,
    totalCount,
    percent,
    isComplete,
    isDismissed,
    showWelcome,
    running,
    currentStepIndex,
    startTour,
    stopTour,
    skipTour,
    markStep,
    unmarkStep,
    dismissChecklist: () => apply({ dismissed: true }),
    dismissModal: () => apply({ dismissed_modal: true }),
    reopenChecklist: () => apply({ dismissed: false, dismissed_modal: true }),
    reset: () => apply({ reset: true }),
  };
}

/** Usado pelo OnboardingTour para saber por qual passo iniciar. */
export function getTourStartIndex(fallback: number): number {
  return startAtIndex === -1 ? fallback : startAtIndex;
}

// Reset em HMR para nunca disparar o tour sem clique explícito.
if (typeof import.meta !== "undefined" && (import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    running = false;
    startAtIndex = -1;
    listeners = [];
  });
}
