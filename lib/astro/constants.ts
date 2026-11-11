export const SIGNS = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"];
export const SIGN_GLYPH = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];
export const GLYPH: Record<string, string> = {
  Su:"☉", Mo:"☽", Me:"☿", Ve:"♀", Ma:"♂", Ju:"♃", Sa:"♄", Ur:"♅", Ne:"♆", Pl:"♇",
  Ch:"⚷", NN:"☊", SN:"☋", Ra:"☊", Ke:"☋", La:"Asc",
};
export const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
export const DASHA_LORDS = ["Ketu","Venus","Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury"];
export const DASHA_YEARS: Record<string, number> = { Ketu:7, Venus:20, Sun:6, Moon:10, Mars:7, Rahu:18, Jupiter:16, Saturn:19, Mercury:17 };
export const ASPECT_DEFS: [string, number, number][] = [
  ["Conjunction", 0, 8], ["Sextile", 60, 5], ["Square", 90, 7], ["Trine", 120, 8], ["Opposition", 180, 8],
];
export const fmtLon = (lon: number) => {
  const s = Math.floor(lon / 30), d = Math.floor(lon % 30), m = Math.floor((lon % 1) * 60);
  return `${d}°${String(m).padStart(2, "0")}′ ${SIGNS[s]}`;
};
