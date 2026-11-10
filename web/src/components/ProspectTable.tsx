import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Prospect } from '../types';
import { CompanyLogo } from './ui';

export interface Column {
  key: string;
  label: ReactNode;
  cell: (p: Prospect) => ReactNode;
  className?: string;
  // Libellé affiché devant la valeur quand le tableau devient une carte sur mobile
  mobileLabel?: string;
}

// Colonne « Entreprise », commune à tous les tableaux de prospects
export const companyColumn = (label: ReactNode = 'Entreprise'): Column => ({
  key: 'name',
  label,
  mobileLabel: 'Entreprise',
  cell: (p) => (
    <span className="company">
      <CompanyLogo prospect={p} />
      <Link to={`/prospects/${p.id}`}>{p.name}</Link>
    </span>
  ),
});

export default function ProspectTable({
  rows,
  columns,
  empty,
}: {
  rows: Prospect[];
  columns: Column[];
  empty?: ReactNode;
}) {
  const navigate = useNavigate();
  const open = (p: Prospect) => navigate(`/prospects/${p.id}`);

  return (
    <div className="table-wrap">
      <table className="table table--cards">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="empty">
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr
                key={p.id}
                tabIndex={0}
                data-href
                onClick={(e) => {
                  if (!(e.target as HTMLElement).closest('a, button')) open(p);
                }}
                onKeyDown={(e) => e.key === 'Enter' && open(p)}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    data-label={c.mobileLabel}
                    className={c.className}
                  >
                    {c.cell(p)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
