// Point d'accès unique aux données du dashboard.
// Par défaut : données mockées. Avec `npm run dev:ia` (VITE_DATA_SOURCE=ia) :
// le service de prospection local (dépôt Equipe-01), joint via le proxy /ia de
// vite.config.ts. Pour un test local seulement : en production, le front passe
// par l'API Express (ADR 0005).
// Les pages n'importent que ces fonctions, jamais mock.ts directement.
import type { Briefing, Prospect, SalesUser } from '../types';
import { currentUser, prospects as mockProspects } from './mock';

export const SOURCE: 'mock' | 'ia' =
  import.meta.env.VITE_DATA_SOURCE === 'ia' ? 'ia' : 'mock';

// Date de référence de la démo, pour que « il y a 8 jours » reste vrai
export const TODAY = '2026-11-12';
const RECENT_DAYS = 21;

export const daysAgo = (iso: string) =>
  Math.round((Date.parse(TODAY) - Date.parse(iso)) / 86_400_000);
export const isRecent = (iso: string) =>
  !!iso && daysAgo(iso) >= 0 && daysAgo(iso) <= RECENT_DAYS;

async function ia<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/ia${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Service IA : erreur ${res.status}`);
  }
  return res.json();
}

// La liste est gardée le temps de la session, comme le ferait un cache HTTP
let list: Promise<Prospect[]> | undefined;

export async function getCurrentUser(): Promise<SalesUser> {
  return currentUser;
}

export async function getProspects(): Promise<Prospect[]> {
  if (SOURCE === 'mock') return mockProspects;
  list ??= ia<Prospect[]>('/prospects').catch((e) => {
    list = undefined;
    throw e;
  });
  return list;
}

// Avec l'IA, la fiche est rédigée à la demande (environ 15 s), sauf les
// premières, pré-rédigées par le service au chargement du jeu de données
// Une seule requête par fiche : en mode dev, React lance chaque chargement
// deux fois, ce qui faisait rédiger la fiche deux fois de suite
const pages = new Map<string, Promise<Prospect | undefined>>();

export async function getProspect(id: string): Promise<Prospect | undefined> {
  if (SOURCE === 'mock') return mockProspects.find((p) => p.id === id);
  let page = pages.get(id);
  if (!page) {
    page = ia<Prospect>(`/prospects/${encodeURIComponent(id)}`).catch((e) => {
      pages.delete(id);
      if (e instanceof Error && /introuvable|Aucun prospect/i.test(e.message))
        return undefined;
      throw e;
    });
    pages.set(id, page);
  }
  return page;
}

export async function getBriefing(): Promise<Briefing> {
  const prospects = await getProspects();
  const priorities = prospects.slice(0, 5);
  const signals = prospects
    .filter((p) => p.signals[0] && isRecent(p.signals[0].date))
    .slice(0, 3)
    .map((p) => ({ prospect: p, signal: p.signals[0] }));
  return { user: currentUser, signals, priorities };
}

export interface DatasetInfo {
  name: string;
  rows: number;
  prospects: number;
  ignoredColumns: string[];
}

// Remplace le jeu de données du service IA par un fichier CSV ou XLSX
export async function uploadDataset(file: File): Promise<DatasetInfo> {
  const form = new FormData();
  form.append('file', file);
  const info = await ia<DatasetInfo>('/datasets', {
    method: 'POST',
    body: form,
  });
  list = undefined;
  pages.clear();
  return info;
}

export async function getDataset(): Promise<DatasetInfo | undefined> {
  if (SOURCE === 'mock') return undefined;
  return ia<DatasetInfo>('/datasets');
}
