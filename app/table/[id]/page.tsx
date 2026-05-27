"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ItemCommande, useCommandeStore } from "../../store";

export default function TablePage() {
  const params = useParams();
  const tableId = params.id as string;
  const tableNom = `Table ${tableId}`;

  const [serveur, setServeur] = useState("");
  const [commandes, setCommandes] = useState<ItemCommande[]>([]);
  const [categorieActive, setCategorieActive] = useState("Bières");
  const [modeEditionInfos, setModeEditionInfos] = useState(true);

  const ajouterCommande = useCommandeStore((state) => state.ajouterCommande);
  const infosTables = useCommandeStore((state) => state.infosTables);
  const setInfosTable = useCommandeStore((state) => state.setInfosTable);

  const infosExistantes = infosTables[tableNom];

  const [nomClient, setNomClient] = useState("");
  const [telephone, setTelephone] = useState("");
  const [personnes, setPersonnes] = useState(0);
  const [note, setNote] = useState("");

  const effetBouton =
    "transition-all duration-150 active:scale-95 active:opacity-80";

  useEffect(() => {
    setServeur(localStorage.getItem("serveur") || "");
  }, []);

  useEffect(() => {
    if (infosExistantes) {
      setNomClient(infosExistantes.nom || "");
      setTelephone(infosExistantes.telephone || "");
      setPersonnes(infosExistantes.personnes || 0);
      setNote(infosExistantes.note || "");

      const aDesInfos =
        infosExistantes.nom ||
        infosExistantes.telephone ||
        infosExistantes.personnes > 0 ||
        infosExistantes.note;

      setModeEditionInfos(!aDesInfos);
    }
  }, [infosExistantes]);

  const categories = {
    Bières: [
      { nom: "Bière", prix: 3 },
      { nom: "Bière pêche", prix: 3 },
      { nom: "Bière citron", prix: 3 },
      { nom: "Bière fraise", prix: 3 },
      { nom: "Pichet de bière", prix: 15 },
      { nom: "Despé", prix: 5 },
    ],
    Vins: [
      { nom: "Verre de vin blanc", prix: 2 },
      { nom: "Verre de rosé", prix: 2 },
      { nom: "Bouteille de vin blanc", prix: 15 },
      { nom: "Bouteille de rosé", prix: 15 },
    ],
    Champagne: [
      { nom: "Coupe de champagne", prix: 5 },
      { nom: "Bouteille de champagne", prix: 40 },
    ],
    Softs: [
      { nom: "Canette de coca", prix: 2 },
      { nom: "Canette d’Ice Tea", prix: 2 },
      { nom: "Canette de Perrier", prix: 2 },
      { nom: "Bouteille d’eau", prix: 1 },
    ],
    Spiritueux: [
      { nom: "Verre de Get 27", prix: 4 },
      { nom: "Bouteille de Get 27", prix: 40 },
    ],
  };

  const boissons = categories[categorieActive as keyof typeof categories];

  const totalCommande = commandes.reduce(
    (total, item) => total + item.prix * item.quantite,
    0
  );

  const ajouterBoisson = (boisson: { nom: string; prix: number }) => {
    setCommandes((ancienne) => {
      const existe = ancienne.find((item) => item.nom === boisson.nom);

      if (existe) {
        return ancienne.map((item) =>
          item.nom === boisson.nom
            ? { ...item, quantite: item.quantite + 1 }
            : item
        );
      }

      return [...ancienne, { ...boisson, quantite: 1 }];
    });
  };

  const enleverUn = (boisson: string) => {
    setCommandes((ancienne) =>
      ancienne
        .map((item) =>
          item.nom === boisson
            ? { ...item, quantite: item.quantite - 1 }
            : item
        )
        .filter((item) => item.quantite > 0)
    );
  };

  const supprimerBoisson = (boisson: string) => {
    setCommandes((ancienne) =>
      ancienne.filter((item) => item.nom !== boisson)
    );
  };

  const enregistrerInfos = () => {
    setInfosTable(tableNom, {
      nom: nomClient,
      telephone,
      personnes,
      note,
    });

    setModeEditionInfos(false);
  };

  const envoyerAuBar = async () => {
    if (commandes.length === 0) {
      alert("Ajoute au moins une boisson.");
      return;
    }

    await ajouterCommande(tableNom, serveur || "Non renseigné", commandes);

    setCommandes([]);
    alert("Commande envoyée au bar !");
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 sm:p-6">
      <h1 className="text-4xl font-bold mb-4">{tableNom}</h1>

      <p className="text-orange-400 text-lg sm:text-xl mb-6">
        Serveur : {serveur || "Non renseigné"}
      </p>

      <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Infos Client</h2>

          {!modeEditionInfos && (
            <button
              type="button"
              onClick={() => setModeEditionInfos(true)}
              className={`bg-blue-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
            >
              Modifier
            </button>
          )}
        </div>

        {modeEditionInfos ? (
          <div className="grid gap-4">
            <input
              type="text"
              placeholder="Nom du client"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              className="bg-zinc-800 px-4 py-3 rounded-xl"
            />

            <input
              type="text"
              placeholder="Téléphone"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="bg-zinc-800 px-4 py-3 rounded-xl"
            />

            <input
              type="number"
              placeholder="Nombre de personnes"
              value={personnes}
              onChange={(e) => setPersonnes(Number(e.target.value))}
              className="bg-zinc-800 px-4 py-3 rounded-xl"
            />

            <textarea
              placeholder="Note spéciale"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-zinc-800 px-4 py-3 rounded-xl"
            />

            <button
              type="button"
              onClick={enregistrerInfos}
              className={`bg-blue-600 py-3 rounded-xl font-bold ${effetBouton}`}
            >
              Enregistrer les infos
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-lg sm:text-xl">
            <p>Client : {infosExistantes?.nom || "Non renseigné"}</p>
            <p>Téléphone : {infosExistantes?.telephone || "Non renseigné"}</p>
            <p>Personnes : {infosExistantes?.personnes || 0}</p>
            <p>Note : {infosExistantes?.note || "Aucune"}</p>
          </div>
        )}
      </div>

      <Link
        href="/"
        className={`inline-block mb-8 bg-zinc-700 px-5 py-3 rounded-xl font-bold ${effetBouton}`}
      >
        ← Retour aux tables
      </Link>

      <div className="flex flex-wrap gap-3 mb-8">
        {Object.keys(categories).map((categorie) => (
          <button
            type="button"
            key={categorie}
            onClick={() => setCategorieActive(categorie)}
            className={`px-4 py-3 rounded-xl font-bold ${effetBouton} ${
              categorieActive === categorie
                ? "bg-orange-500"
                : "bg-zinc-800"
            }`}
          >
            {categorie}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
        {boissons.map((boisson) => (
          <button
            type="button"
            key={boisson.nom}
            onClick={() => ajouterBoisson(boisson)}
            className={`bg-orange-500 p-5 sm:p-6 rounded-2xl text-xl sm:text-2xl font-bold ${effetBouton}`}
          >
            <div>{boisson.nom}</div>

            <div className="text-base sm:text-lg mt-2">
              {boisson.prix} €
            </div>
          </button>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6">
        <h2 className="text-2xl font-bold mb-4">Commande</h2>

        {commandes.map((item) => (
          <div
            key={item.nom}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-zinc-800 p-4 rounded-xl mb-3"
          >
            <p className="text-lg sm:text-xl break-words">
              • {item.nom} x{item.quantite} —{" "}
              {item.prix * item.quantite} €
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => enleverUn(item.nom)}
                className={`bg-zinc-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
              >
                -
              </button>

              <button
                type="button"
                onClick={() => ajouterBoisson(item)}
                className={`bg-green-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
              >
                +
              </button>

              <button
                type="button"
                onClick={() => supprimerBoisson(item.nom)}
                className={`bg-red-600 px-4 py-2 rounded-xl font-bold ${effetBouton}`}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}

        <div className="mt-6 text-3xl font-bold">
          Total : {totalCommande} €
        </div>

        <button
          type="button"
          onClick={envoyerAuBar}
          className={`mt-6 w-full sm:w-auto bg-green-500 px-6 py-4 rounded-2xl text-xl font-bold ${effetBouton}`}
        >
          Envoyer au bar
        </button>
      </div>
    </main>
  );
}