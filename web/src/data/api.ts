// Point d'accès unique aux données du dashboard.
// Par défaut : l'API Express (/api/prospects), qui lit PostgreSQL et demande
// au service IA de régénérer une fiche. Avec `npm run dev:mock`
// (VITE_DATA_SOURCE=mock) : les données mockées de mock.ts, sans serveur.
// Avec `npm run dev:ia` (VITE_DATA_SOURCE=ia) :
// le service de prospection local (dépôt Equipe-01), joint via le proxy /ia de
// vite.config.ts. Pour un test local seulement : en production, le front passe
// par l'API Express (ADR 0005).
// Avec `npm run build:static` (VITE_DATA_SOURCE=static) : un export figé du
// service IA (src/data/export.json, non versionné), pour envoyer un prototype
// qui s'ouvre d'un double-clic, sans serveur.
// Les pages n'importent que ces fonctions, jamais mock.ts directement.
import type { Briefing, Prospect, SalesUser } from '../types';
import { currentUser, prospects as mockProspects } from './mock';

const source = import.meta.env.VITE_DATA_SOURCE;
export const SOURCE: 'api' | 'mock' | 'ia' | 'static' =
  source === 'mock' || source === 'ia' || source === 'static' ? source : 'api';

// Export figé : chargé seulement s'il existe (glob vide sinon)
const exported = Object.values(
  import.meta.glob<{ default: StaticExport }>('./export.json', { eager: true }),
)[0]?.default;

export interface StaticExport {
  generatedAt: string;
  model: string;
  dataset: string;
  prospects: Prospect[];
}
export const STATIC_INFO = exported;

// Date de référence de la démo, pour que « il y a 8 jours » reste vrai
export const TODAY = '2026-11-12';
const RECENT_DAYS = 21;

export const daysAgo = (iso: string) =>
  Math.round((Date.parse(TODAY) - Date.parse(iso)) / 86_400_000);
export const isRecent = (iso: string) =>
  !!iso && daysAgo(iso) >= 0 && daysAgo(iso) <= RECENT_DAYS;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `API : erreur ${res.status}`);
  }
  return res.json();
}

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
  if (SOURCE === 'static') return exported?.prospects ?? [];
  if (SOURCE === 'api') return api<Prospect[]>('/prospects');
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
  if (SOURCE === 'static') return exported?.prospects.find((p) => p.id === id);
  if (SOURCE === 'api')
    return api<Prospect>(`/prospects/${encodeURIComponent(id)}`).catch((e) => {
      if (e instanceof Error && /introuvable/i.test(e.message))
        return undefined;
      throw e;
    });
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

export interface FicheResult {
  status: 'regeneree' | 'repli'; // repli : l'IA a échoué, fiche en base inchangée
  reason?: string;
  prospect: Prospect;
}

// Mode « api » : fait réécrire la fiche par le LLM local, puis l'enregistre
export async function regenerateFiche(id: string): Promise<FicheResult> {
  return api<FicheResult>(`/prospects/${encodeURIComponent(id)}/fiche`, {
    method: 'POST',
  });
}

// État du modèle d'IA local (GET /api/ia) : prêt, ou téléchargement en cours
export interface IaStatus {
  model?: string;
  ready: boolean;
  state: 'attente' | 'telechargement' | 'chargement' | 'pret' | 'injoignable';
  progress?: number; // pourcentage du téléchargement
  detail: string;
}

export async function getIaStatus(): Promise<IaStatus> {
  return api<IaStatus>('/ia');
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
  if (SOURCE !== 'ia') return undefined;
  return ia<DatasetInfo>('/datasets');
}
