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

// Le Hub libelle ses années "26-27" là où ClassBoard stocke "2026-2027".
export function toHubYear(label: string): string {
  const m = label.match(/^\d{2}(\d{2})-\d{2}(\d{2})$/);
  return m ? `${m[1]}-${m[2]}` : label;
}

// Sans filtre, le Hub renvoie les classes de TOUTES les années scolaires,
// y compris les archivées : on récupérerait alors les élèves de l'an dernier.
export async function getAllClasses(schoolYearLabel?: string): Promise<HubClasse[]> {
  const annee = schoolYearLabel ? toHubYear(schoolYearLabel) : null;
  const data = await hubFetch<{ classes: HubClasse[] }>(
    annee ? `/classes?annee=${encodeURIComponent(annee)}` : "/classes"
  );
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
