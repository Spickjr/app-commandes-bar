"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ItemCommande, useCommandeStore } from "../../_lib/store";
import { CARTE, CATEGORIES, Categorie } from "../../_lib/carte";
import { nomTable } from "../../_lib/config";
import { useServeur } from "../../_lib/session";
import { ajouterAuPanier, enleverUnDuPanier } from "../../_lib/panier";
import { STYLE_ETAT, etatTable } from "../../_lib/tables";
import { effetBouton } from "../../_lib/styles";
import { IconeRetour } from "../../_components/Icones";
import InfosClient from "../../_components/InfosClient";
import NomBoisson from "../../_components/NomBoisson";
import Panier from "../../_components/Panier";

export default function TablePage() {
  const params = useParams();
  const tableNom = nomTable(params.id as string);

  const serveur = useServeur();
  const [panier, setPanier] = useState<ItemCommande[]>([]);
  const [categorieActive, setCategorieActive] = useState<Categorie>("Bières");
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [erreurEnvoi, setErreurEnvoi] = useState(false);

  const ajouterCommande = useCommandeStore((state) => state.ajouterCommande);
  const infosTables = useCommandeStore((state) => state.infosTables);
  const statutsTables = useCommandeStore((state) => state.statutsTables);
  const commandesBar = useCommandeStore((state) => state.commandesBar);
  const setInfosTable = useCommandeStore((state) => state.setInfosTable);

  // Le message "Commande envoyée" disparaît tout seul.
  useEffect(() => {
    if (!confirmation) return;
    const minuteur = setTimeout(() => setConfirmation(false), 2500);
    return () => clearTimeout(minuteur);
  }, [confirmation]);

  const infosExistantes = infosTables[tableNom];

  const etat = etatTable(
    statutsTables[tableNom],
    commandesBar.find((commande) => commande.table === tableNom)
  );

  const quantites = Object.fromEntries(
    panier.map((item) => [item.nom, item.quantite])
  );

  const envoyerAuBar = async () => {
    if (panier.length === 0 || envoiEnCours) return;

    setEnvoiEnCours(true);
    setErreurEnvoi(false);

    try {
      await ajouterCommande(tableNom, serveur || "Non renseigné", panier);
      setPanier([]);
      setConfirmation(true);
    } catch {
      // Le panier est gardé : il suffit de réappuyer sur "Envoyer au bar".
      setErreurEnvoi(true);
    } finally {
      setEnvoiEnCours(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5">
      <div className="flex grow flex-col gap-3.5 pt-5">
        <Link
          href="/"
          className="-ml-1 inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-medium text-doux hover:text-texte"
        >
          <IconeRetour taille={20} />
          Tables
        </Link>

        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.03em]">
            {tableNom}
          </h1>

          {etat !== "libre" && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE_ETAT[etat].pastille}`}
            >
              {STYLE_ETAT[etat].label}
            </span>
          )}
        </div>

        <InfosClient
          key={JSON.stringify(infosExistantes ?? null)}
          infos={infosExistantes}
          onEnregistrer={(infos) => setInfosTable(tableNom, infos)}
        />

        <div className="-mx-5 mt-1 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {CATEGORIES.map((categorie) => (
            <button
              type="button"
              key={categorie}
              onClick={() => setCategorieActive(categorie)}
              aria-pressed={categorieActive === categorie}
              className={`h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-sm ${effetBouton} ${
                categorieActive === categorie
                  ? "bg-texte font-semibold text-fond"
                  : "bg-carte font-medium text-doux"
              }`}
            >
              {categorie}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CARTE[categorieActive].map((boisson) => {
            const quantite = quantites[boisson.nom];

            return (
              <button
                type="button"
                key={boisson.nom}
                onClick={() => setPanier((p) => ajouterAuPanier(p, boisson))}
                className={`relative flex min-h-28 flex-col justify-between gap-3 rounded-[20px] border bg-carte p-4 text-left ${effetBouton} ${
                  quantite ? "border-[#6b6b75]" : "border-transparent"
                }`}
              >
                {quantite && (
                  <span className="absolute right-3 top-3 flex size-[26px] items-center justify-center rounded-full bg-texte text-[13px] font-bold text-fond">
                    {quantite}
                  </span>
                )}

                <span className={quantite ? "pr-7" : ""}>
                  <NomBoisson nom={boisson.nom} />
                </span>

                <span className="text-[15px] font-medium text-clair">
                  {boisson.prix} €
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Panier
        items={panier}
        envoiEnCours={envoiEnCours}
        onMoins={(nom) => setPanier((p) => enleverUnDuPanier(p, nom))}
        onPlus={(item) => setPanier((p) => ajouterAuPanier(p, item))}
        onEnvoyer={envoyerAuBar}
      />

      {erreurEnvoi && (
        <div
          role="alert"
          className="fixed inset-x-5 top-5 z-30 mx-auto max-w-sm rounded-2xl border border-rouge-bord bg-carte px-5 py-3 text-center text-[15px] font-semibold text-rouge shadow-xl shadow-black/40"
        >
          Commande non envoyée : vérifie le réseau et réessaie.
        </div>
      )}

      {confirmation && (
        <div
          role="status"
          className="fixed inset-x-0 top-5 z-30 mx-auto w-fit rounded-full bg-sauge-fond px-5 py-3 text-[15px] font-semibold text-sauge shadow-xl shadow-black/40"
        >
          Commande envoyée au bar
        </div>
      )}
    </main>
  );
}
