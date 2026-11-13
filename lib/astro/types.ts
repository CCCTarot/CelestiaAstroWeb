export type HouseSystem = "placidus" | "whole" | "equal";
export type AyanamsaKind = "lahiri" | "krishnamurti" | "raman";

export interface BirthInput {
  name: string; date: string; time: string; // YYYY-MM-DD, HH:mm local
  city: string; lat: number; lon: number; tz: number; // tz = UTC offset in hours at birth
  houseSystem: HouseSystem; ayanamsa: AyanamsaKind;
}
export interface Placement {
  key: string; name: string; lon: number; retro: boolean;
  sign: number; deg: number; min: number; house: number;
}
export interface Aspect { a: string; b: string; type: string; orb: number }
export interface WesternChart { bodies: Placement[]; cusps: number[]; asc: number; mc: number; aspects: Aspect[] }
export interface VedicBody extends Placement { nakshatra: string; pada: number; lord: string; navSign: number }
export interface SubPeriod { lord: string; start: string; end: string }
export interface Maha extends SubPeriod { antardashas: SubPeriod[] }
export interface VedicChart {
  ayanamsaValue: number; lagna: VedicBody; bodies: VedicBody[];
  periods: Maha[]; current: { maha: string; antar: string } | null;
}
export interface FullChart { western: WesternChart; vedic: VedicChart; utc: string }
export interface Profile {
  id: string; name: string; tag: string; notes: string; input: BirthInput; createdAt: number;
}
