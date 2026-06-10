import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Memuat halaman"
      className="min-h-screen bg-slate-50 px-4 py-8 md:px-8"
    >
      <span className="sr-only">Memuat...</span>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1fr_24rem]">
          <section className="space-y-5">
            <Skeleton className="h-12 w-52" />
            <Skeleton className="h-5 w-full max-w-xl" />
            <Skeleton className="h-5 w-4/5 max-w-lg" />
            <div className="grid gap-4 pt-4 md:grid-cols-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          </section>
          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-6 w-36" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
