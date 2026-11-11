import { cardClass } from "./styles";

function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-surface-muted ${className}`} />;
}

export function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`${cardClass} space-y-3 p-4`}>
          <Bone className="h-4 w-24" />
          <Bone className="h-8 w-36" />
          <Bone className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
      <div className={`${cardClass} space-y-3 p-4 lg:col-span-2`}>
        <Bone className="h-5 w-48" />
        <Bone className="h-[260px] w-full" />
      </div>
      <div className={`${cardClass} space-y-3 p-4`}>
        <Bone className="h-5 w-56" />
        <Bone className="h-[260px] w-full" />
      </div>
      <div className={`${cardClass} space-y-3 p-4`}>
        <Bone className="h-5 w-44" />
        <Bone className="h-[260px] w-full" />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <Bone className="h-10 w-full" />
      {Array.from({ length: 8 }, (_, i) => (
        <Bone key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function FiltersSkeleton() {
  return (
    <div className={`${cardClass} space-y-4 p-4`} aria-hidden="true">
      <Bone className="h-5 w-20" />
      <div className="flex flex-wrap gap-3">
        <Bone className="h-10 w-40" />
        <Bone className="h-10 w-40" />
        <Bone className="h-10 w-44" />
        <Bone className="h-10 w-44" />
      </div>
      <Bone className="h-9 w-2/3" />
    </div>
  );
}

/** Full-page skeleton: used by loading.tsx and as the Suspense fallback while the URL is read on the client. */
export function DashboardSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">Loading dashboard</span>
      <FiltersSkeleton />
      <KpiSkeleton />
      <ChartsSkeleton />
      <div className={`${cardClass} p-4`}>
        <TableSkeleton />
      </div>
    </div>
  );
}
