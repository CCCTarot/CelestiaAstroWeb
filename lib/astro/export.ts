import { calcChart } from "./engine";
import { fmtLon, SIGNS } from "./constants";
import type { BirthInput, FullChart } from "./types";

const table = (head: string[], rows: (string | number)[][]) =>
  [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");

const header = (i: BirthInput, c: FullChart, label?: string) =>
  `# Chart: ${label || i.name}\n- Birth: ${i.date} ${i.time} local (UTC offset ${i.tz >= 0 ? "+" : ""}${i.tz}h → ${c.utc})\n- Place: ${i.city} (${i.lat.toFixed(4)}, ${i.lon.toFixed(4)})`;

export function westernMd(i: BirthInput, c: FullChart, label?: string) {
  const w = c.western;
  return [
    header(i, c, label),
    `\n## Western (Tropical) — ${i.houseSystem} houses`,
    `- Ascendant: ${fmtLon(w.asc)} | MC: ${fmtLon(w.mc)} | Descendant: ${fmtLon(w.asc + 180)} | IC: ${fmtLon(w.mc + 180)}`,
    "\n### Placements",
    table(["Body", "Position", "House", "Retro"], w.bodies.map((b) => [b.name, fmtLon(b.lon), b.house, b.retro ? "Rx" : ""])),
    "\n### House Cusps",
    table(["House", "Cusp"], w.cusps.map((l, k) => [k + 1, fmtLon(l)])),
    "\n### Major Aspects",
    table(["Body A", "Aspect", "Body B", "Orb"], w.aspects.map((a) => [a.a, a.type, a.b, `${a.orb}°`])),
  ].join("\n");
}

export function vedicMd(i: BirthInput, c: FullChart, label?: string) {
  const v = c.vedic;
  const cur = v.periods.find((p) => p.lord === v.current?.maha);
  return [
    header(i, c, label),
    `\n## Vedic (Sidereal) — ${i.ayanamsa} ayanamsa ${v.ayanamsaValue.toFixed(4)}°, whole-sign houses`,
    `- Lagna: ${fmtLon(v.lagna.lon)} (${v.lagna.nakshatra} pada ${v.lagna.pada}) | D9 Lagna: ${SIGNS[v.lagna.navSign]}`,
    "\n### D1 Rashi + Nakshatra + D9",
    table(["Graha", "Rashi Position", "House", "Retro", "Nakshatra (Pada)", "Nak. Lord", "D9 Sign"],
      v.bodies.map((b) => [b.name, fmtLon(b.lon), b.house, b.retro ? "Rx" : "", `${b.nakshatra} (${b.pada})`, b.lord, SIGNS[b.navSign]])),
    `\n### Vimshottari Dasha${v.current ? ` — now ${v.current.maha} / ${v.current.antar}` : ""}`,
    table(["Mahadasha", "Start", "End"], v.periods.map((p) => [p.lord, p.start, p.end])),
    cur ? `\n#### Antardashas in ${cur.lord} Mahadasha\n` + table(["Antardasha", "Start", "End"], cur.antardashas.map((a) => [a.lord, a.start, a.end])) : "",
  ].join("\n");
}

export interface ExportItem { label: string; tag?: string; notes?: string; input: BirthInput }

export function combinedMd(items: ExportItem[], scope: "both" | "western" | "vedic" = "both") {
  const body = items.map((it) => {
    const c = calcChart(it.input);
    const meta = [it.tag ? `Tag: ${it.tag}` : "", it.notes ? `Notes: ${it.notes}` : ""].filter(Boolean).join(" | ");
    return [scope !== "vedic" ? westernMd(it.input, c, it.label) : "", scope !== "western" ? vedicMd(it.input, c, scope === "vedic" ? it.label : undefined) : "", meta]
      .filter(Boolean).join("\n\n");
  });
  const task = items.length > 1
    ? "Compare these charts: synastry/group dynamics, key aspects between them, strengths and friction points."
    : "Interpret this chart: core personality, strengths, challenges, and current timing.";
  return `${body.join("\n\n---\n\n")}\n\n---\n## Task for the AI\n${task} Use the data above exactly as given; do not recompute positions.\n`;
}
