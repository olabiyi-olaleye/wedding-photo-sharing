export function GalleryGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-lg bg-muted animate-pulse"
        />
      ))}
    </div>
  )
}

export function FolderCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 animate-pulse">
          <div className="aspect-square rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function HeroSkeleton() {
  return (
    <section className="container mx-auto px-4 py-12 space-y-8 animate-pulse">
      <div className="text-center space-y-4">
        <div className="h-12 bg-muted rounded w-2/3 mx-auto" />
        <div className="h-6 bg-muted rounded w-3/4 mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto">
        <div className="space-y-2 text-center">
          <div className="h-8 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
        </div>
        <div className="space-y-2 text-center">
          <div className="h-8 bg-muted rounded" />
          <div className="h-4 bg-muted rounded" />
        </div>
      </div>
    </section>
  )
}

export function MediaLightboxSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="aspect-video bg-muted rounded-lg" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-3/4" />
      </div>
    </div>
  )
}

export function HeaderSkeleton() {
  return (
    <header className="border-b border-border/50 bg-background/95 animate-pulse">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="h-8 bg-muted rounded w-32" />
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-muted rounded" />
          <div className="h-10 w-10 bg-muted rounded" />
        </div>
      </div>
    </header>
  )
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded" />
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  )
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex gap-4 py-4 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded flex-1" />
      ))}
    </div>
  )
}
