import { Suspense } from "react";
import { Dashboard } from "@/components/dashboard";
import { DashboardSkeleton } from "@/components/skeletons";
import { formatDate } from "@/lib/dates";
import { DATA_TO } from "@/lib/generate-data";

export default function Home() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Policy renewals</h1>
        <p className="mt-1 text-sm text-muted">
          Renewal performance across lines of business, channels and regions. Mock data as of {formatDate(DATA_TO)}.
        </p>
      </div>
      {/* Dashboard reads the URL on the client, so it must sit inside a Suspense boundary. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard />
      </Suspense>
    </div>
  );
}
