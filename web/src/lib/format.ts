const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
const eurCompact = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  notation: 'compact',
  maximumFractionDigits: 2,
});

export const money = (n: number) => eur.format(n);
export const moneyShort = (n: number) => eurCompact.format(n);
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export type Level = 'high' | 'mid' | 'low';
export const scoreLevel = (score: number): Level =>
  score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
export const levelLabel: Record<Level, string> = {
  high: 'élevé',
  mid: 'moyen',
  low: 'faible',
};

// Un signal est « nouveau » s'il date de 7 jours ou moins.
export const isNewSignal = (iso: string, today = new Date()) =>
  (today.getTime() - new Date(iso).getTime()) / 86_400_000 <= 7;
