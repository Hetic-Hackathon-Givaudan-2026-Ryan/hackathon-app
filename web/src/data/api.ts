// Point d'accès unique aux données du dashboard.
// Aujourd'hui : données mockées. Demain : appels à /api/... décrits dans openapi.yaml (ADR 0003).
// Les pages n'importent que ces fonctions, jamais mock.ts directement.
import type { Briefing, Prospect, SalesUser } from '../types';
import { currentUser, prospects } from './mock';

// Date de référence de la démo, pour que « il y a 8 jours » reste vrai
export const TODAY = '2026-11-12';
const RECENT_DAYS = 21;

export const daysAgo = (iso: string) =>
  Math.round((Date.parse(TODAY) - Date.parse(iso)) / 86_400_000);
export const isRecent = (iso: string) => daysAgo(iso) <= RECENT_DAYS;

export async function getCurrentUser(): Promise<SalesUser> {
  return currentUser;
}

export async function getProspects(): Promise<Prospect[]> {
  return prospects;
}

export async function getProspect(id: string): Promise<Prospect | undefined> {
  return prospects.find((p) => p.id === id);
}

export async function getBriefing(): Promise<Briefing> {
  const priorities = prospects.slice(0, 5);
  const signals = priorities
    .filter((p) => p.signals[0] && isRecent(p.signals[0].date))
    .slice(0, 3)
    .map((p) => ({ prospect: p, signal: p.signals[0] }));
  return { user: currentUser, signals, priorities };
}
