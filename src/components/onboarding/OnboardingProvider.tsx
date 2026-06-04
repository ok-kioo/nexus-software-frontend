import { WelcomeDialog } from "./WelcomeDialog";
import { OnboardingTour } from "./OnboardingTour";

/**
 * Mounts onboarding-wide UI (welcome dialog + guided tour overlay).
 * Place inside the authenticated layout so it runs only for logged users.
 */
export function OnboardingProvider() {
  return (
    <>
      <WelcomeDialog />
      <OnboardingTour />
    </>
  );
}
