"use client";

import { type ReactNode, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ClientInfo {
  name: string;
  dateOfBirth: string;
  localTime: string;
  location: string;
  timezone: string;
}

export interface WesternPlacement {
  body: string;
  sign: string;
  degree: string;
  house: string | number;
  retrograde?: boolean;
  isAngle?: boolean;
}

export interface HouseCusp {
  house: string | number;
  sign: string;
  degree: string;
}

export interface VedicPlacement {
  planet: string;
  sign: string;
  degree: string;
  navamshaSign?: string;
  nakshatra: string;
  pada: string | number;
  lord?: string;
  retrograde?: boolean;
}

export interface DashaPeriod {
  planet: string;
  start: string;
  end: string;
  duration?: string;
  parent?: string;
  type?: "Mahadasha" | "Antardasha";
}

export interface PdfExportModalProps {
  open: boolean;
  onClose: () => void;
  client: ClientInfo;
  western: WesternPlacement[];
  houseCusps: HouseCusp[];
  vedic: VedicPlacement[];
  dasha: DashaPeriod[];
  westernChart?: ReactNode;
  southIndianChart?: ReactNode;
  southIndianNavamshaChart?: ReactNode;
  northIndianChart?: ReactNode;
  northIndianNavamshaChart?: ReactNode;
  westernNote?: string;
  vedicNote?: string;
  logoSrc?: string;
  fileName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Brand tokens                                                               */
/* -------------------------------------------------------------------------- */

const C = {
  canvas: "#FAF7F2",
  card: "#FFFFFF",
  border: "#E6DFD3",
  ink: "#251A30",
  gold: "#C8A962",
  idCard: "#F5F0E8",
  rowAlt: "#FDFBF8",
};

const SERIF = `"Cormorant Garamond", "Playfair Display", Georgia, "Times New Roman", serif`;
const SANS = `"Inter", "Helvetica Neue", Arial, sans-serif`;

/* -------------------------------------------------------------------------- */
/*  Print + page CSS                                                           */
/* -------------------------------------------------------------------------- */

const PRINT_CSS = `
.ccc-sheet {
  width: 210mm;
  height: 296mm;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.ccc-sheet table { border-collapse: separate; border-spacing: 0; }
.ccc-sheet thead { display: table-header-group; }
.ccc-sheet tr { break-inside: avoid; page-break-inside: avoid; }

@media print {
  @page { size: A4; margin: 0; }
  html, body { background: ${C.canvas} !important; margin: 0 !important; }
  html, body { height: auto !important; overflow: visible !important; }
  body > *:not(#ccc-print-root) { display: none !important; }
  #ccc-print-root {
    position: static !important;
    display: block !important;
    inset: auto !important;
    padding: 0 !important;
    background: none !important;
    overflow: visible !important;
  }
  #ccc-print-root .ccc-no-print { display: none !important; }
  #ccc-print-root .ccc-scroll {
    overflow: visible !important;
    padding: 0 !important;
    display: block !important;
  }
  .ccc-sheet {
    margin: 0 !important;
    box-shadow: none !important;
    break-after: page;
    page-break-after: always;
  }
  .ccc-sheet:last-child { break-after: auto; page-break-after: auto; }
}
`;

/* -------------------------------------------------------------------------- */
/*  Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
}

function DataTable<T>({
  columns,
  rows,
}: {
  columns: Column<T>[];
  rows: T[];
}) {
  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{ borderColor: C.border, background: C.card }}
    >
      <table className="w-full text-[11px]" style={{ fontFamily: SANS, color: C.ink }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-3 py-2.5 text-center align-middle font-bold uppercase tracking-[0.14em] text-white"
                style={{ background: C.ink, fontSize: 9.5 }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? C.card : C.rowAlt }}>
              {columns.map((col) => (
                <td
                  key={col.header}
                  className="border-t px-3 py-2.5 text-center align-middle"
                  style={{ borderColor: C.border }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-3 mt-6 first:mt-0">
      <h2
        className="text-[22px] font-semibold leading-tight"
        style={{ fontFamily: SERIF, color: C.ink }}
      >
        {title}
      </h2>
      <div className="mt-1.5 h-px w-14" style={{ background: C.gold }} />
      {note && (
        <p className="mt-2 text-[10.5px] leading-relaxed" style={{ fontFamily: SANS, color: `${C.ink}B3` }}>
          {note}
        </p>
      )}
    </div>
  );
}

function ChartFrame({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div
      className="flex flex-col items-center rounded-lg border p-5"
      style={{ borderColor: C.border, background: C.card }}
    >
      <p
        className="mb-3 text-[9.5px] font-semibold uppercase tracking-[0.2em]"
        style={{ fontFamily: SANS, color: C.gold }}
      >
        {label}
      </p>
      <div className="flex w-full max-w-[120mm] items-center justify-center [&_svg]:h-auto [&_svg]:max-w-full">
        {children ?? (
          <span className="py-20 text-[11px]" style={{ fontFamily: SANS, color: `${C.ink}80` }}>
            Chart not provided
          </span>
        )}
      </div>
    </div>
  );
}

function Sheet({
  page,
  total,
  children,
}: {
  page: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <section
      className="ccc-sheet mx-auto mb-8 px-[14mm] pb-[9mm] pt-[14mm] shadow-xl shadow-black/10"
      style={{ background: C.canvas }}
    >
      <div className="flex-1">{children}</div>
      <footer
        className="mt-4 grid grid-cols-3 items-center border-t pt-2.5 text-[9.5px]"
        style={{ borderColor: C.gold, borderTopWidth: 0.5, fontFamily: SANS, color: C.ink }}
      >
        <span className="text-left tracking-wide">@ccc.tarot</span>
        <span className="text-center tracking-wide">ccc.github.io</span>
        <span className="text-right tabular-nums">Page {page} of {total}</span>
      </footer>
    </section>
  );
}

function IdentityItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p
        className="text-[8.5px] font-semibold uppercase tracking-[0.18em]"
        style={{ fontFamily: SANS, color: C.gold }}
      >
        {label}
      </p>
      <p
        className="mt-0.5 break-words text-[13px] font-medium leading-snug"
        style={{ fontFamily: SERIF, color: C.ink }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function PdfExportModal({
  open,
  onClose,
  client,
  western,
  houseCusps,
  vedic,
  dasha,
  westernChart,
  southIndianChart,
  southIndianNavamshaChart,
  northIndianChart,
  northIndianNavamshaChart,
  westernNote = "Tropical zodiac · Western placements",
  vedicNote = "Sidereal zodiac",
  logoSrc = "/logo.png",
  fileName,
}: PdfExportModalProps) {
  const TOTAL_PAGES = 5;

  const safeName = useMemo(
    () =>
      fileName ??
      `Cosmic-Blueprint-${(client.name || "Client").trim().replace(/\s+/g, "-")}`,
    [fileName, client.name]
  );

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleExport = () => {
    // The browser uses document.title as the default PDF file name.
    const originalTitle = document.title;
    document.title = safeName;
    const finishPrint = () => {
      document.title = originalTitle;
      window.removeEventListener("afterprint", finishPrint);
      onClose();
    };
    window.addEventListener("afterprint", finishPrint);
    window.print();
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      id="ccc-print-root"
      role="dialog"
      aria-modal="true"
      aria-label="Export Cosmic Blueprint as PDF"
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: "rgba(37, 26, 48, 0.72)" }}
    >
      <style>{PRINT_CSS}</style>

      {/* Toolbar (hidden when printing) */}
      <div
        className="ccc-no-print flex items-center justify-between gap-4 border-b px-5 py-3"
        style={{ background: C.canvas, borderColor: C.border }}
      >
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold" style={{ fontFamily: SERIF, color: C.ink }}>
            Export PDF report
          </p>
          <p className="text-xs" style={{ fontFamily: SANS, color: `${C.ink}99` }}>
            In the print dialog, choose “Save as PDF” and turn off “Headers and footers”.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ background: C.ink, color: "#fff", fontFamily: SANS }}
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full border p-2 transition-colors hover:bg-black/5 focus:outline-none focus-visible:ring-2"
            style={{ borderColor: C.border, color: C.ink }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Preview / print area */}
      <div className="ccc-scroll flex-1 overflow-auto px-4 py-8">
        {/* ------------------------------ PAGE 1 ------------------------------ */}
        <Sheet page={1} total={TOTAL_PAGES}>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-6">
            <div
              className="flex h-[26mm] w-[40mm] items-center justify-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="Cosmic Chaos Club"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="pt-3 text-right">
              <h1
                className="text-[13px] font-semibold uppercase tracking-[0.34em]"
                style={{ fontFamily: SANS, color: C.ink }}
              >
                Cosmic Blueprint &amp; Telemetry
              </h1>
              <div
                className="ml-auto mt-2 h-[1.5px] w-full"
                style={{
                  background: `linear-gradient(to left, ${C.gold}, ${C.gold}00)`,
                }}
              />
            </div>
          </div>

          {/* Client identity */}
          <div
            className="mb-6 rounded-lg border px-5 py-4"
            style={{ background: C.idCard, borderColor: C.border }}
          >
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <IdentityItem label="Client name" value={client.name} />
              <IdentityItem label="Date of birth" value={client.dateOfBirth} />
              <IdentityItem label="Local time" value={client.localTime} />
              <div className="col-span-2">
                <IdentityItem label="Location" value={client.location} />
              </div>
              <IdentityItem label="Timezone" value={client.timezone} />
            </div>
          </div>

          {/* Western */}
          <SectionTitle title="Western Chart" note={westernNote} />
          <ChartFrame label="Western wheel">{westernChart}</ChartFrame>
        </Sheet>

        {/* ------------------------------ PAGE 2 ------------------------------ */}
        <Sheet page={2} total={TOTAL_PAGES}>
          <SectionTitle title="Western Placements" />
          <DataTable<WesternPlacement>
            columns={[
              { header: "Body", render: (r) => <strong>{r.body}</strong> },
              { header: "Sign", render: (r) => r.sign },
              { header: "Degree", render: (r) => r.degree },
              { header: "House", render: (r) => r.house },
              {
                header: "Motion",
                render: (r) => (r.retrograde ? "Retrograde ℞" : r.isAngle ? "—" : "Direct"),
              },
            ]}
            rows={western}
          />

        </Sheet>

        {/* ------------------------------ PAGE 3 ------------------------------ */}
        <Sheet page={3} total={TOTAL_PAGES}>
          <SectionTitle title="South Indian Vedic Charts" note={vedicNote} />
          <div className="grid grid-cols-2 gap-4">
            <ChartFrame label="D1 · Rashi">{southIndianChart}</ChartFrame>
            <ChartFrame label="D9 · Navamsha">{southIndianNavamshaChart}</ChartFrame>
          </div>
          <SectionTitle title="House Cusps" />
          <DataTable<HouseCusp>
            columns={[
              { header: "House", render: (r) => <strong>{r.house}</strong> },
              { header: "Sign", render: (r) => r.sign },
              { header: "Cusp degree", render: (r) => r.degree },
            ]}
            rows={houseCusps}
          />
        </Sheet>

        {/* ------------------------------ PAGE 4 ------------------------------ */}
        <Sheet page={4} total={TOTAL_PAGES}>
          <SectionTitle title="North Indian Vedic Charts" note={vedicNote} />
          <div className="grid grid-cols-2 gap-4">
            <ChartFrame label="D1 · Rashi">{northIndianChart}</ChartFrame>
            <ChartFrame label="D9 · Navamsha">{northIndianNavamshaChart}</ChartFrame>
          </div>

          <SectionTitle title="Nakshatras" />
          <DataTable<VedicPlacement>
            columns={[
              { header: "Planet", render: (r) => <strong>{r.planet}{r.retrograde ? " ℞" : ""}</strong> },
              { header: "Sign", render: (r) => r.sign },
              { header: "Degree", render: (r) => r.degree },
              { header: "Nakshatra", render: (r) => r.nakshatra },
              { header: "Pada", render: (r) => r.pada },
              { header: "Lord", render: (r) => r.lord ?? "—" },
              { header: "D9", render: (r) => r.navamshaSign ?? "—" },
            ]}
            rows={vedic}
          />
        </Sheet>

        {/* ------------------------------ PAGE 5 ------------------------------ */}
        <Sheet page={5} total={TOTAL_PAGES}>
          <SectionTitle
            title="Vimshottari Dasha Sequence"
            note="Planetary periods from birth"
          />
          <DataTable<DashaPeriod>
            columns={[
              { header: "Planet", render: (r) => <strong>{r.planet}</strong> },
              { header: "Period", render: (r) => r.type ?? "Mahadasha" },
              { header: "Parent Maha", render: (r) => r.parent ?? "—" },
              { header: "Begins", render: (r) => r.start },
              { header: "Ends", render: (r) => r.end },
              { header: "Duration", render: (r) => r.duration ?? "—" },
            ]}
            rows={dasha}
          />
        </Sheet>
      </div>
    </div>,
    document.body
  );
}
