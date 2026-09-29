// Tests exécutables sans framework externe (node:assert) — utile car npm install
// n'est pas nécessaire pour valider la logique métier pure.
// Lancer : npx tsx src/lib/finance.test.ts

import assert from "node:assert";
import {
  computeFinanceSummary,
  computeExpenseVarianceByCategory,
  htToTtc,
  ttcToHt,
  costPerAttendee,
  round2,
} from "./finance";

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    throw err;
  }
}

test("htToTtc / ttcToHt sont réciproques", () => {
  const ht = 1000;
  const ttc = htToTtc(ht, 20);
  assert.strictEqual(ttc, 1200);
  assert.strictEqual(ttcToHt(ttc, 20), 1000);
});

test("computeFinanceSummary — cas simple", () => {
  const expenses = [
    { forecastAmountTtc: 3000, actualAmountTtc: 3250, status: "PAYE", payments: [{ amount: 3250 }] },
    { forecastAmountTtc: 5000, actualAmountTtc: 4850, status: "ACOMPTE_PAYE", payments: [{ amount: 1000 }] },
    { forecastAmountTtc: 2000, actualAmountTtc: null, status: "ESTIMATION", payments: [] },
  ];
  const revenues = [
    { forecastAmount: 8000, actualAmount: 8500, status: "ENCAISSE", payments: [{ amount: 8500 }] },
    { forecastAmount: 2000, actualAmount: null, status: "PREVU", payments: [] },
  ];

  const summary = computeFinanceSummary(expenses, revenues);

  assert.strictEqual(summary.expensesForecast, 10000);
  assert.strictEqual(summary.expensesActual, 3250 + 4850 + 2000);
  assert.strictEqual(summary.expensesPaid, 3250 + 1000);
  assert.strictEqual(summary.expensesRemaining, summary.expensesActual - summary.expensesPaid);
  assert.strictEqual(summary.expensesEngaged, 3250 + 4850); // ESTIMATION exclue

  assert.strictEqual(summary.revenuesForecast, 10000);
  assert.strictEqual(summary.revenuesCollected, 8500);
  assert.strictEqual(summary.resultForecast, 10000 - 10000);
  assert.strictEqual(summary.resultActual, 8500 - (3250 + 1000));
});

test("expensesRemaining ne descend jamais sous 0", () => {
  const expenses = [{ forecastAmountTtc: 100, actualAmountTtc: 100, status: "PAYE", payments: [{ amount: 150 }] }];
  const summary = computeFinanceSummary(expenses, []);
  assert.strictEqual(summary.expensesRemaining, 0);
});

test("computeExpenseVarianceByCategory calcule écarts € et %", () => {
  const rows = computeExpenseVarianceByCategory([
    { categoryId: "loc", categoryName: "Location", forecastAmountTtc: 3000, actualAmountTtc: 3250, status: "PAYE" },
    { categoryId: "tech", categoryName: "Technique", forecastAmountTtc: 5000, actualAmountTtc: 4850, status: "PAYE" },
  ]);
  const location = rows.find((r) => r.categoryId === "loc")!;
  assert.strictEqual(location.varianceAmount, 250);
  assert.strictEqual(round2(location.variancePct), round2((250 / 3000) * 100));

  const technique = rows.find((r) => r.categoryId === "tech")!;
  assert.strictEqual(technique.varianceAmount, -150);
});

test("costPerAttendee retourne null sans fréquentation", () => {
  assert.strictEqual(costPerAttendee(10000, null), null);
  assert.strictEqual(costPerAttendee(10000, 0), null);
  assert.strictEqual(costPerAttendee(10000, 500), 20);
});

console.log("\nTous les tests finance.ts sont passés.");
