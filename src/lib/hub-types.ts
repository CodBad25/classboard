// Types partagés Hub — client + server safe (pas d'import server-only)

export interface HubClasse {
  id: string;
  nom: string;
  niveau: string;
  anneeScolaire: string;
  nbEleves: number;
}

export interface HubEleve {
  id: string;
  nom: string;
  prenom: string;
  actif: boolean;
}

export interface HubResultat {
  id: string;
  eleveId: string;
  app: string;
  exercice: string;
  score: number;
  total: number;
  details: unknown;
  createdAt: string;
}
