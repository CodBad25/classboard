#!/usr/bin/env node
// Import des classes et élèves depuis le Hub (hub.beltools.fr) vers la base ClassBoard.
//
// RGPD : ce script manipule des données nominatives mais n'en affiche AUCUNE.
// Toutes les sorties sont des comptages agrégés.
//
// Usage :
//   node scripts/import-hub.mjs                 → simulation (aucune écriture)
//   node scripts/import-hub.mjs --apply         → écrit en base
//   node scripts/import-hub.mjs --year 26-27 --classes 6A,6D,5A,4A,4B
//
// Idempotent : relancer ne crée pas de doublons (les classes sont reconnues par
// leur nom dans l'année, les élèves par nom+prénom dans leur classe).

import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";

// ── Arguments ──
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const APPLY = argv.includes("--apply");
const HUB_YEAR = arg("year", "26-27");
const CB_YEAR = arg("label", "20" + HUB_YEAR.split("-")[0] + "-20" + HUB_YEAR.split("-")[1]);
const WANTED = arg("classes", "6A,6D,5A,4A,4B").split(",").map((s) => s.trim().toUpperCase());

// Couleur par niveau, cohérente avec la palette de l'app (CLASS_COLORS).
const COLOR_BY_LEVEL = { "6": "blue", "5": "green", "4": "purple", "3": "cyan" };

// ── Environnement ──
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const { DATABASE_URL, HUB_API_KEY } = process.env;
if (!DATABASE_URL || !HUB_API_KEY) {
  console.error("DATABASE_URL ou HUB_API_KEY manquante dans .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const hub = async (path) => {
  const res = await fetch(`https://hub.beltools.fr/api/v1${path}`, {
    headers: { "x-api-key": HUB_API_KEY },
  });
  if (!res.ok) throw new Error(`Hub ${res.status} sur ${path}`);
  return res.json();
};

console.log(`Mode        : ${APPLY ? "ÉCRITURE" : "simulation (aucune écriture)"}`);
console.log(`Année Hub   : ${HUB_YEAR}  →  ClassBoard : ${CB_YEAR}`);
console.log(`Classes     : ${WANTED.join(", ")}\n`);

// ── 1. Année scolaire ──
const years = await sql`SELECT id, label, is_current FROM school_years ORDER BY label DESC`;
console.log("Années en base :", years.map((y) => y.label + (y.is_current ? " (courante)" : "")).join(", ") || "aucune");

let year = years.find((y) => y.label === CB_YEAR);
if (!year) {
  console.log(`→ création de l'année ${CB_YEAR}`);
  const id = randomUUID();
  if (APPLY) await sql`INSERT INTO school_years (id, label, is_current) VALUES (${id}, ${CB_YEAR}, false)`;
  year = { id, label: CB_YEAR, is_current: false };
}
if (!year.is_current) {
  console.log(`→ ${CB_YEAR} devient l'année courante`);
  if (APPLY) {
    await sql`UPDATE school_years SET is_current = false WHERE is_current = true`;
    await sql`UPDATE school_years SET is_current = true WHERE id = ${year.id}`;
  }
} else {
  console.log(`✓ ${CB_YEAR} est déjà l'année courante`);
}

// ── 2. Classes ──
const hubClasses = (await hub("/classes")).classes.filter(
  (c) => c.anneeScolaire === HUB_YEAR && WANTED.includes(c.nom.toUpperCase())
);
const manquantes = WANTED.filter((w) => !hubClasses.some((c) => c.nom.toUpperCase() === w));
if (manquantes.length) console.log(`\n⚠ absentes du Hub en ${HUB_YEAR} : ${manquantes.join(", ")}`);

const existing = await sql`SELECT id, name FROM classes WHERE school_year_id = ${year.id}`;
console.log(`\nClasses déjà présentes dans ${CB_YEAR} : ${existing.length}`);

let totalCrees = 0, totalDejaLa = 0, totalIgnores = 0;

for (const [i, hc] of hubClasses.entries()) {
  let cls = existing.find((c) => c.name.toUpperCase() === hc.nom.toUpperCase());
  let action = "existante";

  if (!cls) {
    const id = randomUUID();
    const color = COLOR_BY_LEVEL[hc.nom[0]] || "blue";
    if (APPLY) {
      await sql`INSERT INTO classes (id, school_year_id, name, color, sort_order)
                VALUES (${id}, ${year.id}, ${hc.nom}, ${color}, ${i})`;
    }
    cls = { id, name: hc.nom };
    action = "créée";
  }

  // ── 3. Élèves ──
  const eleves = (await hub(`/classes/${hc.id}/eleves?actif=true`)).eleves.filter((e) => e.actif !== false);
  const enBase = APPLY || action === "existante"
    ? await sql`SELECT first_name, last_name FROM students WHERE class_id = ${cls.id}`
    : [];
  const cle = (p, n) => `${p}|${n}`.toLowerCase().trim();
  const deja = new Set(enBase.map((s) => cle(s.first_name, s.last_name)));

  let crees = 0, ignores = 0;
  for (const [j, el] of eleves.entries()) {
    if (deja.has(cle(el.prenom, el.nom))) { ignores++; continue; }
    if (APPLY) {
      await sql`INSERT INTO students (id, class_id, first_name, last_name, sort_order)
                VALUES (${randomUUID()}, ${cls.id}, ${el.prenom}, ${el.nom}, ${j})`;
    }
    crees++;
  }

  totalCrees += crees; totalDejaLa += enBase.length; totalIgnores += ignores;
  console.log(`  ${hc.nom.padEnd(4)} ${action.padEnd(10)} — Hub : ${String(eleves.length).padStart(2)} élèves · à créer : ${String(crees).padStart(2)} · déjà en base : ${ignores}`);
}

console.log(`\n${APPLY ? "Importés" : "À importer"} : ${totalCrees} élèves sur ${hubClasses.length} classes (${totalIgnores} déjà présents).`);
if (!APPLY) console.log("Relancer avec --apply pour écrire en base.");
