"use client";
import { GLYPH, SIGN_GLYPH } from "@/lib/astro/constants";
import { norm } from "@/lib/astro/engine";

export function Wheel({
  pts,
  cusps,
  asc,
  palette,
}: {
  pts: { key: string; lon: number }[];
  cusps: number[];
  asc: number;
  palette?: { primary: string; secondary: string; accent: string; grid: string; text: string; center: string };
}) {
  const colors = palette ?? {
    primary: "#818cf8",
    secondary: "#6d5bd0",
    accent: "#e879f9",
    grid: "#4c3fa0",
    text: "#f5f3ff",
    center: "#0B0F17",
  };
  const c = 180, ang = (lon: number) => (180 + norm(lon - asc)) * (Math.PI / 180);
  const xy = (lon: number, r: number) => [c + r * Math.cos(ang(lon)), c - r * Math.sin(ang(lon))];
  // nudge overlapping glyphs apart (display only)
  const sorted = [...pts].sort((a, b) => a.lon - b.lon);
  const disp: Record<string, number> = {};
  sorted.forEach((p, i) => { disp[p.key] = i && p.lon - disp[sorted[i - 1].key] < 8 ? disp[sorted[i - 1].key] + 8 : p.lon; });
  return (
    <svg viewBox="0 0 360 360" className="mx-auto w-full max-w-[420px]">
      <defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stopColor={colors.primary} /><stop offset="1" stopColor={colors.accent} /></linearGradient></defs>
      <circle cx={c} cy={c} r={172} fill="none" stroke="url(#rg)" strokeWidth={1.5} />
      <circle cx={c} cy={c} r={140} fill="none" stroke={colors.secondary} strokeOpacity={0.5} />
      <circle cx={c} cy={c} r={62} fill={colors.center} stroke={colors.secondary} strokeOpacity={0.4} />
      {Array.from({ length: 12 }, (_, s) => {
        const [x1, y1] = xy(s * 30, 140), [x2, y2] = xy(s * 30, 172), [tx, ty] = xy(s * 30 + 15, 156);
        return <g key={s}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.secondary} strokeOpacity={0.6} />
          <text x={tx} y={ty} fill={colors.secondary} fontSize={13} textAnchor="middle" dominantBaseline="middle">{SIGN_GLYPH[s]}</text></g>;
      })}
      {cusps.map((l, i) => {
        const [x1, y1] = xy(l, 62), [x2, y2] = xy(l, 140), [tx, ty] = xy(l + 8, 74);
        return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 3 === 0 ? colors.accent : colors.grid} strokeWidth={i % 3 === 0 ? 1.6 : 0.8} />
          <text x={tx} y={ty} fill={colors.grid} fontSize={8} textAnchor="middle">{i + 1}</text></g>;
      })}
      {pts.map((p) => {
        const [x, y] = xy(disp[p.key], 112), [dx, dy] = xy(p.lon, 140);
        return <g key={p.key}><circle cx={dx} cy={dy} r={1.8} fill={colors.accent} />
          <text x={x} y={y} fill={colors.text} fontSize={14} textAnchor="middle" dominantBaseline="middle">{GLYPH[p.key] ?? p.key}</text></g>;
      })}
    </svg>
  );
}

const POS: Record<number, [number, number]> = {
  11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 10: [1, 0], 3: [1, 3], 9: [2, 0], 4: [2, 3], 8: [3, 0], 7: [3, 1], 6: [3, 2], 5: [3, 3],
};
export interface PrintChartPalette {
  ink: string;
  accent: string;
  surface: string;
  border: string;
}

export function SouthIndian({ title, centerLabel = "Rashi", map, lagnaSign, palette }: { title?: string; centerLabel?: string; map: Record<number, string[]>; lagnaSign: number; palette?: PrintChartPalette }) {
  return (
    <div>
      {title && <p className="mb-2 text-center text-xs uppercase tracking-widest text-violet-300/80" style={palette ? { color: palette.accent } : undefined}>{title}</p>}
      <div className="mx-auto grid aspect-square w-full max-w-[360px] grid-cols-4 grid-rows-4 gap-px rounded-lg p-px" style={palette ? { background: palette.border } : undefined}>
        {Array.from({ length: 16 }, (_, k) => {
          const r = Math.floor(k / 4), col = k % 4;
          const sign = Object.entries(POS).find(([, [rr, cc]]) => rr === r && cc === col)?.[0];
          if (sign === undefined) return <div key={k} className={k === 5 ? "col-span-2 row-span-2 grid place-items-center bg-[#0B0F17] font-display text-violet-300" : "hidden"} style={palette && k === 5 ? { background: palette.surface, color: palette.ink } : undefined}>{k === 5 ? centerLabel : ""}</div>;
          const s = Number(sign);
          return (
            <div key={k} className="relative bg-[#0B0F17] p-1.5 text-xs" style={palette ? { background: palette.surface, color: palette.ink } : undefined}>
              <span className="absolute right-1 top-0.5 text-[10px] text-slate-600" style={palette ? { color: palette.accent } : undefined}>{SIGN_GLYPH[s]}</span>
              {s === lagnaSign && <span className="absolute left-1 top-0.5 text-[10px] font-bold text-fuchsia-300" style={palette ? { color: palette.ink } : undefined}>Asc</span>}
              <div className="mt-3 flex flex-wrap gap-x-1.5 text-violet-100" style={palette ? { color: palette.ink } : undefined}>{(map[s] ?? []).map((n) => <span key={n}>{n}</span>)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NORTH_CENTERS: [number, number][] = [
  [150, 75], [75, 25], [25, 75], [75, 150], [25, 225], [75, 275],
  [150, 225], [225, 275], [275, 225], [225, 150], [275, 75], [225, 25],
];

export function NorthIndian({ map, lagnaSign, palette }: { map: Record<number, string[]>; lagnaSign: number; palette?: PrintChartPalette }) {
  const ink = palette?.ink ?? "#e5e7f5";
  const accent = palette?.accent ?? "#c4b5fd";
  const surface = palette?.surface ?? "#0B0F17";
  return (
    <svg viewBox="0 0 300 300" role="img" aria-label="North Indian Vedic chart" className="mx-auto w-full max-w-[360px]">
      <rect x={0.5} y={0.5} width={299} height={299} fill={surface} stroke={palette?.border ?? "#6d5bd0"} />
      <path d="M0 0L300 300M300 0L0 300M150 0L300 150L150 300L0 150Z" fill="none" stroke={palette?.border ?? "#6d5bd0"} />
      {NORTH_CENTERS.map(([x, y], index) => {
        const house = index + 1;
        const contents = house === 1 ? ["Asc", ...(map[house] ?? [])] : map[house] ?? [];
        return (
          <g key={house}>
            <text x={x} y={y - 12} textAnchor="middle" fontSize={10} fill={accent}>{SIGN_GLYPH[(lagnaSign + index) % 12]}</text>
            {chunkChart(contents, 3).map((row, rowIndex) => (
              <text key={rowIndex} x={x} y={y + 3 + rowIndex * 12} textAnchor="middle" fontSize={10} fill={ink}>{row.join(" ")}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function chunkChart(items: string[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));
}
