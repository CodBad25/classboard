"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, RefreshCw, Flame, AlertTriangle, BarChart3, Bell, Search, X, BellPlus, History, ChevronDown, ChevronRight as ChevronRightIcon, Eye, EyeOff } from "lucide-react";
import Fuse from "fuse.js";
import { toast } from "sonner";
import { getAllClasses, getEleves, getAllResultats } from "@/lib/hub-client";
import type { HubClasse, HubEleve } from "@/lib/hub-types";
import { studentKey, type StudentRemindersEntry } from "@/lib/student-matcher";
import { isAnonymized, toggleAnonymize, subscribeAnonymize, anonName, anonShort } from "@/lib/anonymize";
import {
  agregerStats,
  statsGlobales,
  formatTemps,
  formatDate,
  inactiviteStatut,
  buildSessions,
  moyenneEleve,
  scoreImplication,
  implicationLabel,
  scoreColorClasses,
  humanizeExercice,
  type ClasseStats,
  type EleveStats,
  type StatsGlobales,
} from "@/lib/stats";

type Niveau = "tous" | "6eme" | "5eme" | "4eme";

type Drawer =
  | { kind: "classe"; classe: ClasseStats }
  | { kind: "eleve"; eleve: EleveStats }
  | { kind: "activite"; id: string; label: string }
  | { kind: "jourClasse"; classe: ClasseStats; day: string }   // "DD/MM/YYYY"
  | { kind: "topTime" }
  | { kind: "actifs7j" }
  | { kind: "decrocheurs" }
  | { kind: "topSessions" };

export function DashboardConnexions() {
  const [classes, setClasses] = useState<ClasseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [niveau, setNiveau] = useState<Niveau>("tous");
  const [drawer, setDrawer] = useState<Drawer | null>(null);
  const [remindersMap, setRemindersMap] = useState<Record<string, StudentRemindersEntry>>({});
  const [, setAnonTick] = useState(0);
  useEffect(() => subscribeAnonymize(() => setAnonTick((t) => t + 1)), []);

  const rechargerRappels = async () => {
    try {
      const r = await fetch("/api/connexions/student-reminders", { cache: "no-store" }).then((x) => x.json());
      setRemindersMap(r?.map ?? {});
    } catch {}
  };

  const charger = async () => {
    try {
      const [classesHub, tousResultats, remindersRes] = await Promise.all([
        getAllClasses(),
        getAllResultats(),
        fetch("/api/connexions/student-reminders", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ map: {} })),
      ]);
      setRemindersMap(remindersRes?.map ?? {});
      // Filtrer classes vides et T (test)
      const classesValides = classesHub.filter((c) => c.nbEleves > 0 && !c.nom.endsWith("T"));
      const enrichies = await Promise.all(
        classesValides.map(async (c: HubClasse) => ({
          classe: c,
          eleves: (await getEleves(c.id)) as HubEleve[],
        })),
      );
      const stats = agregerStats(enrichies, tousResultats).sort((a, b) => {
        // Tri : par niveau (6e, 5e, 4e), puis par nom
        const order: Record<string, number> = { "6eme": 0, "5eme": 1, "4eme": 2, "3eme": 3 };
        const oa = order[a.niveau] ?? 9;
        const ob = order[b.niveau] ?? 9;
        return oa - ob || a.nom.localeCompare(b.nom, "fr");
      });
      setClasses(stats);
    } catch (e) {
      console.error(e);
      toast.error("Erreur de chargement Hub");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const classesFiltrees = useMemo(
    () => (niveau === "tous" ? classes : classes.filter((c) => c.niveau === niveau)),
    [classes, niveau],
  );

  // Recherche élève (fuzzy)
  const [search, setSearch] = useState("");
  const allEleves = useMemo(() => classes.flatMap((c) => c.eleves), [classes]);
  const fuse = useMemo(
    () =>
      new Fuse(allEleves, {
        keys: [{ name: "nom", weight: 0.6 }, { name: "prenom", weight: 0.4 }],
        threshold: 0.4,
        distance: 100,
      }),
    [allEleves],
  );
  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    return fuse.search(search, { limit: 8 }).map((r) => r.item);
  }, [fuse, search]);

  // Stats globales recalculées sur le périmètre filtré (cohérence avec le filtre niveau)
  const global = useMemo(() => statsGlobales(classesFiltrees), [classesFiltrees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Chargement des données du Hub…
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* ── Header : stats globales + actions ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Connexions élèves</h2>
          <p className="text-xs text-muted-foreground">
            {global.totalEleves} élèves · {classesFiltrees.length} classe{classesFiltrees.length > 1 ? "s" : ""}
            {niveau !== "tous" && ` (${niveau.replace("eme", "e")})`} · Hub temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtre niveau */}
          {(["tous", "6eme", "5eme", "4eme"] as Niveau[]).map((n) => (
            <button
              key={n}
              onClick={() => setNiveau(n)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                niveau === n
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {n === "tous" ? "Tous niveaux" : n.replace("eme", "ème")}
            </button>
          ))}
          <button
            onClick={() => toggleAnonymize(allEleves)}
            className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
              isAnonymized() ? "bg-blue-600 text-white border-blue-600" : "border-border hover:bg-muted"
            }`}
            title={isAnonymized() ? "Désactiver l'anonymat" : "Activer l'anonymat (noms de mathématiciens)"}
          >
            {isAnonymized() ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {isAnonymized() ? "Anonyme" : "Anonymiser"}
          </button>
          <button
            onClick={() => { setRefreshing(true); charger(); }}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border hover:bg-muted"
            disabled={refreshing}
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── Recherche élève (fuzzy) ── */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un élève (prénom, nom)…"
            className="w-full pl-9 pr-9 py-2 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {search && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-border bg-card shadow-lg overflow-hidden max-h-80 overflow-y-auto">
            {searchResults.map((e) => {
              const rappels = remindersMap[studentKey(e.prenom, e.nom, e.classeNom)];
              return (
                <button
                  key={e.eleveId}
                  onClick={() => { setDrawer({ kind: "eleve", eleve: e }); setSearch(""); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-muted/60 border-b border-border last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{anonName(e)}</p>
                    <p className="text-[10px] text-muted-foreground">{e.classeNom}</p>
                  </div>
                  {rappels && rappels.pendingCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                      🔔 {rappels.pendingCount}
                    </span>
                  )}
                  {e.jamaisConnecte && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 shrink-0">jamais</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {search && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-border bg-card shadow-lg px-3 py-3 text-xs text-muted-foreground">
            Aucun élève trouvé pour « {search} »
          </div>
        )}
      </div>

      {/* ── 4 stats globales ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard label="Total élèves"        value={global.totalEleves.toString()} hue="blue"
                  onClick={() => setDrawer({ kind: "topSessions" })} />
        <StatCard label="Actifs cette semaine" value={`${global.actifs7j} / ${global.totalEleves}`}
                  sub={`${Math.round((global.actifs7j / Math.max(global.totalEleves, 1)) * 100)}%`} hue="emerald"
                  onClick={() => setDrawer({ kind: "actifs7j" })} />
        <StatCard label="Décrocheurs"         value={global.decrocheurs.toString()} sub="inactifs 7j+" hue="orange"
                  onClick={() => setDrawer({ kind: "decrocheurs" })} />
        <StatCard label="Temps cumulé"        value={formatTemps(global.tempsCumuleMin)} hue="purple"
                  onClick={() => setDrawer({ kind: "topTime" })} />
      </div>

      {/* ── Tableau dense ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Classe</th>
                <th className="px-3 py-2 text-center font-semibold">Effectif</th>
                <th className="px-3 py-2 text-left font-semibold">Actifs 7j</th>
                <th className="px-3 py-2 text-center font-semibold">Décroch.</th>
                <th className="px-3 py-2 text-center font-semibold">Tendance 30j</th>
                <th className="px-3 py-2 text-center font-semibold">Temps moy.</th>
                <th className="px-3 py-2 text-left font-semibold">Top exo</th>
                <th className="px-3 py-2 text-left font-semibold">Engagement</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {classesFiltrees.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">
                  Aucune classe pour ce filtre
                </td></tr>
              ) : (
                classesFiltrees.map((c) => (
                  <ClasseRow
                    key={c.classeId}
                    c={c}
                    onOpen={() => setDrawer({ kind: "classe", classe: c })}
                    onSparkline={(day) => setDrawer({ kind: "jourClasse", classe: c, day })}
                  />
                ))
              )}
            </tbody>
            {classesFiltrees.length > 0 && (
              <tfoot className="bg-muted/30 font-semibold text-xs">
                <tr>
                  <td className="px-3 py-2">Total ({classesFiltrees.length})</td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {classesFiltrees.reduce((s, c) => s + c.effectif, 0)}
                  </td>
                  <td className="px-3 py-2 text-left tabular-nums">
                    {classesFiltrees.reduce((s, c) => s + c.actifs7j, 0)} /{" "}
                    {classesFiltrees.reduce((s, c) => s + c.effectif, 0)}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {classesFiltrees.reduce((s, c) => s + c.decrocheurs, 0)}
                  </td>
                  <td></td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {formatTemps(
                      classesFiltrees.reduce((s, c) => s + c.tempsMoyMin * c.effectif, 0) /
                      Math.max(classesFiltrees.reduce((s, c) => s + c.effectif, 0), 1)
                    )}
                  </td>
                  <td></td>
                  <td className="px-3 py-2 text-left tabular-nums">
                    {Math.round(
                      classesFiltrees.reduce((s, c) => s + c.engagementPct * c.effectif, 0) /
                      Math.max(classesFiltrees.reduce((s, c) => s + c.effectif, 0), 1)
                    )}%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* ── 3 mini-cards en bas ── */}
      <div className="grid md:grid-cols-3 gap-3">
        <MiniCard icon={<Flame className="w-4 h-4 text-orange-500" />} title="Top activités tous niveaux">
          {global.topActivites.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucune activité</p>
          ) : (
            <ul className="space-y-1.5">
              {global.topActivites.map((a, i) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setDrawer({ kind: "activite", id: a.id, label: a.label })}
                    className="w-full flex items-center gap-2 text-xs hover:bg-muted/60 rounded-md px-1 py-0.5 transition-colors text-left"
                    title={`Voir les élèves qui ont joué ${a.label}`}
                  >
                    <span className="text-muted-foreground w-4 text-right tabular-nums">{i + 1}.</span>
                    <span className="text-base">{a.icone}</span>
                    <span className="flex-1 truncate">{a.label}</span>
                    <span className="text-muted-foreground tabular-nums">{a.nb}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </MiniCard>

        <MiniCard icon={<AlertTriangle className="w-4 h-4 text-orange-600" />} title="Décrocheurs à relancer">
          {global.decrocheursList.length === 0 ? (
            <p className="text-xs text-emerald-600">🎉 Aucun décrocheur</p>
          ) : (
            <ul className="space-y-1">
              {global.decrocheursList.map(({ eleve, statut }) => (
                <li key={eleve.eleveId}>
                  <button
                    type="button"
                    onClick={() => setDrawer({ kind: "eleve", eleve })}
                    className="w-full flex items-center justify-between gap-2 text-xs hover:bg-muted/60 rounded-md px-1 py-0.5 transition-colors text-left"
                    title={`Ouvrir la fiche de ${anonName(eleve)}`}
                  >
                    <span className="truncate">
                      <span className="font-medium">{anonName(eleve)}</span>
                      <span className="text-muted-foreground ml-1">· {eleve.classeNom}</span>
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border shrink-0 ${
                      statut.type === "alert"
                        ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-orange-100 text-orange-700 border-orange-200"
                    }`}>
                      {statut.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </MiniCard>

        <MiniCard icon={<BarChart3 className="w-4 h-4 text-blue-500" />} title="Activité par jour de la semaine">
          {(() => {
            const max = Math.max(...global.parJourSemaine.map((x) => x.nb), 1);
            return (
              <div className="space-y-1">
                {global.parJourSemaine.map((j) => (
                  <div key={j.jour} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-muted-foreground">{j.jour}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(j.nb / max) * 100}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-muted-foreground w-10 text-right">{j.nb}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </MiniCard>
      </div>

      {/* ── Drawers (router) ── */}
      {drawer && <DrawerRouter drawer={drawer} classes={classesFiltrees} remindersMap={remindersMap} onRefreshReminders={rechargerRappels} onClose={() => setDrawer(null)} onOpen={setDrawer} />}
    </div>
  );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, hue, onClick }: { label: string; value: string; sub?: string; hue: string; onClick?: () => void }) {
  const colors: Record<string, string> = {
    blue:    "border-blue-200 bg-blue-50 text-blue-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    orange:  "border-orange-200 bg-orange-50 text-orange-900",
    purple:  "border-purple-200 bg-purple-50 text-purple-900",
  };
  const cls = `rounded-xl border-2 p-3 text-left w-full transition-all ${colors[hue] ?? colors.blue} ${onClick ? "cursor-pointer hover:scale-[1.02] hover:shadow-md" : ""}`;
  const content = (
    <>
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-medium mt-0.5 flex items-center gap-1">
        {label} {onClick && <span className="opacity-50">›</span>}
      </p>
      {sub && <p className="text-[10px] opacity-70 mt-0.5">{sub}</p>}
    </>
  );
  return onClick ? <button type="button" onClick={onClick} className={cls}>{content}</button> : <div className={cls}>{content}</div>;
}

function ClasseRow({ c, onOpen, onSparkline }: { c: ClasseStats; onOpen: () => void; onSparkline: (day: string) => void }) {
  const engColor =
    c.engagementPct >= 75 ? "bg-emerald-500" :
    c.engagementPct >= 50 ? "bg-blue-500"    :
    c.engagementPct >= 25 ? "bg-amber-500"   : "bg-red-400";

  return (
    <tr className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors" onClick={onOpen}>
      <td className="px-3 py-2 font-medium" style={{ borderLeft: `4px solid ${c.couleur}` }}>
        <span>{c.nom}</span>
      </td>
      <td className="px-3 py-2 text-center tabular-nums">{c.effectif}</td>
      <td className="px-3 py-2 min-w-[110px]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs tabular-nums w-10">{c.actifs7j}/{c.effectif}</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${engColor}`} style={{ width: `${c.engagementPct}%` }} />
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-center">
        {c.decrocheurs > 0 ? (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            c.decrocheurs >= 5 ? "bg-red-100 text-red-700"
            : c.decrocheurs >= 2 ? "bg-orange-100 text-orange-700"
            : "bg-amber-100 text-amber-700"
          }`}>{c.decrocheurs}</span>
        ) : <span className="text-muted-foreground">—</span>}
      </td>
      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
        <Sparkline data={c.sparkline30j} color={c.couleur} onPick={(idx) => {
          const d = new Date(Date.now() - (29 - idx) * 86400000);
          onSparkline(d.toLocaleDateString("fr-FR"));
        }} />
      </td>
      <td className="px-3 py-2 text-center text-xs font-mono">{formatTemps(c.tempsMoyMin)}</td>
      <td className="px-3 py-2">
        {c.topExo ? (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted">
            {(() => {
              // recompute icone from id
              const id = c.topExo.id;
              if (id.startsWith("apprendre")) return "🧠";
              if (id.startsWith("proportions")) return "📊";
              if (id.startsWith("fractions")) return "🔢";
              if (id.startsWith("parallelogramme")) return "🔷";
              if (id.startsWith("eval-4e")) return "📝";
              if (id.startsWith("prix")) return "💶";
              return "📘";
            })()}
            <span className="truncate max-w-[120px]">{c.topExo.label}</span>
          </span>
        ) : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5 min-w-[80px]">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${engColor}`} style={{ width: `${c.engagementPct}%` }} />
          </div>
          <span className="text-xs font-bold tabular-nums w-8 text-right">{c.engagementPct}%</span>
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <span className="text-xs text-muted-foreground hover:text-foreground">Détails ›</span>
      </td>
    </tr>
  );
}

function Sparkline({ data, color, onPick }: { data: number[]; color: string; onPick?: (idx: number) => void }) {
  const w = 80, h = 22;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`).join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={`block mx-auto ${onPick ? "cursor-pointer" : ""}`}
      onClick={(e) => {
        if (!onPick) return;
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * w;
        const idx = Math.max(0, Math.min(data.length - 1, Math.round((x / w) * (data.length - 1))));
        onPick(idx);
      }}
    >
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Zone cliquable invisible */}
      {onPick && <rect x={0} y={0} width={w} height={h} fill="transparent" />}
    </svg>
  );
}

function MiniCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════
// DRAWER ROUTER + tous les drawers
// ═══════════════════════════════════════

function DrawerRouter({
  drawer, classes, remindersMap, onRefreshReminders, onClose, onOpen,
}: {
  drawer: Drawer;
  classes: ClasseStats[];
  remindersMap: Record<string, StudentRemindersEntry>;
  onRefreshReminders: () => void;
  onClose: () => void;
  onOpen: (d: Drawer) => void;
}) {
  if (drawer.kind === "classe") return <ClasseDrawer classe={drawer.classe} onClose={onClose} onPickEleve={(e) => onOpen({ kind: "eleve", eleve: e })} />;
  if (drawer.kind === "eleve")  return <EleveDrawer eleve={drawer.eleve} remindersMap={remindersMap} onRefreshReminders={onRefreshReminders} onClose={onClose} />;
  if (drawer.kind === "activite") return <ActiviteDrawer id={drawer.id} label={drawer.label} classes={classes} onClose={onClose} onPickEleve={(e) => onOpen({ kind: "eleve", eleve: e })} />;
  if (drawer.kind === "jourClasse") return <JourClasseDrawer classe={drawer.classe} day={drawer.day} onClose={onClose} onPickEleve={(e) => onOpen({ kind: "eleve", eleve: e })} />;
  // Listes "stat globale"
  return <ListeDrawer kind={drawer.kind} classes={classes} onClose={onClose} onPickEleve={(e) => onOpen({ kind: "eleve", eleve: e })} />;
}

function DrawerShell({ title, subtitle, color, onClose, children }: {
  title: string; subtitle?: string; color?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-background shadow-2xl flex flex-col h-full overflow-hidden">
        <div
          className="px-5 py-4 flex items-center gap-3 shrink-0 border-b border-border"
          style={color ? { background: color, color: "white" } : undefined}
        >
          <button onClick={onClose} className={`rounded-lg p-1 ${color ? "hover:bg-white/20" : "hover:bg-muted"}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-tight truncate">{title}</p>
            {subtitle && <p className={`text-xs truncate ${color ? "opacity-80" : "text-muted-foreground"}`}>{subtitle}</p>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">{children}</div>
      </div>
    </div>
  );
}

// ─── Drawer : détail classe (élèves cliquables) ─────────────────────────────
function ClasseDrawer({ classe, onClose, onPickEleve }: { classe: ClasseStats; onClose: () => void; onPickEleve: (e: EleveStats) => void }) {
  const elevesTri = [...classe.eleves].sort((a, b) => {
    if (a.jamaisConnecte !== b.jamaisConnecte) return a.jamaisConnecte ? 1 : -1;
    return (b.derniereActivite?.getTime() ?? 0) - (a.derniereActivite?.getTime() ?? 0);
  });
  return (
    <DrawerShell
      title={classe.nom}
      subtitle={`${classe.effectif} élèves · ${classe.actifs7j} actifs cette semaine`}
      color={classe.couleur}
      onClose={onClose}
    >
      <div className="grid grid-cols-3 gap-2 px-1 py-3 -mx-1 border-b border-border mb-2">
        <div className="text-center"><p className="text-lg font-black tabular-nums">{classe.engagementPct}%</p><p className="text-[10px] text-muted-foreground">engagement</p></div>
        <div className="text-center"><p className="text-lg font-black tabular-nums">{formatTemps(classe.tempsMoyMin)}</p><p className="text-[10px] text-muted-foreground">temps moy.</p></div>
        <div className="text-center"><p className="text-lg font-black text-orange-600 tabular-nums">{classe.decrocheurs}</p><p className="text-[10px] text-muted-foreground">décrocheurs</p></div>
      </div>
      <div className="space-y-1">
        {elevesTri.map((e) => <EleveLine key={e.eleveId} e={e} onPick={() => onPickEleve(e)} />)}
      </div>
    </DrawerShell>
  );
}

// ─── Drawer : fiche élève (timeline + scores + implication) ─────────────────
function EleveDrawer({ eleve, remindersMap, onRefreshReminders, onClose }: { eleve: EleveStats; remindersMap: Record<string, StudentRemindersEntry>; onRefreshReminders: () => void; onClose: () => void }) {
  const sessions = buildSessions(eleve.resultatsRaw);
  const totalMin = sessions.reduce((s, x) => s + x.dureeMin, 0);
  const distinctes = new Set(eleve.resultatsRaw.map((r) => r.exercice)).size;
  const moy = moyenneEleve(eleve.resultatsRaw);
  const impl = scoreImplication(eleve);
  const implL = implicationLabel(impl);
  const moyColor = moy.nb === 0 ? "text-muted-foreground"
                  : moy.pct >= 80 ? "text-emerald-700"
                  : moy.pct >= 50 ? "text-amber-700" : "text-red-700";

  const rappels = remindersMap[studentKey(eleve.prenom, eleve.nom, eleve.classeNom)];
  const inact = inactiviteStatut(eleve);
  const [creatingRelance, setCreatingRelance] = useState(false);
  const [histoOpen, setHistoOpen] = useState(false);

  const creerRelance = async () => {
    if (!rappels?.studentId || creatingRelance) return;
    setCreatingRelance(true);
    const txt = eleve.jamaisConnecte
      ? "Relancer : jamais connecté aux apps maths"
      : `Relancer : pas connecté depuis ${inact?.label.replace("Inactif ", "") ?? ""}`;
    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: rappels.studentId, text: txt }),
      });
      if (!res.ok) throw new Error();
      toast.success("Rappel de relance créé");
      await onRefreshReminders();
    } catch {
      toast.error("Erreur création rappel");
    } finally {
      setCreatingRelance(false);
    }
  };

  return (
    <DrawerShell
      title={anonName(eleve)}
      subtitle={eleve.classeNom}
      color="#1e40af"
      onClose={onClose}
    >
      <div className="grid grid-cols-4 gap-1 px-1 py-3 -mx-1 border-b border-border mb-2 text-center">
        <div><p className="text-base font-black tabular-nums">{sessions.length}</p><p className="text-[10px] text-muted-foreground">session{sessions.length > 1 ? "s" : ""}</p></div>
        <div><p className="text-base font-black tabular-nums">{formatTemps(totalMin)}</p><p className="text-[10px] text-muted-foreground">temps</p></div>
        <div><p className="text-base font-black tabular-nums">{distinctes}</p><p className="text-[10px] text-muted-foreground">activités</p></div>
        <div><p className={`text-base font-black tabular-nums ${moyColor}`}>{moy.nb > 0 ? `${moy.pct}%` : "—"}</p><p className="text-[10px] text-muted-foreground">moyenne</p></div>
      </div>

      <div className="px-1 py-2 mb-2 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Implication</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${implL.color}`}>{implL.label} · {impl}/100</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${impl >= 75 ? "bg-emerald-500" : impl >= 50 ? "bg-blue-500" : impl >= 25 ? "bg-amber-500" : "bg-red-400"}`} style={{ width: `${impl}%` }} />
        </div>
      </div>

      {inact && rappels?.studentId && (
        <div className="px-1 py-2 mb-2 border-b border-border">
          <button
            onClick={creerRelance}
            disabled={creatingRelance}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            <BellPlus className="w-4 h-4" />
            {creatingRelance ? "Création…" : `Créer rappel : relancer (${inact.label.toLowerCase()})`}
          </button>
        </div>
      )}

      {rappels && rappels.pendingCount > 0 && (
        <div className="px-1 py-2 mb-2 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-[11px] font-semibold text-muted-foreground">Rappels en cours</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              {rappels.pendingCount}
            </span>
          </div>
          <ul className="space-y-1">
            {rappels.pending.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-muted/40 border border-border">
                {r.categoryIcon && <span className="text-sm shrink-0">{r.categoryIcon}</span>}
                <span className="flex-1 truncate">{r.text}</span>
                {r.dueDate && (
                  <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                    {new Date(r.dueDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rappels && rappels.doneCount > 0 && (
        <div className="px-1 py-2 mb-2 border-b border-border">
          <button
            type="button"
            onClick={() => setHistoOpen((v) => !v)}
            className="w-full flex items-center gap-2 text-left hover:opacity-80"
          >
            {histoOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRightIcon className="w-3.5 h-3.5 text-muted-foreground" />}
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold text-muted-foreground">Historique rappels</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              {rappels.doneCount}
            </span>
          </button>
          {histoOpen && (
            <ul className="space-y-1 mt-2">
              {rappels.done.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-muted/20 border border-border/50 opacity-75">
                  {r.categoryIcon && <span className="text-sm shrink-0 grayscale">{r.categoryIcon}</span>}
                  <span className="flex-1 truncate line-through text-muted-foreground">{r.text}</span>
                  {r.doneAt && (
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      ✓ {new Date(r.doneAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Aucune session enregistrée</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{sess.debut.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>
                  <p className="text-xs text-muted-foreground">{sess.debut.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} → {sess.fin.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">{formatTemps(sess.dureeMin)}</span>
              </div>
              <div className="divide-y divide-border">
                {sess.activites.map((act, j) => {
                  const sc = scoreColorClasses(act.score, act.total);
                  const pct = act.total > 0 ? Math.round((act.score / act.total) * 100) : null;
                  const ic = humanizeExercice(act.id).icone;
                  return (
                    <div key={j} className="px-3 py-2 flex items-center gap-2">
                      <span className="text-base shrink-0">{ic}</span>
                      <span className="flex-1 text-sm truncate">{act.label}</span>
                      {act.total > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sc.bg} ${sc.text} ${sc.border} shrink-0 tabular-nums`}>
                          {act.score}/{act.total}{pct !== null && <span className="opacity-60 ml-1">({pct}%)</span>}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{act.ts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DrawerShell>
  );
}

// ─── Drawer : qui a joué cette activité ─────────────────────────────────────
function ActiviteDrawer({ id, label, classes, onClose, onPickEleve }: {
  id: string; label: string; classes: ClasseStats[]; onClose: () => void; onPickEleve: (e: EleveStats) => void;
}) {
  const rows = useMemo(() => {
    const out: { eleve: EleveStats; nb: number; meilleur: number | null; moyPct: number | null; dernier: Date }[] = [];
    for (const c of classes) {
      for (const e of c.eleves) {
        const res = e.resultatsRaw.filter((r) => r.exercice === id);
        if (res.length === 0) continue;
        const scored = res.filter((r) => r.total > 0);
        const meilleur = scored.length > 0 ? Math.max(...scored.map((r) => Math.round((r.score / r.total) * 100))) : null;
        const moyPct = scored.length > 0 ? Math.round(scored.reduce((s, r) => s + (r.score / r.total) * 100, 0) / scored.length) : null;
        const dernier = new Date(Math.max(...res.map((r) => new Date(r.createdAt).getTime())));
        out.push({ eleve: e, nb: res.length, meilleur, moyPct, dernier });
      }
    }
    return out.sort((a, b) => (b.meilleur ?? -1) - (a.meilleur ?? -1) || b.nb - a.nb);
  }, [id, classes]);

  return (
    <DrawerShell
      title={label}
      subtitle={`${rows.length} élève${rows.length > 1 ? "s" : ""} · ${rows.reduce((s, r) => s + r.nb, 0)} tentatives`}
      color="#f97316"
      onClose={onClose}
    >
      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Aucun élève sur ce filtre</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r, i) => {
            const c = r.meilleur === null ? "text-muted-foreground"
                    : r.meilleur >= 80 ? "text-emerald-700"
                    : r.meilleur >= 50 ? "text-amber-700" : "text-red-700";
            return (
              <button key={r.eleve.eleveId} onClick={() => onPickEleve(r.eleve)}
                className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/60 border border-transparent hover:border-border transition-colors">
                <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{anonName(r.eleve)} <span className="text-[10px] text-muted-foreground">· {r.eleve.classeNom}</span></p>
                  <p className="text-[10px] text-muted-foreground">{r.nb} tentative{r.nb > 1 ? "s" : ""}{r.moyPct !== null && ` · moy ${r.moyPct}%`} · {formatDate(r.dernier)}</p>
                </div>
                <span className={`text-xs font-bold tabular-nums shrink-0 ${c}`}>
                  {r.meilleur !== null ? `${r.meilleur}%` : `${r.nb}×`}
                </span>
                <span className="text-[10px] text-muted-foreground">›</span>
              </button>
            );
          })}
        </div>
      )}
    </DrawerShell>
  );
}

// ─── Drawer : connexions d'une classe un jour donné ─────────────────────────
function JourClasseDrawer({ classe, day, onClose, onPickEleve }: {
  classe: ClasseStats; day: string; onClose: () => void; onPickEleve: (e: EleveStats) => void;
}) {
  const rows = useMemo(() => {
    return classe.eleves
      .map((e) => {
        const dayRes = e.resultatsRaw.filter((r) => new Date(r.createdAt).toLocaleDateString("fr-FR") === day);
        if (dayRes.length === 0) return null;
        return {
          eleve: e,
          nb: dayRes.length,
          activites: dayRes
            .map((r) => ({ label: humanizeExercice(r.exercice).label, icone: humanizeExercice(r.exercice).icone, ts: new Date(r.createdAt), score: r.score, total: r.total }))
            .sort((a, b) => a.ts.getTime() - b.ts.getTime()),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.nb - a.nb);
  }, [classe, day]);

  return (
    <DrawerShell
      title={`${classe.nom} · ${day}`}
      subtitle={`${rows.length} élève${rows.length > 1 ? "s" : ""} actif${rows.length > 1 ? "s" : ""} ce jour-là`}
      color={classe.couleur}
      onClose={onClose}
    >
      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Aucun élève actif ce jour-là</p>
      ) : (
        <div className="space-y-2">
          {rows.map(({ eleve, nb, activites }) => (
            <div key={eleve.eleveId} onClick={() => onPickEleve(eleve)}
              className="border border-border rounded-xl p-2.5 cursor-pointer hover:bg-muted/60 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{anonName(eleve)}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                  {nb} activité{nb > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-0.5">
                {activites.map((act, i) => {
                  const sc = scoreColorClasses(act.score, act.total);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-[10px] text-muted-foreground tabular-nums w-10 shrink-0">{act.ts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="shrink-0">{act.icone}</span>
                      <span className="flex-1 truncate">{act.label}</span>
                      {act.total > 0 && (
                        <span className={`text-[10px] font-bold px-1 py-0.5 rounded border ${sc.bg} ${sc.text} ${sc.border} shrink-0 tabular-nums`}>{act.score}/{act.total}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DrawerShell>
  );
}

// ─── Drawer : liste générique pour les 4 StatCards ──────────────────────────
function ListeDrawer({ kind, classes, onClose, onPickEleve }: {
  kind: "topTime" | "actifs7j" | "decrocheurs" | "topSessions";
  classes: ClasseStats[];
  onClose: () => void;
  onPickEleve: (e: EleveStats) => void;
}) {
  const allEleves = useMemo(() => classes.flatMap((c) => c.eleves), [classes]);

  let title = "";
  let subtitle = "";
  let rows: { eleve: EleveStats; primary: string; primaryColor?: string; secondary?: string }[] = [];

  if (kind === "topTime") {
    title = "Temps de travail";
    subtitle = `${formatTemps(allEleves.reduce((s, e) => s + e.tempsEstimeMin, 0))} cumulés`;
    rows = [...allEleves]
      .filter((e) => !e.jamaisConnecte)
      .sort((a, b) => b.tempsEstimeMin - a.tempsEstimeMin)
      .map((e) => ({ eleve: e, primary: formatTemps(e.tempsEstimeMin), secondary: `${e.classeNom} · ${e.joursActifs30j}j actifs sur 30` }));
  } else if (kind === "topSessions") {
    title = "Tous les élèves";
    subtitle = `${allEleves.length} élèves au total`;
    rows = [...allEleves]
      .map((e) => ({ eleve: e, n: buildSessions(e.resultatsRaw).length }))
      .sort((a, b) => b.n - a.n)
      .map((x) => ({ eleve: x.eleve, primary: `${x.n} session${x.n > 1 ? "s" : ""}`, secondary: `${x.eleve.classeNom} · ${formatTemps(x.eleve.tempsEstimeMin)}` }));
  } else if (kind === "actifs7j") {
    const actifs = allEleves.filter((e) => e.joursActifs7j > 0);
    title = "Actifs cette semaine";
    subtitle = `${actifs.length} / ${allEleves.length}`;
    rows = actifs
      .sort((a, b) => b.joursActifs7j - a.joursActifs7j || (b.derniereActivite?.getTime() ?? 0) - (a.derniereActivite?.getTime() ?? 0))
      .map((e) => ({ eleve: e, primary: `${e.joursActifs7j} j`, primaryColor: "text-emerald-700", secondary: `${e.classeNom} · ${e.derniereActivite ? formatDate(e.derniereActivite) : ""}` }));
  } else {
    // decrocheurs
    const list = allEleves
      .map((e) => ({ e, s: inactiviteStatut(e) }))
      .filter((x): x is { e: EleveStats; s: NonNullable<ReturnType<typeof inactiviteStatut>> } => x.s !== null)
      .sort((a, b) => {
        if (a.e.jamaisConnecte !== b.e.jamaisConnecte) return a.e.jamaisConnecte ? -1 : 1;
        const ja = a.e.derniereActivite ? Math.floor((Date.now() - a.e.derniereActivite.getTime()) / 86400000) : Infinity;
        const jb = b.e.derniereActivite ? Math.floor((Date.now() - b.e.derniereActivite.getTime()) / 86400000) : Infinity;
        return jb - ja;
      });
    title = "Décrocheurs à relancer";
    subtitle = `${list.length} élève${list.length > 1 ? "s" : ""}`;
    rows = list.map(({ e, s }) => ({
      eleve: e,
      primary: s.label,
      primaryColor: s.type === "alert" ? "text-red-700" : "text-orange-700",
      secondary: e.classeNom,
    }));
  }

  return (
    <DrawerShell title={title} subtitle={subtitle} onClose={onClose}>
      {rows.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">Aucun élève à afficher</p>
      ) : (
        <div className="space-y-1">
          {rows.map((r, i) => (
            <button key={r.eleve.eleveId} onClick={() => onPickEleve(r.eleve)}
              className="w-full text-left flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-muted/60 border border-transparent hover:border-border transition-colors">
              <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{anonName(r.eleve)}</p>
                {r.secondary && <p className="text-[10px] text-muted-foreground truncate">{r.secondary}</p>}
              </div>
              <span className={`text-xs font-bold tabular-nums shrink-0 ${r.primaryColor ?? ""}`}>{r.primary}</span>
              <span className="text-[10px] text-muted-foreground">›</span>
            </button>
          ))}
        </div>
      )}
    </DrawerShell>
  );
}

// ─── Ligne élève cliquable (pour ClasseDrawer) ──────────────────────────────
function EleveLine({ e, onPick }: { e: EleveStats; onPick: () => void }) {
  const statut = inactiviteStatut(e);
  return (
    <button type="button" onClick={onPick}
      className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/60 text-sm border border-transparent hover:border-border transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate flex items-center gap-1.5">
          {e.activeNow && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          {anonName(e)}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {e.jamaisConnecte ? "Jamais connecté"
           : `${formatDate(e.derniereActivite!)} · ${formatTemps(e.tempsEstimeMin)}`}
        </p>
      </div>
      {statut && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
          statut.type === "alert"
            ? "bg-red-100 text-red-700 border border-red-200"
            : "bg-orange-100 text-orange-700 border border-orange-200"
        }`}>{statut.label}</span>
      )}
      {!statut && e.joursActifs7j > 0 && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
          {e.joursActifs7j}j
        </span>
      )}
      <span className="text-[10px] text-muted-foreground">›</span>
    </button>
  );
}
