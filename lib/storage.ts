"use client";
import { useCallback, useEffect, useState } from "react";
import type { BirthInput, Profile } from "./astro/types";

const KEY = "celestia.profiles.v1";
const uid = () => Math.random().toString(36).slice(2, 10);

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { setProfiles(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(profiles)); } catch { /* quota */ }
  }, [profiles, ready]);

  const add = useCallback((name: string, tag: string, notes: string, input: BirthInput) => {
    const p: Profile = { id: uid(), name, tag, notes, input, createdAt: Date.now() };
    setProfiles((x) => [p, ...x]); return p;
  }, []);
  const update = useCallback((id: string, patch: Partial<Profile>) => setProfiles((x) => x.map((p) => (p.id === id ? { ...p, ...patch } : p))), []);
  const remove = useCallback((id: string) => setProfiles((x) => x.filter((p) => p.id !== id)), []);
  const duplicate = useCallback((id: string) => setProfiles((x) => {
    const s = x.find((p) => p.id === id); if (!s) return x;
    return [{ ...s, id: uid(), name: `${s.name} (copy)`, createdAt: Date.now() }, ...x];
  }), []);
  return { profiles, add, update, remove, duplicate };
}
