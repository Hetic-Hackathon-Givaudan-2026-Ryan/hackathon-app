import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Prospect } from '../types';
import { CompanyMark, ScoreBadge } from './ui';

const sizeLabel = (s: string) =>
  ({ GE: 'Grand groupe', ETI: 'ETI', PME: 'PME' })[s] ?? s;

export interface Column {
  key: string;
  label: ReactNode;
  cell: (p: Prospect) => ReactNode;
  className?: string;
}

// Colonnes communes à l'accueil et à la base des prospects
export const columns = {
  name: {
    key: 'name',
    label: 'Entreprise',
    className: 'col-name',
    cell: (p) => (
      <span className="company">
        <CompanyMark name={p.name} />
        <span>
          <Link to={`/prospects/${p.id}`}>{p.name}</Link>
          <small>{p.segment}</small>
        </span>
      </span>
    ),
  },
  zone: {
    key: 'zone',
    label: 'Zone',
    cell: (p) => [p.country, p.city].filter(Boolean).join(' · '),
  },
  size: { key: 'size', label: 'Taille', cell: (p) => sizeLabel(p.size) },
  reach: { key: 'reach', label: 'Portée', cell: (p) => p.reach },
  why: {
    key: 'why',
    label: 'Opportunité principale',
    className: 'col-why',
    cell: (p) =>
      p.why.charAt(0).toUpperCase() + p.why.slice(1).replace(/\.$/, ''),
  },
  score: {
    key: 'score',
    label: 'Score',
    className: 'col-score',
    cell: (p) => <ScoreBadge score={p.score} />,
  },
} satisfies Record<string, Column>;

// Tableau de prospects : toute la ligne ouvre la fiche, le nom reste le lien
// pour le clavier et les lecteurs d'écran.
export default function ProspectTable({
  rows,
  cols,
  caption,
  empty,
  animateKey,
  headless = false,
}: {
  rows: Prospect[];
  cols: Column[];
  caption: string;
  empty?: ReactNode;
  animateKey?: string; // change quand les filtres changent, pour un fondu court
  headless?: boolean; // sans ligne d'en-tête visible (accueil)
}) {
  const navigate = useNavigate();

  return (
    <div className="table-wrap">
      <table className="table table--rows">
        <caption className="sr">{caption}</caption>
        <thead className={headless ? 'sr' : undefined}>
          <tr>
            {cols.map((c) => (
              <th key={c.key} scope="col" className={c.className}>
                {c.label}
              </th>
            ))}
            <th aria-hidden="true" className="col-go"></th>
          </tr>
        </thead>
        <tbody key={animateKey} className="fade-in">
          {rows.length === 0 ? (
            <tr className="empty">
              <td colSpan={cols.length + 1}>{empty}</td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr
                key={p.id}
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('a, button'))
                    navigate(`/prospects/${p.id}`);
                }}
              >
                {cols.map((c) => (
                  <td
                    key={c.key}
                    className={c.className}
                    data-label={typeof c.label === 'string' ? c.label : ''}
                  >
                    {c.cell(p)}
                  </td>
                ))}
                <td className="col-go" aria-hidden="true">
                  <span className="chev">›</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
