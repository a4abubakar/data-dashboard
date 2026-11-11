"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useOptimistic, useTransition } from "react";
import { filtersToSearchParams, parseFilters } from "@/lib/params";
import type { Filters } from "@/lib/types";

export interface UpdateOptions {
  /** Replace the history entry instead of adding one (used while typing in search). */
  replace?: boolean;
}

/** The URL is the single source of truth for filters, sorting and paging. */
export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const search = searchParams.toString();
  const urlFilters = useMemo(() => parseFilters(new URLSearchParams(search)), [search]);
  // Controls reflect a click immediately; the value settles to the URL once the navigation commits.
  const [filters, setOptimisticFilters] = useOptimistic(urlFilters);
  /** Canonical query string (defaults omitted); this is what we send to the API. */
  const query = useMemo(() => filtersToSearchParams(urlFilters).toString(), [urlFilters]);

  const update = useCallback(
    (patch: Partial<Filters>, options: UpdateOptions = {}) => {
      // Anything other than an explicit page change goes back to page 1.
      const next: Filters = { ...filters, page: 1, ...patch };
      const qs = filtersToSearchParams(next).toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      startTransition(() => {
        setOptimisticFilters(next);
        if (options.replace) router.replace(href, { scroll: false });
        else router.push(href, { scroll: false });
      });
    },
    [filters, pathname, router, setOptimisticFilters],
  );

  const reset = useCallback(() => {
    startTransition(() => {
      setOptimisticFilters(parseFilters(new URLSearchParams()));
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router, setOptimisticFilters]);

  return { filters, query, update, reset };
}
