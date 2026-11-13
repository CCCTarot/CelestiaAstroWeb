"use client";
import { useMemo, useState } from "react";
import { combinedMd, type ExportItem } from "@/lib/astro/export";
import { Card, CopyButton, btnCls } from "./ui";

export function ExportDrawer({ items, source }: { items: ExportItem[]; source: string }) {
  const [scope, setScope] = useState<"both" | "western" | "vedic">("both");
  const text = useMemo(() => { try { return combinedMd(items, scope); } catch { return "Unable to build export."; } }, [items, scope]);
  return (
    <Card title="AI Export" right={<CopyButton getText={() => text} label="Copy Markdown for AI" />}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Source: {source}</span>
        {(["both", "western", "vedic"] as const).map((s) => (
          <button key={s} onClick={() => setScope(s)} className={`${btnCls} capitalize ${scope === s ? "!bg-violet-500 text-white" : ""}`}>{s}</button>
        ))}
      </div>
      <textarea readOnly value={text} className="h-[60vh] w-full resize-none rounded-xl border border-violet-400/20 bg-[#080B12] p-4 font-mono text-xs leading-relaxed text-slate-300 outline-none" />
    </Card>
  );
}
