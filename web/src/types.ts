// Contrat des données affichées par le front (wireframe v2).
// Aujourd'hui rempli par mock.ts ; demain par l'API branchée sur la base de l'équipe data/IA.

export type Segment = 'Taste & Wellbeing' | 'Fragrance & Beauty';
export type Size = 'PME' | 'ETI' | 'GE';
export type Reach = 'Locale' | 'Régionale' | 'Internationale';

export type SignalKind =
  | 'Lancement produit'
  | 'Offre d’emploi'
  | 'Réglementation'
  | 'Expansion'
  | 'Levée de fonds'
  | 'Changement de direction';

export interface Signal {
  kind: SignalKind;
  summary: string; // une phrase, affichée sur les cartes
  source: string;
  date: string; // ISO
}

// Un point de la synthèse « À retenir ». `text` accepte **gras**.
export interface Takeaway {
  text: string;
  source: string;
}

export interface Question {
  text: string;
  // Numéros des points « À retenir » liés (à partir de 1), ou les interlocuteurs
  links: number[] | 'contacts';
}

export interface Contact {
  name: string;
  role: string;
  since?: string;
  buyingRole: string; // rôle dans l'achat
  why?: string;
  email: string;
  recommended?: boolean;
}

export interface ScoreItem {
  label: string;
  value: number;
  max: number;
}

export interface ScoreAxis {
  label: 'Potentiel' | 'Opportunité' | 'Accessibilité';
  value: number;
  max: number;
  items: ScoreItem[];
  notes?: string[]; // détail des points, affiché sous les barres
}

export interface ScoreDetail {
  total: number; // 0-100
  trend?: number; // évolution récente, en points (+ ça monte, - ça baisse)
  rank: number; // rang dans le portefeuille
  reliability: 'élevée' | 'moyenne' | 'faible';
  sources: number;
  axes: [ScoreAxis, ScoreAxis, ScoreAxis];
}

export interface Prospect {
  id: string;
  name: string;
  segment: Segment;
  activity: string;
  country: string;
  city: string;
  size: Size;
  revenue?: string; // CA estimé, déjà mis en forme
  reach: Reach;
  website: string;
  why: string; // « Pourquoi maintenant »
  score: ScoreDetail;
  signals: Signal[]; // le plus marquant en premier
  takeaways: Takeaway[];
  questions: Question[];
  contacts: Contact[];
  history: string;
}

export interface SalesUser {
  firstName: string;
  lastName: string;
}

export interface Briefing {
  user: SalesUser;
  signals: { prospect: Prospect; signal: Signal }[];
  priorities: Prospect[];
}
