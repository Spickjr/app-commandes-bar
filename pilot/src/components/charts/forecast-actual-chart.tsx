"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatMoney } from "@/lib/utils";

export function ForecastActualChart({ data }: { data: { name: string; forecast: number; actual: number }[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée pour le moment.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={70} tickFormatter={(v) => formatMoney(v)} />
        <Tooltip formatter={(value: number) => formatMoney(value, true)} />
        <Bar dataKey="forecast" name="Prévisionnel" fill="#94a3b8" radius={[4, 4, 0, 0]} />
        <Bar dataKey="actual" name="Réel" fill="#0f172a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
