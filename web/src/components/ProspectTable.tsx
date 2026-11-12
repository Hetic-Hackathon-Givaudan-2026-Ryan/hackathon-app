import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Prospect } from '../types';

export interface Column {
  key: string;
  label: ReactNode;
  cell: (p: Prospect) => ReactNode;
  className?: string;
}

// Colonnes communes au tableau de bord et à la base des prospects
export const columns = {
  name: {
    key: 'name',
    label: 'Entreprise',
    className: 'col-name',
    cell: (p) => <Link to={`/prospects/${p.id}`}>{p.name}</Link>,
  },
  segment: { key: 'segment', label: 'Segment', cell: (p) => p.segment },
  zone: {
    key: 'zone',
    label: 'Zone',
    cell: (p) => `${p.country} · ${p.city}`,
  },
  size: { key: 'size', label: 'Taille', cell: (p) => p.size },
  score: {
    key: 'score',
    label: 'Score',
    className: 'col-score',
    cell: (p) => (
      <>
        <b>{p.score.total}</b>/100
      </>
    ),
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
}: {
  rows: Prospect[];
  cols: Column[];
  caption: string;
  empty?: ReactNode;
  animateKey?: string; // change quand les filtres changent, pour un fondu court
}) {
  const navigate = useNavigate();

  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr">{caption}</caption>
        <thead>
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
