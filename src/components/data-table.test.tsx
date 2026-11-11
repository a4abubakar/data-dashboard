import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SAMPLE } from "@/test/fixtures";
import { nextSort, sortRows } from "@/lib/table";
import type { SortColumn, SortDirection } from "@/lib/types";
import { DataTable } from "./data-table";
import { Pagination } from "./pagination";

/** Wires the table to the same sort helpers the dashboard uses. */
function SortableTable() {
  const [state, setState] = useState<{ sort: SortColumn; dir: SortDirection }>({ sort: "id", dir: "asc" });
  return (
    <DataTable
      rows={sortRows(SAMPLE, state.sort, state.dir)}
      sort={state.sort}
      dir={state.dir}
      onSort={(column) => setState((s) => nextSort(s, column))}
    />
  );
}

const firstColumn = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0].textContent);

describe("DataTable", () => {
  it("sorts by clicking a header and reports the state through aria-sort", async () => {
    const user = userEvent.setup();
    render(<SortableTable />);

    const premium = screen.getByRole("columnheader", { name: /premium/i });
    const id = screen.getByRole("columnheader", { name: /^id/i });
    expect(id).toHaveAttribute("aria-sort", "ascending");
    expect(premium).toHaveAttribute("aria-sort", "none");

    await user.click(within(premium).getByRole("button"));
    expect(premium).toHaveAttribute("aria-sort", "descending");
    expect(id).toHaveAttribute("aria-sort", "none");
    expect(firstColumn()).toEqual(["B", "A", "D", "C", "E"]);

    await user.click(within(premium).getByRole("button"));
    expect(premium).toHaveAttribute("aria-sort", "ascending");
    expect(firstColumn()).toEqual(["E", "C", "D", "A", "B"]);
  });

  it("shows an empty state with a way out when there are no rows", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<DataTable rows={[]} sort="id" dir="asc" onSort={() => {}} onClearFilters={onClear} />);
    expect(screen.getByText(/no renewals match these filters/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /clear filters/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});

describe("Pagination", () => {
  it("disables Previous on the first page and Next on the last, and reports the visible range", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination page={1} pageCount={3} pageSize={10} total={23} onPageChange={onPageChange} onPageSizeChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    rerender(
      <Pagination page={3} pageCount={3} pageSize={10} total={23} onPageChange={onPageChange} onPageSizeChange={() => {}} />,
    );
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveTextContent("Showing 21 to 23 of 23 renewals");
  });
});
