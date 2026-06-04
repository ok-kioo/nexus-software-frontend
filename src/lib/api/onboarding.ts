import { apiRequest } from "./client";
export interface OnboardingState {
  completed_steps: string[];
  dismissed: boolean;
  dismissed_modal: boolean;
  completed_at: string | null;
  version: number;
}
export type OnboardingPatch = Partial<OnboardingState> & { reset?: boolean };
export function fetchOnboarding() {
  return apiRequest<OnboardingState>("/v1/users/me/onboarding");
}
export function patchOnboarding(patch: OnboardingPatch) {
  return apiRequest<OnboardingState>("/v1/users/me/onboarding", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}