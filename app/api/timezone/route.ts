import { NextResponse } from "next/server";
import tzLookup from "tz-lookup";

export const runtime = "nodejs";

function getOffsetMinutes(timeZone: string, instant: number): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(new Date(instant));
  const offset = parts.find((part) => part.type === "timeZoneName")?.value;
  const match = offset?.match(/^(?:GMT|UTC)(?:([+-])(\d{1,2})(?::?(\d{2}))?(?::?(\d{2}))?)?$/);
  if (!match) throw new Error("Could not determine the time zone offset.");

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return sign * (hours * 60 + minutes + seconds / 60);
}

function localTimeAt(timeZone: string, instant: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}`;
}

function offsetAtLocalBirth(timeZone: string, date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallTime = Date.UTC(year, month - 1, day, hour, minute);
  const target = `${date}T${time}`;
  const possibleOffsets = new Set<number>();

  for (let hours = -36; hours <= 36; hours += 6) {
    possibleOffsets.add(getOffsetMinutes(timeZone, wallTime + hours * 60 * 60 * 1000));
  }

  const matchingInstants = Array.from(possibleOffsets)
    .map((offset) => ({ offset, instant: wallTime - offset * 60 * 1000 }))
    .filter(({ instant }) => localTimeAt(timeZone, instant) === target)
    .sort((a, b) => a.instant - b.instant);

  if (matchingInstants.length === 0) {
    throw new Error("That local birth time does not exist in this location because the clocks changed. Choose a valid local time.");
  }

  return matchingInstants[0].offset / 60;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const lat = Number(params.get("lat"));
  const lon = Number(params.get("lon"));
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";

  if (
    !Number.isFinite(lat) || lat < -90 || lat > 90
    || !Number.isFinite(lon) || lon < -180 || lon > 180
    || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !/^\d{2}:\d{2}$/.test(time)
  ) {
    return NextResponse.json({ error: "Valid map coordinates, birth date, and local birth time are required." }, { status: 400 });
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day
    || hour > 23 || minute > 59
  ) {
    return NextResponse.json({ error: "The birth date or time is invalid." }, { status: 400 });
  }

  try {
    const timeZone = tzLookup(lat, lon);
    const offset = offsetAtLocalBirth(timeZone, date, time);
    return NextResponse.json({ timeZone, offset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not determine the time zone for this location." },
      { status: 422 },
    );
  }
}
