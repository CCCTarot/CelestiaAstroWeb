"use client";
import { FormEvent, useState } from "react";

type OrderResult = { id?: string; error?: string };
export default function ShopIntakePage() {
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState(""), [handoffUrl, setHandoffUrl] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(""); setHandoffUrl("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      customerName: form.get("customerName"), serviceTitle: form.get("serviceTitle"), category: form.get("category"),
      birthDate: form.get("birthDate"), birthTime: form.get("birthTime") || "unknown", timeUnknown: form.get("timeUnknown") === "on",
      birthPlace: form.get("birthPlace"), timezone: form.get("timezone"), chart: { requested: String(form.get("category")), source: "celestia-shop-intake" }, consent: form.get("consent") === "on",
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as OrderResult;
      if (!response.ok || !result.id) throw new Error(result.error || "Could not submit this request.");
      const message = `Hello! I submitted order ${result.id} for ${String(payload.customerName)}: ${String(payload.serviceTitle)} (${String(payload.category)}). I would like to discuss the next steps.`;
      const phone = process.env.NEXT_PUBLIC_CELESTIA_WHATSAPP_NUMBER?.replace(/\D/g, "");
      setNotice("Your request is recorded. Continue in WhatsApp to discuss the details.");
      if (phone) setHandoffUrl(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
      formElement.reset();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Submission failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-2xl px-4 py-10 text-slate-100"><a className="text-violet-300" href="/">← Celestia</a><h1 className="mt-5 font-display text-4xl font-bold">Request a reading</h1><p className="mt-2 text-slate-400">Share the birth details for your personalized chart service.</p>
    <form onSubmit={submit} className="mt-7 grid gap-4 rounded-2xl border border-violet-400/20 bg-slate-900/70 p-5 sm:p-7">
      <label className="grid gap-1 text-sm">Your name<input required maxLength={120} name="customerName" className="rounded-lg border border-white/10 bg-slate-950 p-3" /></label>
      <label className="grid gap-1 text-sm">Service requested<input required maxLength={180} name="serviceTitle" placeholder="e.g. Complete birth-chart reading" className="rounded-lg border border-white/10 bg-slate-950 p-3" /></label>
      <label className="grid gap-1 text-sm">Chart system<select name="category" className="rounded-lg border border-white/10 bg-slate-950 p-3"><option value="both">Western + Vedic</option><option value="western">Western</option><option value="vedic">Vedic</option></select></label>
      <label className="grid gap-1 text-sm">Birth date<input required type="date" name="birthDate" className="rounded-lg border border-white/10 bg-slate-950 p-3" /></label>
      <label className="grid gap-1 text-sm">Birth time (local)<input type="time" name="birthTime" className="rounded-lg border border-white/10 bg-slate-950 p-3" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="timeUnknown" /> I don’t know my birth time</label>
      <label className="grid gap-1 text-sm">Birth place<input required maxLength={180} name="birthPlace" placeholder="City, country" className="rounded-lg border border-white/10 bg-slate-950 p-3" /></label>
      <label className="grid gap-1 text-sm">Time zone<input required maxLength={80} name="timezone" placeholder="e.g. Europe/London" className="rounded-lg border border-white/10 bg-slate-950 p-3" /></label>
      <label className="flex items-start gap-2 text-sm text-slate-300"><input required type="checkbox" name="consent" className="mt-1" /> I consent to Celestia storing these details to process this chart request.</label>
      <button disabled={busy} className="rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500 disabled:opacity-50">{busy ? "Submitting…" : "Submit & continue to WhatsApp"}</button>
      {notice && <p role="status" className="text-sm text-violet-200">{notice}{!process.env.NEXT_PUBLIC_CELESTIA_WHATSAPP_NUMBER && notice.startsWith("Your request") ? " Configure NEXT_PUBLIC_CELESTIA_WHATSAPP_NUMBER to enable the handoff." : ""}</p>}
      {handoffUrl && <a href={handoffUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-400/40 px-5 py-3 text-center font-semibold text-emerald-200 hover:bg-emerald-400/10">Open WhatsApp message</a>}
    </form></main>;
}
