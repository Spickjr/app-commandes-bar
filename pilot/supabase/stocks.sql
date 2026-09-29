-- PILOT : onglet Stocks (table StockItem). À exécuter une fois dans Supabase → SQL Editor.
set search_path to pilot;

-- CreateTable
CREATE TABLE "StockItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "initialQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "alertQty" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockItem_eventId_idx" ON "StockItem"("eventId");

-- CreateIndex
CREATE INDEX "StockItem_organizationId_idx" ON "StockItem"("organizationId");

-- AddForeignKey
ALTER TABLE "StockItem" ADD CONSTRAINT "StockItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;


alter table pilot."StockItem" enable row level security;
