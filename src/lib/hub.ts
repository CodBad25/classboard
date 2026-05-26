// Hub API client — SERVER ONLY. Ne JAMAIS importer côté client (la HUB_API_KEY ne doit pas finir dans le bundle).
// Pour le client, utiliser src/lib/hub-client.ts qui passe par les routes proxy /api/hub/*.

import "server-only";
import type { HubClasse, HubEleve, HubResultat } from "./hub-types";

export type { HubClasse, HubEleve, HubResultat } from "./hub-types";

const HUB_URL = "https://hub.beltools.fr/api/v1";

function getKey(): string {
  const k = process.env.HUB_API_KEY;
  if (!k) throw new Error("HUB_API_KEY manquante côté serveur (configurer .env.local et l'env Oracle)");
  return k;
}

async function hubFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${HUB_URL}${path}`, {
    headers: { "x-api-key": getKey() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Hub API ${res.status} ${res.statusText} (${path})`);
  return res.json();
}

export async function getAllClasses(): Promise<HubClasse[]> {
  const data = await hubFetch<{ classes: HubClasse[] }>("/classes");
  return data.classes ?? [];
}

export async function getEleves(classeId: string): Promise<HubEleve[]> {
  const data = await hubFetch<{ eleves: HubEleve[] }>(
    `/classes/${classeId}/eleves?actif=true`,
  );
  return data.eleves ?? [];
}

export async function getAllResultats(): Promise<HubResultat[]> {
  const data = await hubFetch<{ resultats: HubResultat[] }>("/resultats");
  return (data.resultats ?? []).map((r) => ({ ...r, details: null }));
}
