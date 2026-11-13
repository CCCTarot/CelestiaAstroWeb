import type { BirthInput, FullChart, Placement, VedicBody } from "./astro/types";
import { SIGNS } from "./astro/constants";

export const TOPIC_KEYS = [
  "love",
  "career",
  "health",
  "pastLife",
  "strengths",
  "weaknesses",
] as const;

export type TopicKey = (typeof TOPIC_KEYS)[number];
export type ChartSystem = "western" | "vedic";

export interface PlanetPlacement {
  name: string;
  sign: string;
  degree?: number;
  house?: number;
  retrograde?: boolean;
  nakshatra?: string;
  pada?: number;
  nakshatraLord?: string;
}

export interface DashaPeriod {
  lord: string;
  start: string;
  end: string;
}

export interface ChartData {
  system: ChartSystem;
  name: string;
  birth: { date: string; time: string; place: string };
  settings: string;
  ascendant: { sign: string; degree: number; nakshatra?: string };
  planets: PlanetPlacement[];
  houses: { house: number; sign: string; cuspDegree?: number }[];
  aspects?: string[];
  navamsha?: PlanetPlacement[];
  mahadashas?: DashaPeriod[];
  currentMahadasha?: DashaPeriod;
  antardashas?: DashaPeriod[];
}

export interface TopicSummary {
  headline: string;
  summary: string;
  keyPlacements: string[];
  timing?: string;
}

export type ChartSummary = Record<TopicKey, TopicSummary>;

const signDegree = (placement: Placement | VedicBody) => placement.lon % 30;

function mapWestern(input: BirthInput, chart: FullChart): ChartData {
  const { western } = chart;
  return {
    system: "western",
    name: input.name,
    birth: { date: input.date, time: input.time, place: input.city },
    settings: `Tropical zodiac, ${input.houseSystem} houses`,
    ascendant: {
      sign: SIGNS[Math.floor(western.asc / 30)],
      degree: western.asc % 30,
    },
    planets: western.bodies.map((body) => ({
      name: body.name,
      sign: SIGNS[body.sign],
      degree: signDegree(body),
      house: body.house,
      retrograde: body.retro,
    })),
    houses: western.cusps.map((cusp, index) => ({
      house: index + 1,
      sign: SIGNS[Math.floor(cusp / 30)],
      cuspDegree: cusp % 30,
    })),
    aspects: western.aspects.map(
      (aspect) => `${aspect.a} ${aspect.type.toLowerCase()} ${aspect.b} (orb ${aspect.orb}°)`,
    ),
  };
}

function mapVedic(input: BirthInput, chart: FullChart): ChartData {
  const { vedic } = chart;
  const currentMaha = vedic.periods.find((period) => period.lord === vedic.current?.maha);
  const currentAntar = currentMaha?.antardashas.find((period) => period.lord === vedic.current?.antar);
  const mapBody = (body: VedicBody): PlanetPlacement => ({
    name: body.name,
    sign: SIGNS[body.sign],
    degree: signDegree(body),
    house: body.house,
    retrograde: body.retro,
    nakshatra: body.nakshatra,
    pada: body.pada,
    nakshatraLord: body.lord,
  });

  return {
    system: "vedic",
    name: input.name,
    birth: { date: input.date, time: input.time, place: input.city },
    settings: `Sidereal zodiac, ${input.ayanamsa} ayanamsa`,
    ascendant: {
      sign: SIGNS[vedic.lagna.sign],
      degree: signDegree(vedic.lagna),
      nakshatra: vedic.lagna.nakshatra,
    },
    planets: vedic.bodies.map(mapBody),
    houses: Array.from({ length: 12 }, (_, index) => ({
      house: index + 1,
      sign: SIGNS[(vedic.lagna.sign + index) % 12],
    })),
    navamsha: [
      { ...mapBody(vedic.lagna), sign: SIGNS[vedic.lagna.navSign], house: 1 },
      ...vedic.bodies.map((body) => ({
        ...mapBody(body),
        sign: SIGNS[body.navSign],
        house: ((body.navSign - vedic.lagna.navSign + 12) % 12) + 1,
      })),
    ],
    mahadashas: vedic.periods.map(({ lord, start, end }) => ({ lord, start, end })),
    currentMahadasha: currentMaha
      ? { lord: currentMaha.lord, start: currentMaha.start, end: currentMaha.end }
      : undefined,
    antardashas: currentMaha?.antardashas.map(({ lord, start, end }) => ({ lord, start, end })),
  };
}

export function toChartData(system: ChartSystem, input: BirthInput, chart: FullChart): ChartData {
  return system === "vedic" ? mapVedic(input, chart) : mapWestern(input, chart);
}
