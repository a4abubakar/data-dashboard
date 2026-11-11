import type { NextRequest } from "next/server";
import { toCsv } from "@/lib/csv";
import { parseFilters } from "@/lib/params";
import { buildRenewalsResponse, exportRows } from "@/lib/renewals-service";
import { getRenewals } from "@/lib/store";

/** Artificial latency so loading states are real. Override with RENEWALS_DELAY_MS (e.g. 0 in tests). */
const DELAY_MS = Number(process.env.RENEWALS_DELAY_MS ?? 450);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters = parseFilters(searchParams);
  if (DELAY_MS > 0) await sleep(DELAY_MS);

  if (searchParams.get("format") === "csv") {
    const csv = toCsv(exportRows(getRenewals(), filters));
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="renewals_${filters.from}_to_${filters.to}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return Response.json(buildRenewalsResponse(getRenewals(), filters), {
    headers: { "Cache-Control": "no-store" },
  });
}
