"use client";

import { useState } from "react";
import Image from "next/image";
import { MOT_DE_PASSE_APP } from "../_lib/config";
import { connecterServeur } from "../_lib/session";
import { boutons } from "../_lib/styles";

const champ =
  "h-[54px] w-full rounded-[14px] border border-ligne bg-carte px-4 text-[17px] text-texte outline-none focus:border-doux";

export default function ServeurPage() {
  const [nom, setNom] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");

  const enregistrerServeur = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim()) {
      setErreur("Entre ton prénom.");
      return;
    }

    if (motDePasse !== MOT_DE_PASSE_APP) {
      setErreur("Mot de passe incorrect.");
      return;
    }

    connecterServeur(nom.trim());

    window.location.href = "/";
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
            <p className="text-[15px] text-doux">
              Connecte-toi pour prendre les commandes.
            </p>
          </div>
        </div>

        <form onSubmit={enregistrerServeur} className="flex flex-col gap-4">
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

          <label className="flex flex-col gap-2 text-sm font-medium text-doux">
            Mot de passe
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

          <button type="submit" className={`mt-2 h-[54px] text-base ${boutons.principal}`}>
            Se connecter
          </button>
        </form>
      </div>
    </main>
  );
}
