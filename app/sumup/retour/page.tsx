"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCommandeStore } from "../../_lib/store";
import { formatEuros, lireMontant } from "../../_lib/argent";
import { boutons } from "../../_lib/styles";

type Resultat =
  | { etat: "attente" }
  | { etat: "ok"; table: string; montant: number }
  | { etat: "echec"; table: string; message: string };

const CLE_TRAITES = "sumup-traites";

// Page ouverte par l'app SumUp après un paiement : enregistre le paiement CB
// (une seule fois par référence) puis renvoie vers la table.
export default function RetourSumUp() {
  const encaisser = useCommandeStore((state) => state.encaisser);
  const [resultat, setResultat] = useState<Resultat>({ etat: "attente" });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const table = p.get("table") || "";
    const montant = lireMontant(p.get("montant") || "");
    const serveur = p.get("serveur") || "SumUp";
    const reference = p.get("ref") || p.get("foreign-tx-id") || "";
    const statut = p.get("smp-status");

    const traiter = async () => {
      if (statut !== "success") {
        setResultat({
          etat: "echec",
          table,
          message:
            statut === "failed"
              ? "Le paiement a été refusé ou annulé dans SumUp."
              : "SumUp n’a pas confirmé le paiement.",
        });
        return;
      }

      if (!table || !(montant > 0)) {
        setResultat({ etat: "echec", table, message: "Informations de paiement incomplètes." });
        return;
      }

      // Déjà enregistré (page rechargée, double retour…) : on ne recompte pas.
      let traites: string[] = [];
      try {
        traites = JSON.parse(localStorage.getItem(CLE_TRAITES) || "[]");
      } catch {}

      if (!reference || !traites.includes(reference)) {
        try {
          localStorage.setItem(
            CLE_TRAITES,
            JSON.stringify([...traites, reference].slice(-50))
          );
        } catch {}

        const ok = await encaisser(table, montant, "cb", serveur);

        if (!ok) {
          setResultat({
            etat: "echec",
            table,
            message: `Paiement SumUp réussi, mais pas enregistré dans l’app : ajoute ${formatEuros(montant)} en CB à la main.`,
          });
          return;
        }
      }

      setResultat({ etat: "ok", table, montant });
    };

    traiter();
  }, [encaisser]);

  const numero =
    resultat.etat !== "attente" ? resultat.table.replace(/\D/g, "") : "";

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        {resultat.etat === "attente" && (
          <p className="text-[17px] text-doux">Enregistrement du paiement…</p>
        )}

        {resultat.etat === "ok" && (
          <>
            <span className="rounded-full bg-sauge/15 px-3 py-1 text-sm font-semibold text-sauge">
              Paiement SumUp validé
            </span>
            <h1 className="text-[32px] font-semibold tracking-[-0.03em]">
              {formatEuros(resultat.montant)}
            </h1>
            <p className="text-[15px] text-doux">
              Enregistré en CB sur la {resultat.table.toLowerCase()}.
            </p>
          </>
        )}

        {resultat.etat === "echec" && (
          <>
            <span className="rounded-full bg-rouge/15 px-3 py-1 text-sm font-semibold text-rouge">
              Paiement non enregistré
            </span>
            <p className="text-[15px] text-doux">{resultat.message}</p>
          </>
        )}

        {resultat.etat !== "attente" && (
          <Link
            href={numero ? `/table/${numero}` : "/"}
            className={`h-[54px] w-full text-base ${boutons.principal}`}
          >
            Retour à la table
          </Link>
        )}
      </div>
    </main>
  );
}
