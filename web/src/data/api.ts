// Point d'accès unique aux données du dashboard.
// Aujourd'hui : données mockées. Demain : appels à /api/... décrits dans openapi.yaml (ADR 0003).
// Les pages n'importent que ces fonctions, jamais mock.ts directement.
import type { Prospect, SalesUser } from '../types';
import { currentUser, prospects } from './mock';

export async function getCurrentUser(): Promise<SalesUser> {
  return currentUser;
}

export async function getProspects(): Promise<Prospect[]> {
  return prospects;
}

export async function getProspect(id: string): Promise<Prospect | undefined> {
  return prospects.find((p) => p.id === id);
}
