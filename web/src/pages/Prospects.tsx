import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { Prospect } from '../types';
import { daysAgo, getProspects, isRecent } from '../data/api';
import { plural, signalDate } from '../lib/format';
import { useData } from '../lib/useData';
import DatasetBar from '../components/DatasetBar';
import FilterMenu from '../components/FilterMenu';
import ProspectTable, { columns } from '../components/ProspectTable';
import { LoadError, Loading } from '../components/ui';

const PAGE = 8;

const sorts = {
  score: {
    label: 'Score',
    fn: (a: Prospect, b: Prospect) => b.score.total - a.score.total,
  },
  nom: {
    label: 'Nom',
    fn: (a: Prospect, b: Prospect) => a.name.localeCompare(b.name, 'fr'),
  },
  signal: {
    label: 'Dernier signal',
    fn: (a: Prospect, b: Prospect) =>
      (b.signals[0]?.date ?? '').localeCompare(a.signals[0]?.date ?? ''),
  },
};
type SortKey = keyof typeof sorts;

// Les filtres vivent dans l'adresse : on peut partager ou recharger une vue.
export default function Prospects() {
  const { data: prospects, error } = useData('prospects', getProspects);
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const segments = params.getAll('segment');
  const countries = params.getAll('pays');
  const minScore = Number(params.get('score') ?? 0);
  const recent = params.get('recent') === '1';
  const sortParam = params.get('tri');
  const sort: SortKey =
    sortParam && sortParam in sorts ? (sortParam as SortKey) : 'score';
  const page = Math.max(1, Number(params.get('page') ?? 1));

  const update = (changes: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      next.delete(k);
      for (const x of v === null ? [] : Array.isArray(v) ? v : [v])
        if (x) next.append(k, x);
    }
    if (!('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };

  const all = useMemo(() => prospects ?? [], [prospects]);
  const options = useMemo(
    () => ({
      segments: [...new Set(all.map((p) => p.segment))].sort(),
      countries: [...new Set(all.map((p) => p.country))].sort((a, b) =>
        a.localeCompare(b, 'fr'),
      ),
    }),
    [all],
  );

  // Filtrer une liste de cette taille à chaque rendu ne coûte rien
  const key = params.toString();
  const query = q.trim().toLowerCase();
  const rows = all
    .filter(
      (p) =>
        !query ||
        `${p.name} ${p.segment} ${p.activity} ${p.country} ${p.city}`
          .toLowerCase()
          .includes(query),
    )
    .filter((p) => !segments.length || segments.includes(p.segment))
    .filter((p) => !countries.length || countries.includes(p.country))
    .filter((p) => p.score.total >= minScore)
    .filter((p) => !recent || (p.signals[0] && isRecent(p.signals[0].date)))
    .sort(sorts[sort].fn);

  if (error)
    return (
      <main className="page">
        <DatasetBar />
        <LoadError error={error} />
      </main>
    );
  if (!prospects)
    return (
      <main className="page">
        <Loading />
      </main>
    );

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PAGE, current * PAGE);
  const filtered =
    q || segments.length || countries.length || minScore || recent;
  const clear = () => setParams({}, { replace: true });

  return (
    <main className="page">
      <DatasetBar />
      <h1>Prospects</h1>
      <p className="lede">
        {plural(all.length, 'prospect')} suivis · triés par{' '}
        {sorts[sort].label.toLowerCase()}
      </p>

      <div className="toolbar" role="search">
        <label className="search">
          <span className="sr">Rechercher une entreprise ou un secteur</span>
          <input
            type="search"
            placeholder="Rechercher une entreprise, un secteur…"
            value={q}
            onChange={(e) => update({ q: e.target.value })}
          />
        </label>
        <div className="toolbar__filters">
          <FilterMenu
            label="Segment"
            summary={
              segments.length === 1
                ? segments[0]
                : `Segment · ${segments.length}`
            }
            multiple
            options={options.segments.map((s) => ({ value: s, label: s }))}
            selected={segments}
            onChange={(v) => update({ segment: v })}
          />
          <FilterMenu
            label="Pays"
            summary={
              countries.length === 1
                ? countries[0]
                : `Pays · ${countries.length}`
            }
            multiple
            options={options.countries.map((c) => ({ value: c, label: c }))}
            selected={countries}
            onChange={(v) => update({ pays: v })}
          />
          <FilterMenu
            label="Score"
            summary={`Score ≥ ${minScore}`}
            options={[60, 70, 80, 90].map((n) => ({
              value: String(n),
              label: `${n} et plus`,
            }))}
            selected={minScore ? [String(minScore)] : []}
            onChange={(v) => update({ score: v })}
          />
          <button
            type="button"
            className={`pill${recent ? ' is-set' : ''}`}
            aria-pressed={recent}
            onClick={() => update({ recent: recent ? null : '1' })}
          >
            Signal récent
          </button>
          {filtered ? (
            <button type="button" className="link reset" onClick={clear}>
              Effacer
            </button>
          ) : null}
        </div>
        <div className="toolbar__sort">
          <span className="muted">Trier par :</span>
          <FilterMenu
            variant="text"
            align="end"
            label={`${sorts[sort].label} ↓`}
            options={(Object.keys(sorts) as SortKey[]).map((k) => ({
              value: k,
              label: sorts[k].label,
            }))}
            selected={[sort]}
            onChange={(v) =>
              update({ tri: v[0] && v[0] !== 'score' ? v[0] : null })
            }
          />
        </div>
      </div>

      <p className="sr" aria-live="polite">
        {plural(rows.length, 'résultat')}
      </p>

      <ProspectTable
        caption="Base des prospects"
        animateKey={key}
        rows={visible}
        empty={
          <>
            Aucun prospect ne correspond à ces critères.{' '}
            <button type="button" className="link" onClick={clear}>
              Effacer les filtres
            </button>
          </>
        }
        cols={[
          columns.name,
          columns.segment,
          columns.zone,
          columns.size,
          { key: 'reach', label: 'Portée', cell: (p) => p.reach },
          columns.score,
          {
            key: 'signal',
            label: 'Dernier signal',
            cell: (p) => {
              const s = p.signals[0];
              return s ? (
                <>
                  {s.kind} · {signalDate(s.date, daysAgo(s.date))}
                </>
              ) : (
                <span className="muted">—</span>
              );
            },
          },
        ]}
      />

      {rows.length > 0 && (
        <nav className="pager" aria-label="Pagination">
          <span>
            {(current - 1) * PAGE + 1}–{Math.min(current * PAGE, rows.length)}{' '}
            sur {rows.length}
          </span>
          {current > 1 && (
            <button
              type="button"
              className="link"
              onClick={() => update({ page: String(current - 1) })}
            >
              ‹ Page précédente
            </button>
          )}
          {current < pages && (
            <button
              type="button"
              className="link"
              onClick={() => update({ page: String(current + 1) })}
            >
              Page suivante ›
            </button>
          )}
        </nav>
      )}
    </main>
  );
}
