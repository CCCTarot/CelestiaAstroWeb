"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Save } from "lucide-react";
import type { BirthInput } from "@/lib/astro/types";
import { Card, Field, inputCls } from "./ui";

const LocationPicker = dynamic(() => import("./LocationPicker").then((module) => module.LocationPicker), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-400">Loading map…</p>,
});

export function InputForm({ value, onChange, onSave }: { value: BirthInput; onChange: (v: BirthInput) => void; onSave: (n: string, t: string, notes: string) => void }) {
  const set = <K extends keyof BirthInput>(k: K, v: BirthInput[K]) => onChange({ ...value, [k]: v });
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(""), [tag, setTag] = useState("Personal"), [notes, setNotes] = useState("");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card title="Birth Data" className="lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name"><input className={inputCls} value={value.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Date of Birth"><input type="date" className={inputCls} value={value.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="Exact Local Time"><input type="time" className={inputCls} value={value.time} onChange={(e) => set("time", e.target.value)} /></Field>
          <div className="sm:col-span-2">
            <LocationPicker
              value={{ city: value.city, lat: value.lat, lon: value.lon }}
              onChange={(location) => onChange({ ...value, ...location })}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">The chart uses the map coordinates and the time zone rules in effect at the selected birth date and time.</p>
      </Card>

      <div className="space-y-5">
        <Card title="Calculation Settings">
          <div className="space-y-4">
            <Field label="House System (Western)">
              <select className={inputCls} value={value.houseSystem} onChange={(e) => set("houseSystem", e.target.value as BirthInput["houseSystem"])}>
                <option value="placidus">Placidus</option><option value="whole">Whole Sign</option><option value="equal">Equal</option>
              </select>
            </Field>
            <Field label="Ayanamsa (Vedic)">
              <select className={inputCls} value={value.ayanamsa} onChange={(e) => set("ayanamsa", e.target.value as BirthInput["ayanamsa"])}>
                <option value="lahiri">Lahiri (Chitrapaksha)</option><option value="krishnamurti">Krishnamurti (KP)</option><option value="raman">Raman</option>
              </select>
            </Field>
          </div>
        </Card>
        <Card title="Save Profile" icon={<Save size={14} />}>
          {!open ? (
            <button onClick={() => { setN(value.name); setOpen(true); }} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:brightness-110">Save Chart Profile</button>
          ) : (
            <div className="space-y-3">
              <Field label="Profile Name"><input className={inputCls} value={n} onChange={(e) => setN(e.target.value)} /></Field>
              <Field label="Category / Tag">
                <input list="tags" className={inputCls} value={tag} onChange={(e) => setTag(e.target.value)} />
                <datalist id="tags">{["Personal", "Friends", "Synastry", "Client"].map((t) => <option key={t} value={t} />)}</datalist>
              </Field>
              <Field label="Notes (optional)"><textarea rows={2} className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              <div className="flex gap-2">
                <button disabled={!n.trim()} onClick={() => { onSave(n.trim(), tag.trim() || "Personal", notes); setOpen(false); setNotes(""); }} className="flex-1 rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Save</button>
                <button onClick={() => setOpen(false)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300">Cancel</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
