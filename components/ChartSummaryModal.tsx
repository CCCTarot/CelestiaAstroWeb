"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { ChartData, TopicKey } from "@/lib/chart-summary";

type ReadingTopic = { headline: string; content: string };
type ReadingSummary = Record<TopicKey, ReadingTopic>;

function isReadingSummary(value: unknown): value is ReadingSummary {
  if (typeof value !== "object" || value === null) return false;
  return TOPICS.every(({ key }) => {
    const topic = (value as Record<string, unknown>)[key];
    if (typeof topic !== "object" || topic === null) return false;
    const fields = topic as Record<string, unknown>;
    return typeof fields.headline === "string" && typeof fields.content === "string";
  });
}

const TOPICS: { key: TopicKey; title: string }[] = [
  { key: "love", title: "Love & Relationships" },
  { key: "career", title: "Career & Wealth" },
  { key: "health", title: "Health & Vitality" },
  { key: "pastLife", title: "Past Life & Karmic Lessons" },
  { key: "strengths", title: "Strengths" },
  { key: "weaknesses", title: "Weaknesses & Growth Areas" },
];

export function ChartSummaryModal({ chart, buttonLabel }: { chart: ChartData | null; buttonLabel: string }) {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReadingSummary | null>(null);
  const cache = useRef<Map<string, ReadingSummary>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    if (!chart || !consented) return;
    const key = JSON.stringify(chart);
    const cached = cache.current.get(key);
    if (cached) {
      setSummary(cached);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: key,
        signal: controller.signal,
      });
      const result = await response.json() as { error?: string; summary?: unknown };
      if (!response.ok) throw new Error(result.error || `Reading request failed (${response.status}).`);
      if (!isReadingSummary(result.summary)) throw new Error("The reading service returned an incomplete reading. Please retry.");
      cache.current.set(key, result.summary);
      setSummary(result.summary);
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      setError(reason instanceof Error ? reason.message : "We couldn't create your reading. Please try again.");
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [chart, consented]);

  const close = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setOpen(false);
    setConsented(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [close, open]);

  const isVedic = chart?.system === "vedic";

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setOpen(true); }}
        disabled={!chart}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-40"
      >
        <Sparkles size={15} />{buttonLabel}
      </button>

      {open && chart && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#080B12]/80 p-4 backdrop-blur-sm sm:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="AI chart reading"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="relative my-auto w-full max-w-4xl rounded-3xl border border-[#E6DFD3] bg-[#FAF7F2] p-6 text-[#251A30] shadow-2xl sm:p-10"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-5 top-5 rounded-lg border border-[#E6DFD3] px-3 py-1 text-[#251A30] hover:bg-white"
            >
              Close
            </button>

            <header className="mb-8 pr-16 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-[#C8A962]">Cosmic Chaos Club</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-[#251A30] sm:text-4xl">
                {chart.name ? `${chart.name}'s ` : "Your "}{isVedic ? "Vedic" : "Western"} Reading
              </h2>
              <p className="mt-2 text-sm text-[#6F6478]">{chart.settings}</p>
            </header>

            {!consented && !summary && !loading && !error && (
              <section className="mx-auto max-w-2xl rounded-2xl border border-[#E6DFD3] bg-white p-5">
                <h3 className="font-medium text-[#251A30]">Your data, your choice</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#51485A]">
                  To create this reading, your name, birth date and time, location, and calculated chart placements will be sent to Google Gemini. Review Google&apos;s applicable privacy and data-use terms before continuing. This feature is optional.
                </p>
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-[#251A30]">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(event) => setConsented(event.target.checked)}
                    className="mt-1 accent-[#251A30]"
                  />
                  <span>I understand and agree to send this chart data to Google for interpretation.</span>
                </label>
                <button
                  type="button"
                  disabled={!consented}
                  onClick={generate}
                  className="mt-5 rounded-xl bg-[#251A30] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3A2D45] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Generate reading
                </button>
              </section>
            )}

            {loading && (
              <div role="status" aria-live="polite" className="rounded-2xl border border-[#E6DFD3] bg-white p-10 text-center text-[#251A30]">
                <span className="mx-auto mb-4 block h-8 w-8 animate-spin rounded-full border-2 border-[#E6DFD3] border-t-[#C8A962]" />
                <p className="font-display text-xl font-semibold">Consulting the stars...</p>
                <p className="mt-2 text-sm text-[#6F6478]">Interpreting your calculated chart. This may take a moment.</p>
              </div>
            )}

            {error && !loading && (
              <div role="alert" className="rounded-2xl border border-[#E6DFD3] bg-white p-6 text-center">
                <p className="text-[#51485A]">{error}</p>
                <button
                  type="button"
                  onClick={generate}
                  disabled={!consented}
                  className="mt-4 rounded-xl bg-[#251A30] px-5 py-2 text-sm font-medium text-white hover:bg-[#3A2D45] disabled:opacity-40"
                >
                  Retry
                </button>
              </div>
            )}

            {summary && !loading && (
              <div className="grid gap-5 md:grid-cols-2">
                {TOPICS.map(({ key, title }) => {
                  const topic = summary[key];
                  return (
                    <article key={key} className="rounded-2xl border border-[#E6DFD3] bg-white p-6 shadow-sm">
                      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C8A962]">{title}</h3>
                      <p className="mt-3 font-display text-xl font-semibold text-[#251A30]">{topic.headline}</p>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#51485A]">{topic.content}</p>
                    </article>
                  );
                })}
              </div>
            )}

            <p className="mt-8 text-center text-[11px] text-[#6F6478]">
              AI-generated astrology for reflection and entertainment. Not medical, legal, or financial advice.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
