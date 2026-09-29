// Constantes métier centralisées — labels FR, valeurs stockées en base en anglais/enum stable.

export const ORG_ROLES = ["OWNER", "ADMIN", "MANAGER", "MEMBER", "VIEWER"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Admin",
  MANAGER: "Manager",
  MEMBER: "Membre",
  VIEWER: "Lecteur",
};

export const ORG_ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  OWNER: "Tous les droits, y compris gérer les propriétaires",
  ADMIN: "Gère les membres, les paramètres et les événements",
  MANAGER: "Crée et modifie événements, dépenses, recettes, tâches",
  MEMBER: "Crée et modifie événements, dépenses, recettes, tâches",
  VIEWER: "Consulte tout, sans rien modifier",
};

// Durée de validité d'un lien d'invitation.
export const INVITATION_TTL_DAYS = 7;

// Rôles pouvant écrire (créer/modifier/supprimer) — VIEWER est lecture seule.
export const WRITE_ROLES: OrgRole[] = ["OWNER", "ADMIN", "MANAGER", "MEMBER"];
// Rôles pouvant gérer l'organisation (membres, paramètres, suppression d'événements).
export const ADMIN_ROLES: OrgRole[] = ["OWNER", "ADMIN"];

export const ORGANIZATION_TYPES = [
  "Association",
  "Collectivité",
  "Agence événementielle",
  "Festival",
  "Entreprise",
  "Club",
  "Bar / Restaurant",
  "Lieu événementiel",
  "Producteur",
  "Collectif",
  "Organisateur indépendant",
  "Autre",
] as const;

export const EVENT_TYPES = [
  "Culturel",
  "Festival",
  "Concert",
  "Soirée",
  "Sportif",
  "Associatif",
  "Institutionnel",
  "Corporate",
  "Salon",
  "Conférence",
  "Séminaire",
  "Marché",
  "Privé",
  "Autre",
] as const;

export const EVENT_STATUSES = [
  "BROUILLON",
  "EN_PREPARATION",
  "CONFIRME",
  "EN_COURS",
  "TERMINE",
  "ANNULE",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  BROUILLON: "Brouillon",
  EN_PREPARATION: "En préparation",
  CONFIRME: "Confirmé",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  ANNULE: "Annulé",
};

export const EXPENSE_STATUSES = [
  "ESTIMATION",
  "DEVIS_DEMANDE",
  "DEVIS_RECU",
  "VALIDE",
  "ACOMPTE_PAYE",
  "PARTIELLEMENT_PAYE",
  "PAYE",
  "ANNULE",
] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  ESTIMATION: "Estimation",
  DEVIS_DEMANDE: "Devis demandé",
  DEVIS_RECU: "Devis reçu",
  VALIDE: "Validé",
  ACOMPTE_PAYE: "Acompte payé",
  PARTIELLEMENT_PAYE: "Partiellement payé",
  PAYE: "Payé",
  ANNULE: "Annulé",
};

// Statuts à partir desquels une dépense est considérée "engagée"
export const EXPENSE_ENGAGED_STATUSES: ExpenseStatus[] = [
  "VALIDE",
  "ACOMPTE_PAYE",
  "PARTIELLEMENT_PAYE",
  "PAYE",
];

export const REVENUE_STATUSES = [
  "PREVU",
  "CONFIRME",
  "PARTIELLEMENT_ENCAISSE",
  "ENCAISSE",
  "ANNULE",
] as const;
export type RevenueStatus = (typeof REVENUE_STATUSES)[number];

export const REVENUE_STATUS_LABELS: Record<RevenueStatus, string> = {
  PREVU: "Prévu",
  CONFIRME: "Confirmé",
  PARTIELLEMENT_ENCAISSE: "Partiellement encaissé",
  ENCAISSE: "Encaissé",
  ANNULE: "Annulé",
};

export const TASK_PRIORITIES = ["FAIBLE", "NORMALE", "HAUTE", "URGENTE"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  FAIBLE: "Faible",
  NORMALE: "Normale",
  HAUTE: "Haute",
  URGENTE: "Urgente",
};

export const TASK_STATUSES = ["A_FAIRE", "EN_COURS", "TERMINE", "BLOQUE"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  BLOQUE: "Bloqué",
};

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Location",
  "Technique",
  "Personnel",
  "Sécurité",
  "Communication",
  "Transport",
  "Hébergement",
  "Restauration",
  "Animation / intervenants",
  "Assurance",
  "Administratif",
  "Logistique",
  "Décoration",
  "Droits / licences",
  "Divers",
];

export const DEFAULT_REVENUE_CATEGORIES = [
  "Billetterie externe",
  "Sponsoring",
  "Subvention",
  "Partenariat",
  "Bar / restauration",
  "Location",
  "Participation",
  "Vente",
  "Autre",
];

export const DOCUMENT_TYPES = [
  "Devis",
  "Facture",
  "Contrat",
  "Convention",
  "Assurance",
  "Autorisation",
  "Plan",
  "Licence",
  "Bon de commande",
  "Justificatif",
  "Autre",
];

export const CONTRIBUTOR_TYPES = [
  "Artiste",
  "DJ",
  "Musicien",
  "Conférencier",
  "Animateur",
  "Speaker",
  "Performer",
  "Sportif",
  "Formateur",
  "Personnalité",
  "Autre",
];

export const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Business",
};
