// Hub client-side wrapper — passe par les routes proxy /api/hub/* côté serveur Next.
// AUCUNE clé API exposée au navigateur.

import type { HubClasse, HubEleve, HubResultat } from "./hub-types";

export type { HubClasse, HubEleve, HubResultat } from "./hub-types";

async function jget<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Proxy ${url} ${res.status}`);
  return res.json();
}

export async function getAllClasses(): Promise<HubClasse[]> {
  const d = await jget<{ classes: HubClasse[] }>("/api/hub/classes");
  return d.classes ?? [];
}

export async function getEleves(classeId: string): Promise<HubEleve[]> {
  const d = await jget<{ eleves: HubEleve[] }>(`/api/hub/classes/${encodeURIComponent(classeId)}/eleves`);
  return d.eleves ?? [];
}

export async function getAllResultats(): Promise<HubResultat[]> {
  const d = await jget<{ resultats: HubResultat[] }>("/api/hub/resultats");
  return d.resultats ?? [];
}
