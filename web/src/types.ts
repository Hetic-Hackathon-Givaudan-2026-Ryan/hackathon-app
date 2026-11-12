// Contrat des données affichées par le front.
// Aujourd'hui rempli par mock.ts ; demain par l'API branchée sur la base de l'équipe data/IA.

export type SignalType =
  'lancement' | 'levee' | 'recrutement' | 'usine' | 'fournisseur' | 'salon';

export interface Signal {
  type: SignalType;
  label: string;
  date: string; // ISO
}

export interface NewsItem {
  date: string; // ISO
  title: string;
  source: string;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
}

export interface Prospect {
  id: string;
  name: string;
  sector: string;
  country: string;
  website: string;
  arr: number; // revenu annuel récurrent estimé, en euros
  contact: Contact;
  score: number; // 0-100, calculé par l'IA
  evolution: number; // variation du score sur 30 jours
  priority: boolean; // action prioritaire recommandée
  signals: Signal[];
  aiOverview: string;
  scoreFactors: { label: string; weight: number }[];
  news: NewsItem[];
}

export interface SalesUser {
  firstName: string;
  lastName: string;
  revenue: number; // CA réalisé sur l'année, en euros
  target: number; // objectif annuel, en euros
}
