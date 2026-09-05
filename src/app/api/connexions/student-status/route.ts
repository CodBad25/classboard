import { NextResponse } from "next/server";
import { getAllCurrentStudents, getCurrentSchoolYear } from "@/lib/queries";
import { getAllClasses, getEleves, getAllResultats } from "@/lib/hub";
import { studentKey } from "@/lib/student-matcher";
import {
  joursActifsDans,
  inactiviteStatut,
  type EleveStats,
} from "@/lib/stats";

export interface StudentStatusEntry {
  type: "warn" | "alert";
  label: string;
  joursInactif: number; // Infinity si jamais connecté
  jamaisConnecte: boolean;
}

export async function GET() {
  try {
    const year = await getCurrentSchoolYear();
    const [students, hubClasses, allResultats] = await Promise.all([
      getAllCurrentStudents(),
      getAllClasses(year?.label),
      getAllResultats(),
    ]);

    // Map résultats par eleveId Hub
    const resByHubId = new Map<string, typeof allResultats>();
    for (const r of allResultats) {
      if (!resByHubId.has(r.eleveId)) resByHubId.set(r.eleveId, []);
      resByHubId.get(r.eleveId)!.push(r);
    }

    // Construire map Hub key → statut
    const hubByKey = new Map<string, StudentStatusEntry>();
    const validClasses = hubClasses.filter((c) => c.nbEleves > 0 && !c.nom.endsWith("T"));
    await Promise.all(
      validClasses.map(async (c) => {
        const eleves = await getEleves(c.id);
        for (const e of eleves) {
          const res = resByHubId.get(e.id) ?? [];
          const jamais = res.length === 0;
          let derniere: Date | null = null;
          if (!jamais) {
            const ts = res.map((r) => new Date(r.createdAt).getTime()).filter((t) => !isNaN(t));
            if (ts.length > 0) derniere = new Date(Math.max(...ts));
          }
          const fakeStats = {
            jamaisConnecte: jamais,
            derniereActivite: derniere,
            joursActifs7j: joursActifsDans(res, 7),
          } as EleveStats;
          const statut = inactiviteStatut(fakeStats);
          if (!statut) continue;
          const jours = derniere ? Math.floor((Date.now() - derniere.getTime()) / 86400000) : Infinity;
          hubByKey.set(studentKey(e.prenom, e.nom, c.nom), {
            type: statut.type,
            label: statut.label,
            joursInactif: jours,
            jamaisConnecte: jamais,
          });
        }
      }),
    );

    // Map résultat indexée par classboard studentId
    const byStudentId: Record<string, StudentStatusEntry> = {};
    for (const s of students) {
      const key = studentKey(s.firstName, s.lastName, s.className);
      const status = hubByKey.get(key);
      if (status) byStudentId[s.id] = status;
    }

    return NextResponse.json({ byStudentId });
  } catch (e) {
    console.error("student-status API error", e);
    return NextResponse.json({ byStudentId: {}, error: "Failed" }, { status: 500 });
  }
}
