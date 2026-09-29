// Données de démonstration — organisation fictive "Hors Cadre Production" avec 4 événements,
// suffisamment de dépenses/recettes/prestataires/tâches pour que les dashboards soient parlants.
// Lancer : npx tsx prisma/seed.ts (ou npm run db:seed)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_REVENUE_CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(20, 0, 0, 0);
  return d;
}

function daysAgo(days: number): Date {
  return daysFromNow(-days);
}

async function main() {
  console.log("Seed — création des données de démonstration…");

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@pilot.app" },
    update: {},
    create: { email: "demo@pilot.app", passwordHash, firstName: "Alex", lastName: "Martin" },
  });

  const existingOrg = await prisma.organizationMember.findFirst({ where: { userId: user.id } });
  if (existingOrg) {
    console.log("Un espace existe déjà pour demo@pilot.app — seed ignoré (déjà exécuté).");
    return;
  }

  const org = await prisma.organization.create({
    data: {
      name: "Hors Cadre Production",
      type: "Agence événementielle",
      eventsPerYear: 6,
      members: { create: { userId: user.id, role: "OWNER" } },
      categories: {
        create: [
          ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({ scope: "EXPENSE", name, isDefault: true })),
          ...DEFAULT_REVENUE_CATEGORIES.map((name) => ({ scope: "REVENUE", name, isDefault: true })),
        ],
      },
    },
  });

  const expenseCategories = await prisma.category.findMany({ where: { organizationId: org.id, scope: "EXPENSE" } });
  const revenueCategories = await prisma.category.findMany({ where: { organizationId: org.id, scope: "REVENUE" } });
  const cat = (name: string) => expenseCategories.find((c) => c.name === name)!.id;
  const rcat = (name: string) => revenueCategories.find((c) => c.name === name)!.id;

  const suppliersData = [
    { name: "Alpha Sécurité", category: "Sécurité", email: "contact@alphasecurite.fr", phone: "04 90 00 00 01" },
    { name: "SonoTech Provence", category: "Technique", email: "contact@sonotech.fr", phone: "04 90 00 00 02" },
    { name: "Loc'Event Alpilles", category: "Location", email: "contact@locevent.fr", phone: "04 90 00 00 03" },
    { name: "Traiteur Mistral", category: "Restauration", email: "contact@traiteurmistral.fr", phone: "04 90 00 00 04" },
    { name: "Studio Comm Éclat", category: "Communication", email: "contact@eclatcom.fr", phone: "04 90 00 00 05" },
  ];

  const suppliers: Record<string, string> = {};
  for (const s of suppliersData) {
    const supplierCategory = expenseCategories.find((c) => c.name === s.category);
    const created = await prisma.supplier.create({
      data: { organizationId: org.id, name: s.name, email: s.email, phone: s.phone, categoryId: supplierCategory?.id },
    });
    suppliers[s.name] = created.id;
  }

  const eventsData = [
    {
      name: "OFCOURSE! 6",
      type: "Festival",
      date: daysFromNow(45),
      status: "CONFIRME",
      venueName: "Domaine des Alpilles",
      estimatedCapacity: 1200,
      expenses: [
        { label: "Sonorisation & régie", category: "Technique", ht: 6500, vat: 20, status: "ACOMPTE_PAYE", supplier: "SonoTech Provence", paid: 2000, due: 30 },
        { label: "Sécurité événementielle", category: "Sécurité", ht: 4200, vat: 20, status: "VALIDE", supplier: "Alpha Sécurité", paid: 0, due: 15 },
        { label: "Location structure & mobilier", category: "Location", ht: 5800, vat: 20, status: "PAYE", supplier: "Loc'Event Alpilles", paid: 6960, due: -10 },
        { label: "Communication & visuels", category: "Communication", ht: 2200, vat: 20, status: "PAYE", supplier: "Studio Comm Éclat", paid: 2640, due: -20 },
        { label: "Restauration équipe & bénévoles", category: "Restauration", ht: 1800, vat: 10, status: "DEVIS_RECU", supplier: "Traiteur Mistral", paid: 0, due: 20 },
        { label: "Assurance événement", category: "Assurance", ht: 900, vat: 20, status: "VALIDE", paid: 0, due: 25 },
      ],
      revenues: [
        { label: "Billetterie externe (Shotgun)", category: "Billetterie externe", amount: 28500, status: "PARTIELLEMENT_ENCAISSE", collected: 15000, date: 40 },
        { label: "Sponsoring bière locale", category: "Sponsoring", amount: 3000, status: "CONFIRME", collected: 0, date: 35 },
        { label: "Subvention mairie Eyragues", category: "Subvention", amount: 5000, status: "PREVU", collected: 0, date: 50 },
        { label: "Bar", category: "Bar / restauration", amount: 6000, status: "PREVU", collected: 0, date: 45 },
      ],
      tasks: [
        { title: "Finaliser plan de sécurité", priority: "HAUTE", due: 10 },
        { title: "Relancer mairie pour autorisation", priority: "URGENTE", due: 5 },
        { title: "Booker équipe bénévoles", priority: "NORMALE", due: 20 },
      ],
    },
    {
      name: "Mírasma",
      type: "Soirée",
      date: daysFromNow(90),
      status: "EN_PREPARATION",
      venueName: "MAS Gourmand",
      estimatedCapacity: 300,
      expenses: [
        { label: "Décoration orientale", category: "Décoration", ht: 1500, vat: 20, status: "ESTIMATION", paid: 0, due: 60 },
        { label: "Technique son & lumière", category: "Technique", ht: 2800, vat: 20, status: "DEVIS_DEMANDE", supplier: "SonoTech Provence", paid: 0, due: 55 },
        { label: "Communication", category: "Communication", ht: 800, vat: 20, status: "VALIDE", supplier: "Studio Comm Éclat", paid: 0, due: 40 },
      ],
      revenues: [
        { label: "Billetterie externe", category: "Billetterie externe", amount: 9000, status: "PREVU", collected: 0, date: 88 },
        { label: "Partenariat lieu", category: "Partenariat", amount: 1000, status: "CONFIRME", collected: 1000, date: 30 },
      ],
      tasks: [{ title: "Choisir résidents Mírasma", priority: "NORMALE", due: 30 }],
    },
    {
      name: "Maison Minuit",
      type: "Soirée",
      date: daysAgo(15),
      status: "TERMINE",
      venueName: "Salle des fêtes Eyragues",
      estimatedCapacity: 400,
      actualAttendance: 380,
      expenses: [
        { label: "Sonorisation", category: "Technique", ht: 3200, vat: 20, status: "PAYE", supplier: "SonoTech Provence", paid: 3840, due: -20 },
        { label: "Sécurité", category: "Sécurité", ht: 1600, vat: 20, status: "PAYE", supplier: "Alpha Sécurité", paid: 1920, due: -18 },
        { label: "Location salle", category: "Location", ht: 1200, vat: 20, status: "PAYE", paid: 1440, due: -25 },
      ],
      revenues: [
        { label: "Billetterie externe", category: "Billetterie externe", amount: 8000, status: "ENCAISSE", collected: 8400, date: -16 },
        { label: "Bar", category: "Bar / restauration", amount: 2500, status: "ENCAISSE", collected: 2700, date: -15 },
      ],
      tasks: [{ title: "Rédiger bilan de soirée", priority: "NORMALE", status: "TERMINE", due: -10 }],
    },
    {
      name: "Nomä",
      type: "Concert",
      date: daysFromNow(150),
      status: "BROUILLON",
      venueName: "À définir",
      expenses: [{ label: "Booking artistes (estimation)", category: "Animation / intervenants", ht: 4000, vat: 20, status: "ESTIMATION", paid: 0, due: 120 }],
      revenues: [{ label: "Billetterie externe (estimation)", category: "Billetterie externe", amount: 12000, status: "PREVU", collected: 0, date: 148 }],
      tasks: [{ title: "Choisir la date définitive", priority: "HAUTE", due: 15 }],
    },
  ];

  for (const ev of eventsData) {
    const event = await prisma.event.create({
      data: {
        organizationId: org.id,
        name: ev.name,
        type: ev.type,
        status: ev.status,
        date: ev.date,
        venueName: ev.venueName,
        estimatedCapacity: ev.estimatedCapacity,
        actualAttendance: (ev as { actualAttendance?: number }).actualAttendance,
        ownerUserId: user.id,
      },
    });

    for (const e of ev.expenses) {
      const forecastTtc = Math.round(e.ht * (1 + e.vat / 100) * 100) / 100;
      const expense = await prisma.expense.create({
        data: {
          eventId: event.id,
          organizationId: org.id,
          label: e.label,
          categoryId: cat(e.category),
          supplierId: "supplier" in e && e.supplier ? suppliers[e.supplier] : null,
          forecastAmountHt: e.ht,
          forecastAmountTtc: forecastTtc,
          actualAmountHt: e.status === "ESTIMATION" || e.status === "DEVIS_DEMANDE" ? null : e.ht,
          actualAmountTtc: e.status === "ESTIMATION" || e.status === "DEVIS_DEMANDE" ? null : forecastTtc,
          vatRate: e.vat,
          status: e.status,
          dueDate: daysFromNow(e.due),
        },
      });
      if (e.paid > 0) {
        await prisma.payment.create({ data: { expenseId: expense.id, amount: e.paid, date: daysAgo(5) } });
      }
    }

    for (const r of ev.revenues) {
      const revenue = await prisma.revenue.create({
        data: {
          eventId: event.id,
          organizationId: org.id,
          label: r.label,
          categoryId: rcat(r.category),
          forecastAmount: r.amount,
          actualAmount: r.status === "PREVU" ? null : r.amount,
          status: r.status,
          expectedDate: daysFromNow(r.date),
        },
      });
      if (r.collected > 0) {
        await prisma.payment.create({ data: { revenueId: revenue.id, amount: r.collected, date: daysAgo(3) } });
      }
    }

    for (const t of ev.tasks) {
      await prisma.task.create({
        data: {
          organizationId: org.id,
          eventId: event.id,
          title: t.title,
          priority: t.priority,
          status: (t as { status?: string }).status ?? "A_FAIRE",
          dueDate: daysFromNow(t.due),
          assigneeId: user.id,
        },
      });
    }

    if (event.status !== "BROUILLON") {
      await prisma.documentRequirement.createMany({
        data: [
          { eventId: event.id, label: "Assurance responsabilité civile", fulfilled: event.status === "TERMINE" },
          { eventId: event.id, label: "Autorisation municipale", fulfilled: event.status === "TERMINE" || event.status === "CONFIRME" },
          { eventId: event.id, label: "Convention du lieu", fulfilled: false },
        ],
      });
    }
  }

  // Une tâche générale, non liée à un événement précis
  await prisma.task.create({
    data: {
      organizationId: org.id,
      title: "Renouveler l'assurance annuelle de l'association",
      priority: "NORMALE",
      status: "A_FAIRE",
      dueDate: daysFromNow(60),
      assigneeId: user.id,
    },
  });

  console.log("Seed terminé.");
  console.log("Connexion démo : demo@pilot.app / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
