"use client";
import { useMemo, useState } from "react";
import { Copy, Download, Pencil, Search, Trash2, Check, X } from "lucide-react";
import type { Profile } from "@/lib/astro/types";
import { Card, btnCls, inputCls } from "./ui";

interface Props {
  profiles: Profile[]; activeId: string | null; selected: string[]; setSelected: (ids: string[]) => void;
  onLoad: (p: Profile) => void; onUpdate: (id: string, patch: Partial<Profile>) => void;
  onDelete: (id: string) => void; onDuplicate: (id: string) => void; onExportOne: (p: Profile) => void; onBatch: () => void;
}

export function ProfileManager(p: Props) {
  const [q, setQ] = useState(""), [tag, setTag] = useState("All");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", tag: "", notes: "" });
  const tags = useMemo(() => ["All", ...Array.from(new Set(p.profiles.map((x) => x.tag)))], [p.profiles]);
  const list = p.profiles.filter((x) => (tag === "All" || x.tag === tag) && `${x.name} ${x.notes} ${x.input.city}`.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => p.setSelected(p.selected.includes(id) ? p.selected.filter((s) => s !== id) : [...p.selected, id]);

  return (
    <Card title={`Saved Profiles (${p.profiles.length})`}
      right={<button disabled={!p.selected.length} onClick={p.onBatch} className={`${btnCls} disabled:opacity-40`}>Batch Export ({p.selected.length}) →</button>}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search size={14} className="absolute left-3 top-3 text-slate-500" />
          <input className={`${inputCls} pl-9`} placeholder="Search name, notes, city…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex flex-wrap gap-1.5">{tags.map((t) => (
          <button key={t} onClick={() => setTag(t)} className={`rounded-full px-3 py-1 text-xs ${tag === t ? "bg-violet-500 text-white" : "border border-violet-400/20 text-violet-200 hover:bg-violet-500/15"}`}>{t}</button>))}
        </div>
      </div>
      {!list.length && <p className="py-10 text-center text-sm text-slate-500">No profiles yet. Save one from the Input tab.</p>}
      <ul className="space-y-2">
        {list.map((x) => (
          <li key={x.id} className={`rounded-xl border p-3 transition ${p.activeId === x.id ? "border-violet-400/60 bg-violet-500/10" : "border-white/5 bg-white/[0.02] hover:border-violet-400/30"}`}>
            <div className="flex items-start gap-3">
              <input type="checkbox" className="mt-1.5 accent-violet-500" checked={p.selected.includes(x.id)} onChange={() => toggle(x.id)} />
              {editing === x.id ? (
                <div className="flex-1 space-y-2">
                  <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                  <input className={inputCls} value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} />
                  <textarea rows={2} className={inputCls} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                  <div className="flex gap-2">
                    <button className={btnCls} onClick={() => { p.onUpdate(x.id, draft); setEditing(null); }}><Check size={12} />Save</button>
                    <button className={btnCls} onClick={() => setEditing(null)}><X size={12} />Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="flex-1 text-left" onClick={() => p.onLoad(x)}>
                  <div className="flex items-center gap-2"><span className="font-display font-semibold text-white">{x.name}</span>
                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-indigo-200">{x.tag}</span></div>
                  <div className="text-xs text-slate-400">{x.input.date} · {x.input.time} · {x.input.city}</div>
                  {x.notes && <div className="mt-1 text-xs text-slate-500">{x.notes}</div>}
                </button>
              )}
              {editing !== x.id && (
                <div className="flex gap-1.5">
                  <button title="Edit" className={btnCls} onClick={() => { setEditing(x.id); setDraft({ name: x.name, tag: x.tag, notes: x.notes }); }}><Pencil size={12} /></button>
                  <button title="Duplicate" className={btnCls} onClick={() => p.onDuplicate(x.id)}><Copy size={12} /></button>
                  <button title="Export" className={btnCls} onClick={() => p.onExportOne(x)}><Download size={12} /></button>
                  <button title="Delete" className={`${btnCls} hover:!bg-red-500/30`} onClick={() => confirm(`Delete "${x.name}"?`) && p.onDelete(x.id)}><Trash2 size={12} /></button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
