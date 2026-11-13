import tzLookup from "tz-lookup";

function offsetMinutesAtInstant(timeZone: string, instant: number): number {
  const parts = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "longOffset" }).formatToParts(new Date(instant));
  const value = parts.find((part) => part.type === "timeZoneName")?.value;
  const match = value?.match(/^(?:GMT|UTC)(?:([+-])(\d{1,2})(?::?(\d{2}))?(?::?(\d{2}))?)?$/);
  if (!match) throw new Error("Could not determine the time zone offset.");
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0) + Number(match[4] ?? 0) / 60);
}

function localTimeAt(timeZone: string, instant: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function lookupBirthTimeZone(lat: number, lon: number, date: string, time: string) {
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) throw new Error("Valid map coordinates are required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error("Valid birth date and local time are required.");
  const [year, month, day] = date.split("-").map(Number), [hour, minute] = time.split(":").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day || hour > 23 || minute > 59) throw new Error("The birth date or time is invalid.");
  const timeZone = tzLookup(lat, lon), wallTime = Date.UTC(year, month - 1, day, hour, minute), target = `${date}T${time}`, offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) offsets.add(offsetMinutesAtInstant(timeZone, wallTime + hours * 3_600_000));
  const instants = [...offsets].map((offset) => ({ offset, instant: wallTime - offset * 60_000 })).filter(({ instant }) => localTimeAt(timeZone, instant) === target).sort((a, b) => a.instant - b.instant);
  if (!instants.length) throw new Error("That local birth time does not exist at this location because the clocks changed.");
  return { timeZone, offset: instants[0].offset / 60 };
}
