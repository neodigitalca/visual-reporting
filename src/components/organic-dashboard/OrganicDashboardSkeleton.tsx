export function OrganicDashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="animate-pulse space-y-4 bg-zinc-900/80 p-4">
        <div className="h-5 w-32 bg-zinc-800" />
        <div className="h-4 w-full max-w-md bg-zinc-800" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-8 w-full bg-zinc-800" />
          ))}
        </div>
      </div>
      <div className="animate-pulse space-y-4 bg-zinc-900/80 p-4">
        <div className="h-5 w-48 bg-zinc-800" />
        <div className="h-56 w-full bg-zinc-800" />
      </div>
      <div className="animate-pulse space-y-4 bg-zinc-900/80 p-4">
        <div className="h-5 w-40 bg-zinc-800" />
        <div className="h-56 w-full bg-zinc-800" />
      </div>
    </div>
  );
}
