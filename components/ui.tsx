"use client";
import { ReactNode, useState } from "react";
import { Check, ClipboardCopy } from "lucide-react";

export function Card({ title, icon, right, children, className = "" }: { title?: string; icon?: ReactNode; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glow rounded-2xl border border-violet-400/10 bg-indigo-950/20 p-5 backdrop-blur ${className}`}>
      {(title || right) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-violet-200">{icon}{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-violet-400/20 text-xs uppercase tracking-wider text-violet-300/80">
          {head.map((h) => <th key={h} className="whitespace-nowrap px-3 py-2 font-medium">{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/5 text-slate-100 hover:bg-violet-500/5">
              {r.map((c, j) => <td key={j} className="whitespace-nowrap px-3 py-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CopyButton({ getText, label = "Copy Chart Data for AI" }: { getText: () => string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(getText()); setDone(true); setTimeout(() => setDone(false), 1800); } catch { alert("Clipboard blocked by the browser."); }
      }}
      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_28px_-6px_rgba(167,139,250,0.9)] transition hover:brightness-110 active:scale-95"
    >
      {done ? <Check size={16} /> : <ClipboardCopy size={16} />}
      {done ? "Copied!" : label}
    </button>
  );
}

export const inputCls = "w-full rounded-lg border border-violet-400/20 bg-[#0B0F17]/80 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-violet-400 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.25)]";
export const btnCls = "inline-flex items-center gap-1.5 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-100 transition hover:bg-violet-500/25";
export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block space-y-1"><span className="text-xs font-medium uppercase tracking-wider text-violet-300/80">{label}</span>{children}</label>
);
