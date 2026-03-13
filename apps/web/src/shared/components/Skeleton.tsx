/**
 * Componente Skeleton para estados de carregamento.
 * Animação shimmer (pulse) em Tailwind.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className={`animate-pulse rounded-md bg-[#E5E7EB] ${className}`}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="card-base p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 && lines > 1 ? 'w-[75%]' : 'w-full'}`} />
      ))}
    </div>
  )
}
