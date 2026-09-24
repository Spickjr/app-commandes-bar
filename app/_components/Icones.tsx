// Icônes au trait (style de la maquette), colorées par `currentColor`.

type Props = { taille?: number };

const Svg = ({
  taille = 22,
  children,
  epaisseur = 1.8,
}: Props & { children: React.ReactNode; epaisseur?: number }) => (
  <svg
    width={taille}
    height={taille}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={epaisseur}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const IconeTables = (p: Props) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7" height="7" rx="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" />
  </Svg>
);

export const IconeCommandes = (p: Props) => (
  <Svg {...p}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
  </Svg>
);

export const IconeDashboard = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20V11" />
    <path d="M10 20V5" />
    <path d="M16 20v-6" />
    <path d="M21 20H3" />
  </Svg>
);

export const IconeRetour = (p: Props) => (
  <Svg {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Svg>
);

export const IconeChevron = (p: Props) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconeMoins = (p: Props) => (
  <Svg {...p} epaisseur={2}>
    <path d="M6 12h12" />
  </Svg>
);

export const IconePlus = (p: Props) => (
  <Svg {...p} epaisseur={2}>
    <path d="M6 12h12" />
    <path d="M12 6v12" />
  </Svg>
);

export const IconePoubelle = (p: Props) => (
  <Svg {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
  </Svg>
);

export const IconeTelecharger = (p: Props) => (
  <Svg {...p}>
    <path d="M12 4v11" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 20h14" />
  </Svg>
);
