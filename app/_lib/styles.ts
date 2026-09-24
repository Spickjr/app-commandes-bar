// Classes Tailwind partagées entre les pages (couleurs définies dans globals.css).

export const effetBouton =
  "transition duration-150 active:scale-[0.97] active:opacity-80 disabled:opacity-40 disabled:active:scale-100";

const baseBouton = `inline-flex items-center justify-center gap-2 rounded-2xl font-semibold ${effetBouton}`;

export const boutons = {
  // Action principale d'un écran (une seule de préférence).
  principal: `${baseBouton} bg-texte text-fond`,
  secondaire: `${baseBouton} bg-bouton text-texte`,
  danger: `${baseBouton} border border-rouge-bord text-rouge`,
};

export const carte = "rounded-3xl bg-carte";

// Petit libellé en capitales au-dessus des titres.
export const surtitre =
  "text-[13px] font-semibold uppercase tracking-[0.08em] text-doux";
