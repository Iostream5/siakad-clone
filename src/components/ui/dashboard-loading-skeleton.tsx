import { Skeleton } from "@/components/ui/skeleton";

function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-white/90 p-5 shadow-sm">
      <Skeleton className="h-3 w-28" />
      <div className="mt-5 flex items-end justify-between gap-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div
      role="status"
      aria-label="Memuat halaman dashboard"
      className="space-y-6"
    >
      <span className="sr-only">Memuat...</span>

      <section className="grid gap-4 xl:grid-cols-3">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200/70 bg-white/90 p-5 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-44" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex h-72 items-end gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-4">
              {[42, 62, 48, 76, 58, 88, 70].map((height) => (
                <Skeleton
                  key={height}
                  className="flex-1 rounded-t-md"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-slate-200/70 bg-white/90 p-5 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-32" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-4/5" />
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200/70 bg-white/90 p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="space-y-3">
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
        </aside>
      </section>
    </div>
  );
}
