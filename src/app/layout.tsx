import type { Metadata, Viewport } from "next";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const title = "Policy renewals dashboard | Harbourlight Brokers";
const description =
  "Analytics dashboard for policy renewals: KPIs, trends, filters, sortable table and CSV export. Mock data for a fictional broker.";

export const metadata: Metadata = {
  title: { default: title, template: "%s | Harbourlight Brokers" },
  description,
  openGraph: { title, description, type: "website", siteName: "Harbourlight Brokers" },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1020" },
  ],
};

/** Runs before first paint so the saved (or system) theme is applied with no flash. */
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
        >
          Skip to content
        </a>
        <header className="border-b border-border bg-surface">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <svg aria-hidden="true" viewBox="0 0 32 32" className="size-8 shrink-0">
                <rect width="32" height="32" rx="8" fill="var(--accent)" />
                <path
                  d="M7 21c3-1 5-4 9-4s6 3 9 4M7 15c3-1 5-4 9-4s6 3 9 4"
                  fill="none"
                  stroke="var(--accent-foreground)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-base font-semibold tracking-tight">Harbourlight Brokers</span>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 text-sm text-muted sm:px-6">
          Harbourlight Brokers is a fictional company. All records are generated mock data.
        </footer>
      </body>
    </html>
  );
}
