import * as A from "astronomy-engine";
import type { BirthInput, Placement, WesternChart, VedicChart, VedicBody, Maha, FullChart, HouseSystem, AyanamsaKind } from "./types";
import { NAKSHATRAS, DASHA_LORDS, DASHA_YEARS, ASPECT_DEFS } from "./constants";

const R = Math.PI / 180, D = 180 / Math.PI;
export const norm = (x: number) => ((x % 360) + 360) % 360;
const sdiff = (a: number, b: number) => { const d = norm(a - b); return d > 180 ? d - 360 : d; };
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const BODIES: { key: string; name: string; body: A.Body }[] = [
  { key: "Su", name: "Sun", body: A.Body.Sun }, { key: "Mo", name: "Moon", body: A.Body.Moon },
  { key: "Me", name: "Mercury", body: A.Body.Mercury }, { key: "Ve", name: "Venus", body: A.Body.Venus },
  { key: "Ma", name: "Mars", body: A.Body.Mars }, { key: "Ju", name: "Jupiter", body: A.Body.Jupiter },
  { key: "Sa", name: "Saturn", body: A.Body.Saturn }, { key: "Ur", name: "Uranus", body: A.Body.Uranus },
  { key: "Ne", name: "Neptune", body: A.Body.Neptune }, { key: "Pl", name: "Pluto", body: A.Body.Pluto },
];

export function toUTC(i: BirthInput): Date {
  const [y, m, d] = i.date.split("-").map(Number);
  const [hh, mm] = i.time.split(":").map(Number);
  if ([y, m, d, hh, mm].some(Number.isNaN)) throw new Error("Invalid date or time");
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - i.tz * 3600000);
}

/** Tropical ecliptic longitude of date (apparent, aberration-corrected). */
function tropLon(body: A.Body, t: A.AstroTime): number {
  const v = A.GeoVector(body, t, true);
  const e = A.RotateVector(A.Rotation_EQJ_ECT(t), v);
  return norm(A.SphereFromVector(e).lon);
}

/** Chiron: Keplerian approximation (no ephemeris in astronomy-engine). Expect ~1–2° error. */
function chironLon(t: A.AstroTime): number {
  const jd = t.ut + 2451545, a = 13.71, e = 0.383;
  const inc = 6.93 * R, Om = 209.2 * R, w = 339.4 * R;
  const P = Math.pow(a, 1.5) * 365.25;
  const M = norm((360 * (jd - 2450127.5)) / P) * R; // perihelion Feb 1996
  let E = M; for (let i = 0; i < 60; i++) E = M + e * Math.sin(E);
  const x = a * (Math.cos(E) - e), y = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(Om), sO = Math.sin(Om), ci = Math.cos(inc);
  const X = x * (cw * cO - sw * sO * ci) - y * (sw * cO + cw * sO * ci);
  const Y = x * (cw * sO + sw * cO * ci) - y * (sw * sO - cw * cO * ci);
  const earth = A.RotateVector(A.Rotation_EQJ_ECL(), A.HelioVector(A.Body.Earth, t));
  return norm(Math.atan2(Y - earth.y, X - earth.x) * D + 0.01396971 * (t.ut / 365.25));
}
const meanNode = (t: A.AstroTime) => norm(125.04452 - 1934.136261 * (t.ut / 36525));

const ascendant = (ramc: number, lat: number, eps: number) =>
  norm(D * Math.atan2(Math.cos(ramc * R), -(Math.sin(ramc * R) * Math.cos(eps * R) + Math.tan(lat * R) * Math.sin(eps * R))));
const midheaven = (ramc: number, eps: number) =>
  norm(D * Math.atan2(Math.sin(ramc * R), Math.cos(ramc * R) * Math.cos(eps * R)));

function placidusCusp(ramc: number, lat: number, eps: number, frac: number, ra0: number, nocturnal: boolean) {
  let ra = ra0, lam = 0;
  for (let i = 0; i < 40; i++) {
    lam = Math.atan2(Math.sin(ra * R), Math.cos(ra * R) * Math.cos(eps * R));
    const dec = Math.asin(Math.sin(eps * R) * Math.sin(lam));
    const SA = D * Math.acos(Math.max(-1, Math.min(1, -Math.tan(lat * R) * Math.tan(dec))));
    ra = nocturnal ? ramc + SA + frac * (180 - SA) : ramc + frac * SA;
  }
  return norm(lam * D);
}

function houses(sys: HouseSystem, ramc: number, lat: number, eps: number, asc: number, mc: number): number[] {
  if (sys === "whole") { const s = Math.floor(asc / 30) * 30; return Array.from({ length: 12 }, (_, i) => norm(s + 30 * i)); }
  if (sys === "equal" || Math.abs(lat) > 66) return Array.from({ length: 12 }, (_, i) => norm(asc + 30 * i));
  const c11 = placidusCusp(ramc, lat, eps, 1 / 3, ramc + 30, false);
  const c12 = placidusCusp(ramc, lat, eps, 2 / 3, ramc + 60, false);
  const c2 = placidusCusp(ramc, lat, eps, 1 / 3, ramc + 120, true);
  const c3 = placidusCusp(ramc, lat, eps, 2 / 3, ramc + 150, true);
  return [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180), norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
}
const houseOf = (lon: number, cusps: number[]) => {
  for (let i = 0; i < 12; i++) if (norm(lon - cusps[i]) < norm(cusps[(i + 1) % 12] - cusps[i])) return i + 1;
  return 1;
};
const mk = (key: string, name: string, lon: number, retro: boolean, house: number): Placement => ({
  key, name, lon, retro, house, sign: Math.floor(lon / 30), deg: Math.floor(lon % 30), min: Math.floor((lon % 1) * 60),
});

export function ayanamsaValue(kind: AyanamsaKind, jd: number) {
  const lahiri = 23.85306 + ((jd - 2451545) / 365.25) * 0.013969;
  return lahiri + { lahiri: 0, krishnamurti: -0.0983, raman: -1.4833 }[kind];
}

function dashas(moonSid: number, birthMs: number, nowMs: number) {
  const YMS = 365.25 * 86400000, len = 360 / 27;
  const idx = Math.floor(moonSid / len), frac = (moonSid % len) / len;
  const first = idx % 9;
  let start = birthMs - frac * DASHA_YEARS[DASHA_LORDS[first]] * YMS;
  const periods: Maha[] = [];
  for (let k = 0; k < 9; k++) {
    const lord = DASHA_LORDS[(first + k) % 9], yrs = DASHA_YEARS[lord], end = start + yrs * YMS;
    let s = start;
    const antardashas = Array.from({ length: 9 }, (_, j) => {
      const al = DASHA_LORDS[(first + k + j) % 9], d = (yrs * DASHA_YEARS[al] / 120) * YMS;
      const row = { lord: al, start: iso(s), end: iso(s + d) }; s += d; return row;
    });
    periods.push({ lord, start: iso(start), end: iso(end), antardashas });
    start = end;
  }
  const n = iso(nowMs);
  const maha = periods.find((p) => p.start <= n && n < p.end);
  const antar = maha?.antardashas.find((a) => a.start <= n && n < a.end);
  return { periods, current: maha && antar ? { maha: maha.lord, antar: antar.lord } : null };
}

export function calcChart(inp: BirthInput, now = new Date()): FullChart {
  const utc = toUTC(inp), t = A.MakeTime(utc);
  const jd = t.ut + 2451545;
  const ramc = norm(A.SiderealTime(t) * 15 + inp.lon);
  const eps = 23.4392911 - 0.0130042 * (t.ut / 36525);
  const asc = ascendant(ramc, inp.lat, eps), mc = midheaven(ramc, eps);
  const cusps = houses(inp.houseSystem, ramc, inp.lat, eps, asc, mc);

  const raw = BODIES.map((b) => {
    const lon = tropLon(b.body, t);
    const retro = sdiff(tropLon(b.body, t.AddDays(0.5)), tropLon(b.body, t.AddDays(-0.5))) < 0;
    return { ...b, lon, retro };
  });
  const nn = meanNode(t);
  const all = [
    ...raw.map((r) => ({ key: r.key, name: r.name, lon: r.lon, retro: r.retro })),
    { key: "Ch", name: "Chiron (approx.)", lon: chironLon(t), retro: false },
    { key: "NN", name: "North Node (mean)", lon: nn, retro: false },
    { key: "SN", name: "South Node (mean)", lon: norm(nn + 180), retro: false },
  ];
  const bodies = all.map((b) => mk(b.key, b.name, b.lon, b.retro, houseOf(b.lon, cusps)));

  const pts = [...all.filter((b) => b.key !== "SN"), { key: "Asc", name: "Ascendant", lon: asc }, { key: "MC", name: "Midheaven", lon: mc }];
  const aspects = [];
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const sep = Math.abs(sdiff(pts[i].lon, pts[j].lon));
    for (const [type, ang, orb] of ASPECT_DEFS) {
      const o = Math.abs(sep - ang);
      if (o <= orb) { aspects.push({ a: pts[i].name, b: pts[j].name, type, orb: +o.toFixed(2) }); break; }
    }
  }
  const western: WesternChart = { bodies, cusps, asc, mc, aspects };

  // ---- Vedic ----
  const ay = ayanamsaValue(inp.ayanamsa, jd);
  const sid = (l: number) => norm(l - ay);
  const lagnaLon = sid(asc), lagnaSign = Math.floor(lagnaLon / 30);
  const vb = (key: string, name: string, tropical: number, retro: boolean): VedicBody => {
    const lon = sid(tropical), sign = Math.floor(lon / 30);
    const nakLen = 360 / 27, ni = Math.floor(lon / nakLen);
    return {
      ...mk(key, name, lon, retro, ((sign - lagnaSign + 12) % 12) + 1),
      nakshatra: NAKSHATRAS[ni], pada: Math.floor((lon % nakLen) / (nakLen / 4)) + 1,
      lord: DASHA_LORDS[ni % 9], navSign: Math.floor(lon / (30 / 9)) % 12,
    };
  };
  const g = (k: string) => raw.find((r) => r.key === k)!;
  const vBodies = [
    ...["Su", "Mo", "Me", "Ve", "Ma", "Ju", "Sa"].map((k) => vb(k, g(k).name, g(k).lon, g(k).retro)),
    vb("Ra", "Rahu", nn, true), vb("Ke", "Ketu", norm(nn + 180), true),
  ];
  const lagna = vb("La", "Lagna", asc, false);
  const moon = vBodies.find((b) => b.key === "Mo")!;
  const { periods, current } = dashas(moon.lon, utc.getTime(), now.getTime());
  return { western, vedic: { ayanamsaValue: ay, lagna, bodies: vBodies, periods, current }, utc: utc.toISOString() };
}
