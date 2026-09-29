"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/utils";

const signupSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "8 caractères minimum"),
});

export interface FormState {
  error?: string;
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Un compte existe déjà avec cet email." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      },
    });
  } catch (error) {
    console.error("Inscription impossible :", error);
    return { error: "Base de données injoignable. Réessaie dans un instant." };
  }

  await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  redirect(safeNextPath(formData.get("next")) ?? "/onboarding");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect(safeNextPath(formData.get("next")) ?? "/org/dashboard");
}

export async function signOutAction() {
  await signOut({ redirect: false });
  redirect("/login");
}
