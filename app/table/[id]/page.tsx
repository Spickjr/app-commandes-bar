"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";
import { ItemCommande, useCommandeStore } from "../../_lib/store";
import { CARTE, CATEGORIES, Categorie } from "../../_lib/carte";
import { nomTable } from "../../_lib/config";
import { useServeur } from "../../_lib/session";
import {
  ajouterAuPanier,
  enleverUnDuPanier,
  supprimerDuPanier,
} from "../../_lib/panier";
import { effetBouton } from "../../_lib/styles";
import InfosClient from "../../_components/InfosClient";
import NomBoisson from "../../_components/NomBoisson";
import Panier from "../../_components/Panier";

export default function TablePage() {
  const params = useParams();
  const tableNom = nomTable(params.id as string);

  const serveur = useServeur();
  const [panier, setPanier] = useState<ItemCommande[]>([]);
  const [categorieActive, setCategorieActive] = useState<Categorie>("Bières");

  const ajouterCommande = useCommandeStore((state) => state.ajouterCommande);
  const infosTables = useCommandeStore((state) => state.infosTables);
  const setInfosTable = useCommandeStore((state) => state.setInfosTable);

  const infosExistantes = infosTables[tableNom];

  const envoyerAuBar = async () => {
    if (panier.length === 0) {
      alert("Ajoute au moins une boisson.");
      return;
    }

    await ajouterCommande(tableNom, serveur || "Non renseigné", panier);

    setPanier([]);
    alert("Commande envoyée au bar !");
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <h1 className="text-4xl font-bold mb-4">{tableNom}</h1>

      <p className="text-orange-400 text-lg sm:text-xl mb-6">
        Serveur : {serveur || "Non renseigné"}
      </p>

      <InfosClient
        key={JSON.stringify(infosExistantes ?? null)}
        infos={infosExistantes}
        onEnregistrer={(infos) => setInfosTable(tableNom, infos)}
      />

      <Link
        href="/"
        className={`inline-block mb-8 bg-zinc-700 px-5 py-3 rounded-xl font-bold ${effetBouton}`}
      >
        ← Retour aux tables
      </Link>

      <div className="flex flex-wrap gap-3 mb-8">
        {CATEGORIES.map((categorie) => (
          <button
            type="button"
            key={categorie}
            onClick={() => setCategorieActive(categorie)}
            className={`px-4 py-3 rounded-xl font-bold ${effetBouton} ${
              categorieActive === categorie ? "bg-orange-500" : "bg-zinc-800"
            }`}
          >
            {categorie}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        {CARTE[categorieActive].map((boisson) => (
          <button
            type="button"
            key={boisson.nom}
            onClick={() => setPanier((p) => ajouterAuPanier(p, boisson))}
            className={`bg-orange-500 p-5 sm:p-6 rounded-2xl font-bold ${effetBouton}`}
          >
            <NomBoisson nom={boisson.nom} />

            <div className="text-base sm:text-lg mt-4">{boisson.prix} €</div>
          </button>
        ))}
      </div>

      <Panier
        items={panier}
        onMoins={(nom) => setPanier((p) => enleverUnDuPanier(p, nom))}
        onPlus={(item) => setPanier((p) => ajouterAuPanier(p, item))}
        onSupprimer={(nom) => setPanier((p) => supprimerDuPanier(p, nom))}
        onEnvoyer={envoyerAuBar}
      />
    </main>
  );
}
