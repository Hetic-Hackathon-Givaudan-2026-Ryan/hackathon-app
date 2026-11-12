const short = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});
const long = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

// Une date absente ou illisible (jeu de données importé) s'affiche vide
const safe = (fmt: Intl.DateTimeFormat, iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : fmt.format(d);
};

// « 28 oct. »
export const shortDate = (iso: string) => safe(short, iso);
// « 28 oct. 2026 »
export const longDate = (iso: string) => safe(long, iso);
// « sept. » pour un signal de plus de 45 jours, comme sur le wireframe
export const signalDate = (iso: string, days: number) =>
  days > 45
    ? safe(new Intl.DateTimeFormat('fr-FR', { month: 'short' }), iso)
    : shortDate(iso);

export const plural = (n: number, word: string) =>
  `${n} ${word}${n > 1 ? 's' : ''}`;
