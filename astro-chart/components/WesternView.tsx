"use client";
import type { BirthInput, FullChart } from "@/lib/astro/types";
import { fmtLon, GLYPH } from "@/lib/astro/constants";
import { westernMd } from "@/lib/astro/export";
import { Card, CopyButton, DataTable } from "./ui";
import { Wheel } from "./Charts";

export function WesternView({ input, chart }: { input: BirthInput; chart: FullChart }) {
  const w = chart.western;
  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">Tropical zodiac · <span className="capitalize">{input.houseSystem}</span> houses · Asc {fmtLon(w.asc)} · MC {fmtLon(w.mc)}</p>
        <CopyButton getText={() => westernMd(input, chart)} />
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-5">
        <Card title="Chart Wheel" className="lg:col-span-2"><Wheel pts={[...w.bodies.filter((b) => b.key !== "SN"), { key: "MC", lon: w.mc, name: "" } as never]} cusps={w.cusps} asc={w.asc} /></Card>
        <Card title="Placements" className="lg:col-span-3">
          <DataTable head={["Body", "Position", "House", ""]} rows={w.bodies.map((b) => [<span key={b.key}><span className="mr-2 text-violet-300">{GLYPH[b.key]}</span>{b.name}</span>, fmtLon(b.lon), b.house, b.retro ? <span className="text-fuchsia-300">Rx</span> : ""])} />
        </Card>
      </div>
      <div className="grid min-w-0 gap-5 lg:grid-cols-3">
        <Card title="House Cusps"><DataTable head={["House", "Cusp"]} rows={w.cusps.map((l, i) => [i + 1, fmtLon(l)])} /></Card>
        <Card title="Major Aspects" className="lg:col-span-2">
          <DataTable head={["Body", "Aspect", "Body", "Orb"]} rows={w.aspects.map((a) => [a.a, <span key={a.a + a.b} className="text-violet-300">{a.type}</span>, a.b, `${a.orb}°`])} />
        </Card>
      </div>
    </div>
  );
}
