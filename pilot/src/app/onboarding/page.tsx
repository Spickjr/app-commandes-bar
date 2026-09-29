import { redirect } from "next/navigation";
import { requireUser, getCurrentOrgContext } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  await requireUser();
  const ctx = await getCurrentOrgContext();
  if (ctx) redirect("/org/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-lg font-semibold">Bienvenue sur PILOT</h1>
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Parlez-nous de votre structure pour configurer votre espace.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
