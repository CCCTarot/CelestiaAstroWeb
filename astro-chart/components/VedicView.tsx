"use client";
import type { BirthInput, FullChart } from "@/lib/astro/types";
import { fmtLon, SIGNS } from "@/lib/astro/constants";
import { vedicMd } from "@/lib/astro/export";
import { Card, CopyButton, DataTable } from "./ui";
import { SouthIndian } from "./Charts";

const ab = (k: string) => (k === "La" ? "Asc" : k);

export function VedicView({ input, chart }: { input: BirthInput; chart: FullChart }) {
  const v = chart.vedic;
  const d1: Record<number, string[]> = {}, d9: Record<number, string[]> = {};
  [...v.bodies, v.lagna].forEach((b) => {
    if (b.key !== "La") (d1[b.sign] ??= []).push(b.key + (b.retro && b.key !== "Ra" && b.key !== "Ke" ? "ᴿ" : ""));
    (d9[b.navSign] ??= []).push(ab(b.key));
  });
  const cur = v.periods.find((p) => p.lord === v.current?.maha);
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Sidereal · {input.ayanamsa} {v.ayanamsaValue.toFixed(3)}° · Lagna {fmtLon(v.lagna.lon)}</p>
        <CopyButton getText={() => vedicMd(input, chart)} />
      </div>
      <div className="grid min-w-0 gap-5 md:grid-cols-2">
        <Card><SouthIndian title="D1 · Rashi" map={d1} lagnaSign={v.lagna.sign} /></Card>
        <Card><SouthIndian title="D9 · Navamsha" map={d9} lagnaSign={v.lagna.navSign} /></Card>
      </div>
      <Card title="Grahas, Nakshatras & Navamsha">
        <DataTable head={["Graha", "Rashi Position", "House", "Nakshatra", "Pada", "Lord", "D9"]}
          rows={v.bodies.map((b) => [<>{b.name}{b.retro && b.key !== "Ra" && b.key !== "Ke" && <span className="ml-1 text-fuchsia-300">Rx</span>}</>, fmtLon(b.lon), b.house, b.nakshatra, b.pada, b.lord, SIGNS[b.navSign]])} />
      </Card>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Card title="Vimshottari · Mahadashas" right={v.current && <span className="rounded-full bg-violet-500/20 px-3 py-1 text-xs text-violet-100">Now: {v.current.maha} / {v.current.antar}</span>}>
          <DataTable head={["Mahadasha", "Start", "End"]} rows={v.periods.map((p, i) => [<span key={p.lord} className={p.lord === v.current?.maha ? "font-semibold text-fuchsia-300" : ""}>{p.lord}{i === 0 && " (balance at birth)"}</span>, p.start, p.end])} />
        </Card>
        {cur && <Card title={`Antardashas in ${cur.lord}`}>
          <DataTable head={["Antardasha", "Start", "End"]} rows={cur.antardashas.map((a) => [<span key={a.lord} className={a.lord === v.current?.antar ? "font-semibold text-fuchsia-300" : ""}>{a.lord}</span>, a.start, a.end])} />
        </Card>}
      </div>
    </div>
  );
}
