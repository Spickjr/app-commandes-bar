// Affiche le nom d'une boisson : la 2e ligne éventuelle (après "\n")
// apparaît en dessous, plus petite et en italique (ex : "Blanc de Blancs").
export default function NomBoisson({ nom }: { nom: string }) {
  return (
    <div>
      {nom.split("\n").map((ligne, index) => (
        <div
          key={index}
          className={
            index === 0
              ? "text-xl sm:text-2xl font-bold"
              : "text-base sm:text-lg italic opacity-80 mt-2"
          }
        >
          {ligne}
        </div>
      ))}
    </div>
  );
}
