import Link from "next/link";
import { cardClass, primaryButtonClass } from "@/components/styles";

export default function NotFound() {
  return (
    <div className={`${cardClass} mx-auto mt-10 max-w-xl space-y-3 p-8 text-center`}>
      <p className="text-sm font-semibold text-muted">404</p>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted">That page does not exist. The dashboard is on the home page.</p>
      <Link href="/" className={primaryButtonClass}>
        Back to the dashboard
      </Link>
    </div>
  );
}
