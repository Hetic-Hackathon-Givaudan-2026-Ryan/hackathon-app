const short = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});
const long = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// « 28 oct. »
export const shortDate = (iso: string) => short.format(new Date(iso));
// « 28 oct. 2026 »
export const longDate = (iso: string) => long.format(new Date(iso));
// « sept. » pour un signal de plus de 45 jours, comme sur le wireframe
export const signalDate = (iso: string, days: number) =>
  days > 45
    ? new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(new Date(iso))
    : shortDate(iso);

export const plural = (n: number, word: string) =>
  `${n} ${word}${n > 1 ? 's' : ''}`;
