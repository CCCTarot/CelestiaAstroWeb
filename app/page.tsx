"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileDown, FileText, FolderHeart, MoonStar, Orbit, Sparkles, UserRound } from "lucide-react";
import type { BirthInput, Profile } from "@/lib/astro/types";
import { SIGNS } from "@/lib/astro/constants";
import { calcChart } from "@/lib/astro/engine";
import { combinedMd } from "@/lib/astro/export";
import { useProfiles } from "@/lib/storage";
import { InputForm } from "@/components/InputForm";
import { ProfileManager } from "@/components/ProfileManager";
import { WesternView } from "@/components/WesternView";
import { VedicView } from "@/components/VedicView";
import { ExportDrawer } from "@/components/ExportDrawer";
import PdfExportModal from "@/components/PdfExportModal";
import { ChartSummaryModal } from "@/components/ChartSummaryModal";
import { toChartData } from "@/lib/chart-summary";
import { NorthIndian, SouthIndian, Wheel } from "@/components/Charts";

type Tab = "input" | "profiles" | "western" | "vedic" | "export";
type TimeZoneStatus = { key: string; state: "loading" | "ready" | "error"; timeZone?: string; error?: string };
const formatUtcOffset = (hours: number) => {
  const minutes = Math.round(Math.abs(hours) * 60);
  const sign = hours < 0 ? "−" : "+";
  return `UTC${sign}${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};
const signIndex = (longitude: number) => Math.floor((((longitude % 360) + 360) % 360) / 30);
const formatDegree = (longitude: number) => {
  const normalized = ((longitude % 360) + 360) % 360;
  const degree = Math.floor(normalized % 30);
  const minute = Math.floor((normalized % 1) * 60);
  return `${String(degree).padStart(2, "0")}°${String(minute).padStart(2, "0")}′`;
};
const formatBirthDate = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};
const PDF_CHART_PALETTE = { ink: "#251A30", accent: "#C8A962", surface: "#FFFFFF", border: "#E6DFD3" };
const DEFAULT: BirthInput = {
  name: "Sample", date: "2000-01-01", time: "12:00", city: "London, UK", lat: 51.5074, lon: -0.1278, tz: 0, houseSystem: "placidus", ayanamsa: "lahiri",
};
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "input", label: "Input", icon: <UserRound size={15} /> },
  { id: "profiles", label: "Profiles", icon: <FolderHeart size={15} /> },
  { id: "western", label: "Western", icon: <Orbit size={15} /> },
  { id: "vedic", label: "Vedic", icon: <MoonStar size={15} /> },
  { id: "export", label: "AI Export", icon: <FileText size={15} /> },
];

export default function Home() {
  const [input, setInput] = useState<BirthInput>(DEFAULT);
  const [tab, setTab] = useState<Tab>("input");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [timeZoneStatus, setTimeZoneStatus] = useState<TimeZoneStatus | null>(null);
  const timeZoneRequest = useRef<AbortController | null>(null);
  const store = useProfiles();
  const timeZoneKey = `${input.lat},${input.lon},${input.date},${input.time}`;
  const isTimeZoneReady = timeZoneStatus?.key === timeZoneKey && timeZoneStatus.state === "ready";

  useEffect(() => {
    const controller = new AbortController();
    timeZoneRequest.current?.abort();
    timeZoneRequest.current = controller;
    setTimeZoneStatus({ key: timeZoneKey, state: "loading" });

    const params = new URLSearchParams({
      lat: String(input.lat),
      lon: String(input.lon),
      date: input.date,
      time: input.time,
    });

    fetch(`/api/timezone?${params}`, { signal: controller.signal })
      .then(async (response): Promise<{ timeZone: string; offset: number }> => {
        const result = await response.json() as { timeZone?: string; offset?: number; error?: string };
        if (!response.ok) throw new Error(result.error || `Time zone lookup failed (${response.status}).`);
        if (!result.timeZone || typeof result.offset !== "number" || !Number.isFinite(result.offset)) {
          throw new Error("The time zone lookup returned invalid data.");
        }
        return { timeZone: result.timeZone, offset: result.offset };
      })
      .then(({ timeZone, offset }) => {
        if (controller.signal.aborted) return;
        setInput((current) => ({ ...current, tz: offset }));
        setTimeZoneStatus({ key: timeZoneKey, state: "ready", timeZone });
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setTimeZoneStatus({
          key: timeZoneKey,
          state: "error",
          error: reason instanceof Error ? reason.message : "Could not determine the birth time zone.",
        });
      });

    return () => controller.abort();
  }, [timeZoneKey, input.date, input.time, input.lat, input.lon]);

  const { chart, error } = useMemo(() => {
    if (!isTimeZoneReady) return { chart: null, error: "" };
    try { return { chart: calcChart(input), error: "" }; } catch (e) { return { chart: null, error: (e as Error).message }; }
  }, [input, isTimeZoneReady]);
  const summarySystem = tab === "western" || tab === "vedic" ? tab : null;
  const summaryChart = chart && summarySystem ? toChartData(summarySystem, input, chart) : null;

  const load = (p: Profile) => { setInput(p.input); setActiveId(p.id); setTab("western"); };
  const download = (p: Profile) => {
    const md = combinedMd([{ label: p.name, tag: p.tag, notes: p.notes, input: p.input }]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = `${p.name.replace(/\W+/g, "-").toLowerCase()}.md`; a.click(); URL.revokeObjectURL(a.href);
  };

  const exportItems = selected.length
    ? store.profiles.filter((p) => selected.includes(p.id)).map((p) => ({ label: p.name, tag: p.tag, notes: p.notes, input: p.input }))
    : [{ label: input.name, input }];

  const westernPlacements = chart ? [
    ...chart.western.bodies.map((body) => ({
      body: body.name,
      sign: SIGNS[body.sign],
      degree: formatDegree(body.lon),
      house: body.house,
      retrograde: body.retro,
    })),
    { body: "Ascendant", sign: SIGNS[signIndex(chart.western.asc)], degree: formatDegree(chart.western.asc), house: "—", isAngle: true },
    { body: "Midheaven", sign: SIGNS[signIndex(chart.western.mc)], degree: formatDegree(chart.western.mc), house: "—", isAngle: true },
  ] : [];
  const houseCusps = chart ? chart.western.cusps.map((longitude, index) => ({
    house: index + 1,
    sign: SIGNS[signIndex(longitude)],
    degree: formatDegree(longitude),
  })) : [];
  const vedicPlacements = chart ? chart.vedic.bodies.map((body) => ({
    planet: body.name,
    sign: SIGNS[body.sign],
    degree: formatDegree(body.lon),
    navamshaSign: SIGNS[body.navSign],
    nakshatra: body.nakshatra,
    pada: body.pada,
    lord: body.lord,
    retrograde: body.retro,
  })) : [];
  const currentMaha = chart?.vedic.periods.find((period) => period.lord === chart.vedic.current?.maha);
  const dasha = chart ? [
    ...chart.vedic.periods.map((period, index) => ({
      planet: period.lord,
      start: period.start,
      end: period.end,
      duration: index === 0 ? "Balance at birth" : undefined,
      type: "Mahadasha" as const,
    })),
    ...(currentMaha?.antardashas.map((period) => ({
      planet: period.lord,
      start: period.start,
      end: period.end,
      parent: currentMaha.lord,
      type: "Antardasha" as const,
    })) ?? []),
  ] : [];

  const southRashi: Record<number, string[]> = {};
  const southNavamsha: Record<number, string[]> = {};
  const northRashi: Record<number, string[]> = {};
  const northNavamsha: Record<number, string[]> = {};
  chart?.vedic.bodies.forEach((body) => {
    const retro = body.retro && body.key !== "Ra" && body.key !== "Ke" ? "ᴿ" : "";
    (southRashi[body.sign] ??= []).push(`${body.key}${retro}`);
    (southNavamsha[body.navSign] ??= []).push(`${body.key}${retro}`);
    (northRashi[body.house] ??= []).push(`${body.key}${retro}`);
    const navamshaHouse = ((body.navSign - chart.vedic.lagna.navSign + 12) % 12) + 1;
    (northNavamsha[navamshaHouse] ??= []).push(`${body.key}${retro}`);
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center">
        <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-violet-300/70"><Sparkles size={14} />Dual-system ephemeris</p>
        <h1 className="iridescent font-display text-4xl font-bold sm:text-5xl">Celestia</h1>
        <p className="mt-2 text-sm text-slate-400">Western & Vedic birth charts, saved locally in your browser.</p>
      </header>

      <nav className="sticky top-3 z-10 mx-auto mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-violet-400/15 bg-[#0B0F17]/80 p-1 backdrop-blur">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm transition ${tab === t.id ? "bg-gradient-to-r from-indigo-500/80 to-violet-500/80 text-white shadow-[0_0_20px_-4px_rgba(139,92,246,0.8)]" : "text-slate-400 hover:text-violet-200"}`}>
            {t.icon}{t.label}
            {t.id === "profiles" && store.profiles.length > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[10px]">{store.profiles.length}</span>}
          </button>
        ))}
      </nav>

      <div className="mb-4 flex justify-end">
        {summarySystem && <ChartSummaryModal
          chart={summaryChart}
          buttonLabel={`Read ${summarySystem === "vedic" ? "Vedic" : "Western"} Chart`}
        />}
        <button onClick={() => setPdfOpen(true)} disabled={!chart}
          className="ml-2 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-40">
          <FileDown size={15} />Download Chart PDF
        </button>
      </div>

      {timeZoneStatus?.key === timeZoneKey && timeZoneStatus.state === "loading" && (
        <p role="status" className="mb-4 rounded-lg border border-violet-400/20 bg-violet-500/10 p-3 text-sm text-violet-200">
          Updating the birth time zone from the selected location and date. Chart calculation is paused until it is confirmed.
        </p>
      )}
      {timeZoneStatus?.key === timeZoneKey && timeZoneStatus.state === "ready" && (
        <p className="mb-4 text-xs text-slate-400">
          Birth time zone: {timeZoneStatus.timeZone} ({formatUtcOffset(input.tz)} at birth)
        </p>
      )}
      {timeZoneStatus?.key === timeZoneKey && timeZoneStatus.state === "error" && (
        <p role="alert" className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          Birth time zone could not be confirmed, so chart calculation is paused: {timeZoneStatus.error}
        </p>
      )}
      {error && <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      {tab === "input" && <InputForm value={input} onChange={(v) => { setInput(v); setActiveId(null); }} onSave={(n, t, notes) => setActiveId(store.add(n, t, notes, input).id)} />}
      {tab === "profiles" && (
        <ProfileManager profiles={store.profiles} activeId={activeId} selected={selected} setSelected={setSelected}
          onLoad={load} onUpdate={store.update} onDelete={(id) => { store.remove(id); setSelected((s) => s.filter((x) => x !== id)); }}
          onDuplicate={store.duplicate} onExportOne={download} onBatch={() => setTab("export")} />
      )}
      {tab === "western" && chart && <WesternView input={input} chart={chart} />}
      {tab === "vedic" && chart && <VedicView input={input} chart={chart} />}
      {tab === "export" && <ExportDrawer items={exportItems} source={selected.length ? `${selected.length} selected profile(s)` : "current chart"} />}
      <PdfExportModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        client={{
          name: input.name,
          dateOfBirth: formatBirthDate(input.date),
          localTime: input.time,
          location: input.city,
          timezone: `${timeZoneStatus?.timeZone ?? "Local time"} (${formatUtcOffset(input.tz)})`,
        }}
        western={westernPlacements}
        houseCusps={houseCusps}
        vedic={vedicPlacements}
        dasha={dasha}
        westernNote={`Tropical zodiac · ${input.houseSystem} houses`}
        vedicNote={`Sidereal zodiac · ${input.ayanamsa} ayanamsa${chart ? ` · ${chart.vedic.ayanamsaValue.toFixed(3)}°` : ""}`}
        westernChart={chart ? <Wheel
          pts={[...chart.western.bodies.filter((body) => body.key !== "SN"), { key: "La", lon: chart.western.asc }, { key: "MC", lon: chart.western.mc }]}
          cusps={chart.western.cusps}
          asc={chart.western.asc}
          palette={{ primary: PDF_CHART_PALETTE.ink, secondary: PDF_CHART_PALETTE.ink, accent: PDF_CHART_PALETTE.accent, grid: PDF_CHART_PALETTE.accent, text: PDF_CHART_PALETTE.ink, center: PDF_CHART_PALETTE.surface }}
        /> : undefined}
        southIndianChart={chart ? <SouthIndian map={southRashi} lagnaSign={chart.vedic.lagna.sign} palette={PDF_CHART_PALETTE} /> : undefined}
        southIndianNavamshaChart={chart ? <SouthIndian centerLabel="Navamsha" map={southNavamsha} lagnaSign={chart.vedic.lagna.navSign} palette={PDF_CHART_PALETTE} /> : undefined}
        northIndianChart={chart ? <NorthIndian map={northRashi} lagnaSign={chart.vedic.lagna.sign} palette={PDF_CHART_PALETTE} /> : undefined}
        northIndianNavamshaChart={chart ? <NorthIndian map={northNavamsha} lagnaSign={chart.vedic.lagna.navSign} palette={PDF_CHART_PALETTE} /> : undefined}
        fileName={`Cosmic-Blueprint-${(input.name || "Client").trim().replace(/\s+/g, "-")}`}
      />
    </main>
  );
}
