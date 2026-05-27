"use client";

import { useState } from "react";

export default function ServeurPage() {
  const [nom, setNom] = useState("");
  const [motDePasse, setMotDePasse] = useState("");

  const MOT_DE_PASSE_APP = "13630";

  const enregistrerServeur = () => {
    if (!nom.trim()) {
      alert("Entre un nom de serveur.");
      return;
    }

    if (motDePasse !== MOT_DE_PASSE_APP) {
      alert("Mot de passe incorrect.");
      return;
    }

    localStorage.setItem("serveur", nom.trim());
    localStorage.setItem("connecte", "oui");

    window.location.href = "/";
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Connexion serveur
        </h1>

        <input
          type="text"
          placeholder="Nom du serveur"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full bg-zinc-800 text-white px-4 py-4 rounded-xl text-xl mb-4"
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="w-full bg-zinc-800 text-white px-4 py-4 rounded-xl text-xl mb-6"
        />

        <button
          type="button"
          onClick={enregistrerServeur}
          className="w-full bg-orange-500 hover:bg-orange-600 py-4 rounded-xl text-xl font-bold"
        >
          Se connecter
        </button>
      </div>
    </main>
  );
}