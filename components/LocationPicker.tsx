"use client";

import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Field, inputCls } from "./ui";

type Location = { city: string; lat: number; lon: number };
type Place = {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: Record<string, string>;
};

const marker = L.icon({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapCenter({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, Math.max(map.getZoom(), 12), { duration: 0.5 });
  }, [map, position]);

  return null;
}

function MapClick({ onSelect }: { onSelect: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function placeName(place: Place): string {
  const address = place.address;
  const locality = address?.city
    || address?.town
    || address?.village
    || address?.municipality
    || address?.hamlet
    || address?.city_district
    || address?.county
    || place.name;
  const name = [locality, address?.country].filter(Boolean).join(", ");
  return name || place.display_name;
}

export function LocationPicker({ value, onChange }: { value: Location; onChange: (location: Location) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRequestAt = useRef(0);
  const sequence = useRef(0);
  const position = useMemo<[number, number]>(() => [value.lat, value.lon], [value.lat, value.lon]);

  useEffect(() => () => {
    request.current?.abort();
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const lookup = (url: URL, onPlace: (place: Place) => void) => {
    const current = ++sequence.current;
    request.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    setError("");
    setStatus("Looking up location…");

    const delay = Math.max(0, 1000 - (Date.now() - lastRequestAt.current));
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      lastRequestAt.current = Date.now();

      try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new Error(`Location service returned ${response.status}.`);
        const result = await response.json() as Place | Place[];
        const place = Array.isArray(result) ? result[0] : result;
        if (!place || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lon))) {
          throw new Error("No matching location was found.");
        }
        if (sequence.current === current) {
          onPlace(place);
          setStatus("");
        }
      } catch (reason) {
        if (controller.signal.aborted || sequence.current !== current) return;
        setStatus("");
        setError(reason instanceof Error ? reason.message : "Location lookup failed.");
      }
    }, delay);
  };

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const searchTerm = query.trim();
    if (!searchTerm) {
      setError("Enter a city or address to search.");
      return;
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({ format: "jsonv2", addressdetails: "1", limit: "1", q: searchTerm }).toString();
    lookup(url, (place) => {
      const lat = Number(place.lat);
      const lon = Number(place.lon);
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        setError("The location service returned invalid coordinates.");
        return;
      }
      const city = placeName(place);
      onChange({ city, lat, lon });
      setQuery(city);
    });
  };

  const selectCoordinates = (lat: number, lon: number) => {
    const city = `Selected location (${lat.toFixed(5)}, ${lon.toFixed(5)})`;
    onChange({ city, lat, lon });

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.search = new URLSearchParams({
      format: "jsonv2",
      addressdetails: "1",
      lat: String(lat),
      lon: String(lon),
    }).toString();
    lookup(url, (place) => {
      onChange({ city: placeName(place), lat, lon });
      setQuery(placeName(place));
    });
  };

  return (
    <div className="space-y-3">
      <Field label="Search for a city or address">
        <form className="flex gap-2" onSubmit={search}>
          <input
            className={inputCls}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Mumbai, India"
            aria-label="Search for a city or address"
          />
          <button type="submit" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400">
            <Search size={16} /> Search
          </button>
        </form>
      </Field>

      <div className="h-72 overflow-hidden rounded-xl border border-violet-400/20">
        <MapContainer center={position} zoom={12} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenter position={position} />
          <MapClick onSelect={selectCoordinates} />
          <Marker position={position} icon={marker} />
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400">Search for a place or click the map to set the exact chart coordinates. Map and place data © OpenStreetMap contributors.</p>
      {status && <p role="status" className="text-xs text-violet-200">{status}</p>}
      {error && <p role="alert" className="text-xs text-red-300">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-1">
        <Field label="Selected City / Country">
          <input className={inputCls} value={value.city} readOnly />
        </Field>
      </div>
    </div>
  );
}
