"use client";

import { useState } from "react";
import Image from "next/image";
import { MOT_DE_PASSE_APP, MOT_DE_PASSE_BAR } from "../_lib/config";
import {
  ACCUEIL,
  connecterBar,
  connecterServeur,
  type Role,
} from "../_lib/session";
import { boutons, effetBouton } from "../_lib/styles";

const champ =
  "h-[54px] w-full rounded-[14px] border border-ligne bg-carte px-4 text-[17px] text-texte outline-none focus:border-doux";

const PROFILS: { role: Role; label: string; description: string }[] = [
  { role: "serveur", label: "Serveur", description: "Tables et commandes" },
  { role: "bar", label: "Bar", description: "Préparation et dashboard" },
];

// Écran de connexion : choix du profil, puis prénom + mot de passe (serveur)
// ou mot de passe seul (bar).
export default function ConnexionPage() {
  const [role, setRole] = useState<Role>("serveur");
  const [nom, setNom] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  const changerProfil = (nouveau: Role) => {
    setRole(nouveau);
    setMotDePasse("");
    setErreur("");
  };

  const seConnecter = (e: React.FormEvent) => {
    e.preventDefault();

    if (role === "serveur") {
      if (!nom.trim()) {
        setErreur("Entre ton prénom.");
        return;
      }

      if (motDePasse !== MOT_DE_PASSE_APP) {
        setErreur("Mot de passe incorrect.");
        return;
      }

      connecterServeur(nom.trim());
    } else {
      if (motDePasse !== MOT_DE_PASSE_BAR) {
        setErreur("Mot de passe incorrect.");
        return;
      }

      connecterBar();
    }

    window.location.href = ACCUEIL[role];
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col items-center gap-5">
          <Image
            src="/logo.png"
            alt="Of Course !"
            width={200}
            height={46}
            className="h-auto w-[200px] opacity-90"
            priority
          />

          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-[28px] font-semibold tracking-[-0.03em]">
              Bonsoir
            </h1>
            <p className="text-[15px] text-doux">Qui se connecte ?</p>
          </div>
        </div>

        <form onSubmit={seConnecter} className="flex flex-col gap-4">
          <div role="radiogroup" aria-label="Profil" className="grid grid-cols-2 gap-2">
            {PROFILS.map((profil) => {
              const actif = role === profil.role;

              return (
                <button
                  type="button"
                  key={profil.role}
                  role="radio"
                  aria-checked={actif}
                  onClick={() => changerProfil(profil.role)}
                  className={`flex min-h-[72px] flex-col items-start justify-center gap-0.5 rounded-2xl border px-4 text-left ${effetBouton} ${
                    actif
                      ? "border-texte bg-carte"
                      : "border-ligne bg-transparent"
                  }`}
                >
                  <span className="text-[17px] font-semibold">{profil.label}</span>
                  <span className="text-[13px] text-doux">{profil.description}</span>
                </button>
              );
            })}
          </div>

          {role === "serveur" && (
            <label className="flex flex-col gap-2 text-sm font-medium text-doux">
              Prénom
              <input
                type="text"
                autoComplete="given-name"
                value={nom}
                onChange={(e) => {
                  setNom(e.target.value);
                  setErreur("");
                }}
                className={champ}
              />
            </label>
          )}

          <label className="flex flex-col gap-2 text-sm font-medium text-doux">
            Mot de passe{role === "bar" ? " du bar" : ""}
            <input
              type="password"
              inputMode="numeric"
              value={motDePasse}
              onChange={(e) => {
                setMotDePasse(e.target.value);
                setErreur("");
              }}
              className={champ}
            />
          </label>

          {erreur && (
            <p role="alert" className="text-sm font-medium text-rouge">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            className={`mt-2 h-[54px] text-base ${boutons.principal}`}
          >
            {role === "serveur" ? "Se connecter" : "Ouvrir le bar"}
          </button>
        </form>
      </div>
    </main>
  );
}
