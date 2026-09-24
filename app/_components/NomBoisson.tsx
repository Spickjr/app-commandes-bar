// Affiche le nom d'une boisson : la 2e ligne éventuelle (après "\n")
// apparaît en dessous, plus petite et en italique (ex : "Blanc de Blancs").
export default function NomBoisson({ nom }: { nom: string }) {
  const [titre, ...details] = nom.split("\n");

  return (
    <span className="flex flex-col gap-0.5">
      <span className="text-base font-semibold leading-snug">{titre}</span>

      {details.map((ligne, index) => (
        <span key={index} className="text-[13px] italic text-doux">
          {ligne.replace(/"/g, "")}
        </span>
      ))}
    </span>
  );
}
