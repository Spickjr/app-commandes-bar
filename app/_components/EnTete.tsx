import { surtitre } from "../_lib/styles";

type Props = {
  surtitre: string;
  titre: string;
  // Élément affiché à droite du surtitre (ex : menu serveur).
  aDroite?: React.ReactNode;
  // Élément affiché à droite du titre (ex : "3 en cours").
  info?: React.ReactNode;
};

// En-tête des écrans principaux : petit surtitre + grand titre.
export default function EnTete({ surtitre: texteSurtitre, titre, aDroite, info }: Props) {
  return (
    <header className="flex flex-col gap-1.5 pt-7">
      <div className="flex min-h-9 items-center justify-between gap-3">
        <span className={surtitre}>{texteSurtitre}</span>
        {aDroite}
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-[34px] font-semibold leading-tight tracking-[-0.03em]">
          {titre}
        </h1>
        {info && <span className="text-sm text-doux">{info}</span>}
      </div>
    </header>
  );
}
