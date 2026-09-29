// -----------------------------------------------------------------------------
// Moteur de calcul financier PILOT.
// Règle absolue : c'est le SEUL endroit où ces formules sont écrites.
// Aucun composant ne doit recalculer un total à sa manière.
// -----------------------------------------------------------------------------

import { EXPENSE_ENGAGED_STATUSES, type ExpenseStatus } from "./constants";

export interface ExpenseLike {
  forecastAmountTtc: number;
  actualAmountTtc: number | null;
  status: string;
  payments?: { amount: number }[];
}

export interface RevenueLike {
  forecastAmount: number;
  actualAmount: number | null;
  status: string;
  payments?: { amount: number }[];
}

/** Montant "réel" retenu pour une dépense : le réel s'il est saisi, sinon le prévisionnel. */
export function expenseEffectiveAmount(e: ExpenseLike): number {
  return e.actualAmountTtc ?? e.forecastAmountTtc ?? 0;
}

export function revenueEffectiveAmount(r: RevenueLike): number {
  return r.actualAmount ?? r.forecastAmount ?? 0;
}

/** Somme des paiements effectués sur une dépense (ce qui a réellement été payé). */
export function expensePaid(e: ExpenseLike): number {
  return e.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
}

export function revenueCollected(r: RevenueLike): number {
  return r.payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
}

/** Une dépense est "engagée" dès qu'elle a dépassé le stade de simple estimation/devis. */
export function isExpenseEngaged(e: ExpenseLike): boolean {
  return EXPENSE_ENGAGED_STATUSES.includes(e.status as ExpenseStatus);
}

export interface FinanceSummary {
  expensesForecast: number;
  expensesActual: number;
  expensesEngaged: number;
  expensesPaid: number;
  expensesRemaining: number; // reste à payer
  revenuesForecast: number;
  revenuesActual: number;
  revenuesCollected: number;
  revenuesRemaining: number; // reste à encaisser
  resultForecast: number; // recettes prévisionnelles - dépenses prévisionnelles
  resultActual: number; // encaissé - payé
  marginForecastPct: number; // résultat prévisionnel / recettes prévisionnelles
  marginActualPct: number; // résultat réel / recettes encaissées
}

export function computeFinanceSummary(expenses: ExpenseLike[], revenues: RevenueLike[]): FinanceSummary {
  const expensesForecast = sum(expenses.map((e) => e.forecastAmountTtc ?? 0));
  const expensesActual = sum(expenses.map(expenseEffectiveAmount));
  const expensesEngaged = sum(expenses.filter(isExpenseEngaged).map(expenseEffectiveAmount));
  const expensesPaid = sum(expenses.map(expensePaid));
  const expensesRemaining = Math.max(0, expensesActual - expensesPaid);

  const revenuesForecast = sum(revenues.map((r) => r.forecastAmount ?? 0));
  const revenuesActual = sum(revenues.map(revenueEffectiveAmount));
  const revenuesCollected = sum(revenues.map(revenueCollected));
  const revenuesRemaining = Math.max(0, revenuesActual - revenuesCollected);

  const resultForecast = revenuesForecast - expensesForecast;
  const resultActual = revenuesCollected - expensesPaid;

  const marginForecastPct = revenuesForecast > 0 ? (resultForecast / revenuesForecast) * 100 : 0;
  const marginActualPct = revenuesCollected > 0 ? (resultActual / revenuesCollected) * 100 : 0;

  return {
    expensesForecast,
    expensesActual,
    expensesEngaged,
    expensesPaid,
    expensesRemaining,
    revenuesForecast,
    revenuesActual,
    revenuesCollected,
    revenuesRemaining,
    resultForecast,
    resultActual,
    marginForecastPct,
    marginActualPct,
  };
}

export interface CategoryVariance {
  categoryId: string | null;
  categoryName: string;
  forecast: number;
  actual: number;
  varianceAmount: number;
  variancePct: number;
}

/** Regroupe des dépenses par catégorie et calcule l'écart prévisionnel vs réel. */
export function computeExpenseVarianceByCategory(
  expenses: (ExpenseLike & { categoryId: string | null; categoryName: string })[]
): CategoryVariance[] {
  const map = new Map<string, CategoryVariance>();
  for (const e of expenses) {
    const key = e.categoryId ?? "__none__";
    const existing = map.get(key) ?? {
      categoryId: e.categoryId,
      categoryName: e.categoryName,
      forecast: 0,
      actual: 0,
      varianceAmount: 0,
      variancePct: 0,
    };
    existing.forecast += e.forecastAmountTtc ?? 0;
    existing.actual += expenseEffectiveAmount(e);
    map.set(key, existing);
  }
  const rows = Array.from(map.values());
  for (const row of rows) {
    row.varianceAmount = row.actual - row.forecast;
    row.variancePct = row.forecast > 0 ? (row.varianceAmount / row.forecast) * 100 : row.actual > 0 ? 100 : 0;
  }
  return rows.sort((a, b) => b.actual - a.actual);
}

export function computeRevenueByCategory(
  revenues: (RevenueLike & { categoryId: string | null; categoryName: string })[]
): { categoryId: string | null; categoryName: string; forecast: number; actual: number }[] {
  const map = new Map<string, { categoryId: string | null; categoryName: string; forecast: number; actual: number }>();
  for (const r of revenues) {
    const key = r.categoryId ?? "__none__";
    const existing = map.get(key) ?? { categoryId: r.categoryId, categoryName: r.categoryName, forecast: 0, actual: 0 };
    existing.forecast += r.forecastAmount ?? 0;
    existing.actual += revenueEffectiveAmount(r);
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((a, b) => b.actual - a.actual);
}

/** TTC = HT * (1 + taux TVA / 100). Toujours dériver l'un de l'autre à partir de cette formule. */
export function htToTtc(ht: number, vatRatePct: number): number {
  return round2(ht * (1 + vatRatePct / 100));
}

export function ttcToHt(ttc: number, vatRatePct: number): number {
  return round2(ttc / (1 + vatRatePct / 100));
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function sum(values: number[]): number {
  return round2(values.reduce((a, b) => a + b, 0));
}

/** Coût par participant — uniquement si une fréquentation réelle est renseignée (spec §25). */
export function costPerAttendee(totalActualExpense: number, actualAttendance: number | null | undefined): number | null {
  if (!actualAttendance || actualAttendance <= 0) return null;
  return round2(totalActualExpense / actualAttendance);
}
