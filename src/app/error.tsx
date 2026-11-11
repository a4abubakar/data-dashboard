"use client";

import { useEffect } from "react";
import { cardClass, primaryButtonClass } from "@/components/styles";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className={`${cardClass} mx-auto mt-10 max-w-xl space-y-3 p-8 text-center`}>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted">The dashboard hit an unexpected error. Your data is safe; this is a display problem.</p>
      {error.digest && <p className="font-mono text-xs text-muted">Reference: {error.digest}</p>}
      <button type="button" onClick={reset} className={primaryButtonClass}>
        Try again
      </button>
    </div>
  );
}
