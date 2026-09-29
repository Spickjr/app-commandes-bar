// Affiché immédiatement pendant le chargement d'une page de l'espace PILOT.
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="mb-6 flex flex-col gap-2">
        <div className="h-6 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-card" />
        ))}
      </div>
      <div className="mt-6 h-64 rounded-lg border bg-card" />
    </div>
  );
}
