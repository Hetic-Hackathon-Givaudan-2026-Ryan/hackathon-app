import type { Prospect, SignalType } from '../types';
import { levelLabel, scoreLevel } from '../lib/format';

export const signalLabels: Record<SignalType, string> = {
  lancement: 'Lancement produit',
  levee: 'Levée de fonds',
  recrutement: 'Recrutement',
  usine: 'Nouveau site',
  fournisseur: 'Fournisseurs',
  salon: 'Salon',
};

export function ScorePill({ score }: { score: number }) {
  const level = scoreLevel(score);
  return (
    <span
      className={`score score--${level}`}
      title={`Potentiel ${levelLabel[level]}`}
    >
      <b>{score}</b>
      <small>/100</small>
    </span>
  );
}

export function Evolution({ value }: { value: number }) {
  const kind = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '–';
  return (
    <span className={`evo evo--${kind}`}>
      <i aria-hidden="true">{arrow}</i>
      {value > 0 ? `+${value}` : value}
    </span>
  );
}

const initials = (name: string) =>
  name
    .replace(/[’']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export function CompanyLogo({
  prospect,
  size = 'sm',
}: {
  prospect: Prospect;
  size?: 'sm' | 'lg';
}) {
  return (
    <span className={`logo logo--${size}`} aria-hidden="true">
      {initials(prospect.name)}
    </span>
  );
}

export function SignalChip({ type }: { type: SignalType }) {
  return <span className="chip">{signalLabels[type]}</span>;
}

export function ScoreRing({ score }: { score: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <figure className="ring" aria-label={`Score de maturité ${score} sur 100`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring__track" cx="50" cy="50" r={r} />
        <circle
          className="ring__value"
          cx="50"
          cy="50"
          r={r}
          strokeDasharray={`${(score / 100) * c} ${c}`}
        />
      </svg>
      <figcaption>
        <b>{score}</b>
        <small>score</small>
      </figcaption>
    </figure>
  );
}

export function Loading() {
  return <p className="muted">Chargement…</p>;
}
