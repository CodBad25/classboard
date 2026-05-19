// Helpers d'agrégation pour le dashboard Connexions
// Adaptés depuis maths-5e/client/src/pages/AdminConnexions.tsx

import type { HubResultat, HubEleve, HubClasse } from "./hub-types";

export const FENETRE_SESSION_MS = 30 * 60 * 1000; // 30 min entre 2 sessions
export const BUFFER_SESSION_MS  =  5 * 60 * 1000; // +5 min de buffer par session
const FENETRE_EN_LIGNE_MS = 5 * 60 * 1000;

export interface EleveStats {
  eleveId: string;
  prenom: string;
  nom: string;
  classeId: string;
  classeNom: string;
  niveau: string;
  derniereActivite: Date | null;
  joursActifs7j: number;
  joursActifs30j: number;
  tempsEstimeMin: number;
  jamaisConnecte: boolean;
  activeNow: boolean;
  resultatsRaw: HubResultat[];
}

export interface ClasseStats {
  classeId: string;
  nom: string;
  niveau: string;
  couleur: string;
  effectif: number;
  actifs7j: number;
  actifs30j: number;
  decrocheurs: number; // inactifs >= 7j ou jamais
  tempsMoyMin: number;
  engagementPct: number; // % actifs 7j
  topExo: { id: string; label: string; nb: number } | null;
  sparkline30j: number[]; // nb élèves actifs / jour, 30 derniers jours
  eleves: EleveStats[];
}

// ─── Helpers de base ─────────────────────────────────────────────────────────

export function estimeTempsSession(resultats: HubResultat[]): number {
  if (resultats.length === 0) return 0;
  const ts = resultats
    .map((r) => new Date(r.createdAt).getTime())
    .filter((t) => !isNaN(t))
    .sort((a, b) => a - b);
  if (ts.length === 0) return 0;

  let totalMs = 0;
  let debut = ts[0];
  let fin = ts[0];
  for (let i = 1; i < ts.length; i++) {
    if (ts[i] - fin > FENETRE_SESSION_MS) {
      totalMs += fin - debut + BUFFER_SESSION_MS;
      debut = ts[i];
    }
    fin = ts[i];
  }
  totalMs += fin - debut + BUFFER_SESSION_MS;
  return totalMs / 60000;
}

export function joursActifsDans(resultats: HubResultat[], joursMax: number): number {
  const cutoff = Date.now() - joursMax * 86400000;
  const jours = new Set<string>();
  for (const r of resultats) {
    const t = new Date(r.createdAt).getTime();
    if (!isNaN(t) && t >= cutoff) {
      jours.add(new Date(r.createdAt).toLocaleDateString("fr-FR"));
    }
  }
  return jours.size;
}

export function joursDepuisDerniereActivite(d: Date | null): number {
  if (!d) return Infinity;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export interface InactiviteStatut {
  type: "warn" | "alert";
  label: string;
}

export function inactiviteStatut(e: EleveStats): InactiviteStatut | null {
  if (e.jamaisConnecte) return { type: "alert", label: "Jamais connecté" };
  const j = joursDepuisDerniereActivite(e.derniereActivite);
  if (j >= 14) return { type: "alert", label: `Inactif ${j}j` };
  if (j >= 7)  return { type: "warn",  label: `Inactif ${j}j` };
  return null;
}

// ─── Sessions, moyenne, implication, scoreColor ──────────────────────────────

export interface SessionDetail {
  debut: Date;
  fin: Date;
  dureeMin: number;
  activites: { id: string; label: string; ts: Date; score: number; total: number }[];
}

export function buildSessions(resultats: HubResultat[]): SessionDetail[] {
  if (resultats.length === 0) return [];
  const sorted = resultats
    .map((r) => ({ r, ts: new Date(r.createdAt).getTime() }))
    .filter((x) => !isNaN(x.ts))
    .sort((a, b) => a.ts - b.ts);
  if (sorted.length === 0) return [];

  const sessions: SessionDetail[] = [];
  let current: typeof sorted = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].ts - sorted[i - 1].ts > FENETRE_SESSION_MS) {
      sessions.push(makeSession(current));
      current = [];
    }
    current.push(sorted[i]);
  }
  sessions.push(makeSession(current));
  return sessions.reverse();
}

function makeSession(items: { r: HubResultat; ts: number }[]): SessionDetail {
  const debut = new Date(items[0].ts);
  const fin = new Date(items[items.length - 1].ts);
  const dureeMin = (fin.getTime() - debut.getTime() + BUFFER_SESSION_MS) / 60000;
  const best = new Map<string, { r: HubResultat; ts: number }>();
  for (const it of items) {
    const prev = best.get(it.r.exercice);
    const prevPct = prev ? (prev.r.total > 0 ? prev.r.score / prev.r.total : 0) : -1;
    const curPct  = it.r.total > 0 ? it.r.score / it.r.total : 0;
    if (!prev || curPct > prevPct) best.set(it.r.exercice, it);
  }
  const activites = Array.from(best.values()).map(({ r, ts }) => ({
    id: r.exercice,
    label: humanizeExercice(r.exercice).label,
    ts: new Date(ts),
    score: r.score,
    total: r.total,
  }));
  activites.sort((a, b) => a.ts.getTime() - b.ts.getTime());
  return { debut, fin, dureeMin, activites };
}

export function moyenneEleve(resultats: HubResultat[]): { pct: number; nb: number } {
  const valides = resultats.filter((r) => r.total > 0);
  if (valides.length === 0) return { pct: 0, nb: 0 };
  const sum = valides.reduce((a, r) => a + r.score / r.total, 0);
  return { pct: Math.round((sum / valides.length) * 100), nb: valides.length };
}

function chapitresDistincts(resultats: HubResultat[]): number {
  const s = new Set<string>();
  for (const r of resultats) {
    if (r.exercice.startsWith("apprendre"))     s.add("apprendre");
    else if (r.exercice.startsWith("proportions")) s.add("proportions");
    else if (r.exercice.startsWith("fractions"))   s.add("fractions");
    else if (r.exercice.startsWith("parallelogramme")) s.add("parallelogramme");
    else if (r.exercice.startsWith("eval-4e"))     s.add("eval-4e");
    else if (r.exercice.startsWith("prix"))        s.add("prix");
    else s.add("autre");
  }
  return s.size;
}

export function scoreImplication(e: EleveStats): number {
  if (e.jamaisConnecte) return 0;
  const reg = Math.min(e.joursActifs30j / 14, 1) * 40;
  const vol = Math.min(e.tempsEstimeMin / 180, 1) * 30;
  const div = Math.min(chapitresDistincts(e.resultatsRaw) / 4, 1) * 30;
  return Math.round(reg + vol + div);
}

export function implicationLabel(score: number): { label: string; color: string } {
  if (score >= 75) return { label: "Très impliqué", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (score >= 50) return { label: "Impliqué",      color: "bg-blue-100 text-blue-700 border-blue-200"        };
  if (score >= 25) return { label: "Modéré",        color: "bg-amber-100 text-amber-700 border-amber-200"      };
  return                  { label: "Faible",         color: "bg-red-100 text-red-700 border-red-200"           };
}

export function scoreColorClasses(score: number, total: number): { bg: string; text: string; border: string } {
  if (!total || total <= 0) return { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
  const pct = score / total;
  if (pct >= 0.8) return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" };
  if (pct >= 0.5) return { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-amber-200"   };
  return                  { bg: "bg-red-100",     text: "text-red-700",     border: "border-red-200"     };
}

// ─── Humanisation des exercices ──────────────────────────────────────────────

export function humanizeExercice(id: string): { label: string; icone: string } {
  // Apprendre : apprendre-ch07-flashcards, apprendre-chapitre-X-yyy-mode
  const apprendre = id.match(/^apprendre-(?:ch(\d+)|chapitre-(\d+))-(.+)$/);
  if (apprendre) {
    const chNum = parseInt(apprendre[1] || apprendre[2], 10);
    const mode = apprendre[3];
    const labels: Record<string, string> = {
      "flashcards":   "Flashcards",
      "texte-a-trous":"Texte à trous",
      "carte-mentale":"Carte mentale",
    };
    return { label: `${labels[mode] ?? mode} — Ch. ${chNum}`, icone: "🧠" };
  }
  if (id.startsWith("proportions"))     return { label: "Proportions",     icone: "📊" };
  if (id.startsWith("fractions"))       return { label: "Fractions",       icone: "🔢" };
  if (id.startsWith("parallelogramme")) return { label: "Parallélogrammes", icone: "🔷" };
  if (id.startsWith("eval-4e-puissances"))     return { label: "Puissances",        icone: "⚡" };
  if (id.startsWith("eval-4e-notation-sci"))   return { label: "Notation scientifique", icone: "🔬" };
  if (id.startsWith("eval-4e-bilan"))          return { label: "Bilan 4e",          icone: "📝" };
  if (id.startsWith("prix"))            return { label: "Calcul Prix",     icone: "💶" };
  if (id.includes("angles"))            return { label: "Angles",          icone: "📐" };
  if (id.includes("aires"))             return { label: "Aires",           icone: "🟦" };
  if (id.includes("volumes"))           return { label: "Volumes",         icone: "🧊" };
  return { label: id, icone: "📘" };
}

// ─── Couleur par niveau ──────────────────────────────────────────────────────

const COULEURS_NIVEAU: Record<string, string> = {
  "6eme": "#3b82f6", // bleu
  "5eme": "#10b981", // vert
  "4eme": "#8b5cf6", // violet
  "3eme": "#f59e0b", // ambre
};

export function couleurNiveau(niveau: string): string {
  return COULEURS_NIVEAU[niveau] ?? "#94a3b8";
}

// ─── Formatage ────────────────────────────────────────────────────────────────

export function formatTemps(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`;
}

export function formatDate(d: Date): string {
  const now = new Date();
  const hhmm = `${d.getHours().toString().padStart(2, "0")}h${d.getMinutes().toString().padStart(2, "0")}`;
  const todayStr = now.toLocaleDateString("fr-FR");
  const dStr = d.toLocaleDateString("fr-FR");
  if (dStr === todayStr) return `Aujourd'hui ${hhmm}`;
  const hier = new Date(now);
  hier.setDate(hier.getDate() - 1);
  if (dStr === hier.toLocaleDateString("fr-FR")) return `Hier ${hhmm}`;
  const diffJ = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffJ < 7) return `Il y a ${diffJ} jours`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ─── Agrégation principale ────────────────────────────────────────────────────

interface ClasseRaw {
  classe: HubClasse;
  eleves: HubEleve[];
}

export function agregerStats(
  classes: ClasseRaw[],
  tousResultats: HubResultat[],
): ClasseStats[] {
  // Index résultats par élève
  const resultatsParEleve = new Map<string, HubResultat[]>();
  for (const r of tousResultats) {
    if (!resultatsParEleve.has(r.eleveId)) resultatsParEleve.set(r.eleveId, []);
    resultatsParEleve.get(r.eleveId)!.push(r);
  }

  return classes.map(({ classe, eleves }) => {
    const eleveStatsArr: EleveStats[] = eleves.map((e) => {
      const res = resultatsParEleve.get(e.id) ?? [];
      const jamais = res.length === 0;
      let derniere: Date | null = null;
      if (!jamais) {
        const ts = res.map((r) => new Date(r.createdAt).getTime()).filter((t) => !isNaN(t));
        if (ts.length > 0) derniere = new Date(Math.max(...ts));
      }
      const activeNow = !jamais && !!derniere && (Date.now() - derniere.getTime() <= FENETRE_EN_LIGNE_MS);
      return {
        eleveId: e.id,
        prenom: e.prenom,
        nom: e.nom,
        classeId: classe.id,
        classeNom: classe.nom,
        niveau: classe.niveau,
        derniereActivite: derniere,
        joursActifs7j: joursActifsDans(res, 7),
        joursActifs30j: joursActifsDans(res, 30),
        tempsEstimeMin: estimeTempsSession(res),
        jamaisConnecte: jamais,
        activeNow,
        resultatsRaw: res,
      };
    });

    const eff = eleveStatsArr.length;
    const actifs7j = eleveStatsArr.filter((e) => e.joursActifs7j > 0).length;
    const actifs30j = eleveStatsArr.filter((e) => e.joursActifs30j > 0).length;
    const decrocheurs = eleveStatsArr.filter((e) => inactiviteStatut(e) !== null).length;
    const tempsMoyMin = eff > 0
      ? eleveStatsArr.reduce((s, x) => s + x.tempsEstimeMin, 0) / eff
      : 0;
    const engagementPct = eff > 0 ? Math.round((actifs7j / eff) * 100) : 0;

    // Top exo de la classe
    const compteurExo = new Map<string, number>();
    for (const elv of eleveStatsArr) {
      for (const r of elv.resultatsRaw) {
        compteurExo.set(r.exercice, (compteurExo.get(r.exercice) ?? 0) + 1);
      }
    }
    let topExo: ClasseStats["topExo"] = null;
    let maxNb = 0;
    for (const [id, nb] of compteurExo) {
      if (nb > maxNb) { maxNb = nb; topExo = { id, label: humanizeExercice(id).label, nb }; }
    }

    // Sparkline 30j (élèves actifs / jour)
    const sparkline30j: number[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const dayStr = new Date(now - i * 86400000).toLocaleDateString("fr-FR");
      const nbActifs = eleveStatsArr.filter((e) =>
        e.resultatsRaw.some((r) => new Date(r.createdAt).toLocaleDateString("fr-FR") === dayStr),
      ).length;
      sparkline30j.push(nbActifs);
    }

    return {
      classeId: classe.id,
      nom: classe.nom,
      niveau: classe.niveau,
      couleur: couleurNiveau(classe.niveau),
      effectif: eff,
      actifs7j,
      actifs30j,
      decrocheurs,
      tempsMoyMin,
      engagementPct,
      topExo,
      sparkline30j,
      eleves: eleveStatsArr,
    };
  });
}

// ─── Stats globales toutes classes ────────────────────────────────────────────

export interface StatsGlobales {
  totalEleves: number;
  actifs7j: number;
  decrocheurs: number;
  tempsCumuleMin: number;
  topActivites: { id: string; label: string; icone: string; nb: number; eleves: number }[];
  decrocheursList: { eleve: EleveStats; statut: InactiviteStatut }[];
  parJourSemaine: { jour: string; nb: number }[];
}

export function statsGlobales(classes: ClasseStats[]): StatsGlobales {
  const allEleves = classes.flatMap((c) => c.eleves);
  const totalEleves = allEleves.length;
  const actifs7j = allEleves.filter((e) => e.joursActifs7j > 0).length;

  const decrocheursList = allEleves
    .map((eleve) => {
      const statut = inactiviteStatut(eleve);
      return statut ? { eleve, statut } : null;
    })
    .filter((x): x is { eleve: EleveStats; statut: InactiviteStatut } => x !== null)
    .sort((a, b) => {
      // Priorité : jamais connectés > inactifs longs > inactifs récents
      if (a.eleve.jamaisConnecte && !b.eleve.jamaisConnecte) return -1;
      if (!a.eleve.jamaisConnecte && b.eleve.jamaisConnecte) return 1;
      return joursDepuisDerniereActivite(b.eleve.derniereActivite) - joursDepuisDerniereActivite(a.eleve.derniereActivite);
    });

  const tempsCumuleMin = allEleves.reduce((s, e) => s + e.tempsEstimeMin, 0);

  // Top activités cross-classes
  const compteurExo = new Map<string, { nb: number; eleves: Set<string> }>();
  for (const e of allEleves) {
    for (const r of e.resultatsRaw) {
      let v = compteurExo.get(r.exercice);
      if (!v) { v = { nb: 0, eleves: new Set() }; compteurExo.set(r.exercice, v); }
      v.nb++;
      v.eleves.add(e.eleveId);
    }
  }
  const topActivites = Array.from(compteurExo.entries())
    .map(([id, v]) => ({ id, ...humanizeExercice(id), nb: v.nb, eleves: v.eleves.size }))
    .sort((a, b) => b.nb - a.nb)
    .slice(0, 5);

  // Activité par jour de semaine
  const jours = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const e of allEleves) {
    for (const r of e.resultatsRaw) {
      const d = new Date(r.createdAt).getDay();
      counts[d === 0 ? 6 : d - 1]++;
    }
  }
  const parJourSemaine = jours.map((j, i) => ({ jour: j, nb: counts[i] }));

  return {
    totalEleves,
    actifs7j,
    decrocheurs: decrocheursList.length,
    tempsCumuleMin,
    topActivites,
    decrocheursList: decrocheursList.slice(0, 8),
    parJourSemaine,
  };
}
