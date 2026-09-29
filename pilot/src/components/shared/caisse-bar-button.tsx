import { Beer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lienCaisseBar } from "@/lib/caisse-bar";

// Ouvre la caisse bar de la soirée (appli Commandes Bar) dans un nouvel onglet.
export function CaisseBarButton({
  event,
  size = "default",
}: {
  event: { id: string; name: string };
  size?: "default" | "sm";
}) {
  return (
    <Button asChild variant="outline" size={size}>
      <a href={lienCaisseBar(event)} target="_blank" rel="noopener noreferrer">
        <Beer className="h-4 w-4" /> Caisse bar
      </a>
    </Button>
  );
}
