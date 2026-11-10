import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Prospect } from '../types';
import { getProspects } from '../data/api';
import { isNewSignal, money } from '../lib/format';
import { useData } from '../lib/useData';
import ProspectTable, { companyColumn } from '../components/ProspectTable';
import { Evolution, Loading, ScorePill } from '../components/ui';

type SortKey = 'name' | 'sector' | 'arr' | 'evolution' | 'score';

// Filtres rapides, ouverts depuis les cartes du tableau de bord (?filtre=...)
const presets = {
  signaux: {
    label: 'Nouveaux signaux',
    test: (p: Prospect) => p.signals.some((s) => isNewSignal(s.date)),
  },
  potentiel: { label: 'Potentiel élevé', test: (p: Prospect) => p.score >= 80 },
  actions: { label: 'Actions prioritaires', test: (p: Prospect) => p.priority },
};
type PresetKey = keyof typeof presets;
const isPreset = (v: string | null): v is PresetKey => !!v && v in presets;

export default function Prospects() {
  const { data: prospects } = useData('prospects', getProspects);
  const [params, setParams] = useSearchParams();
  const filtre = params.get('filtre');
  const preset = isPreset(filtre) ? filtre : undefined;

  const [q, setQ] = useState('');
  const [sector, setSector] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({
    key: 'score',
    dir: -1,
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const sectors = useMemo(
    () => [...new Set((prospects ?? []).map((p) => p.sector))].sort(),
    [prospects],
  );

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (prospects ?? [])
      .filter(
        (p) =>
          !query ||
          `${p.name} ${p.sector} ${p.contact.name}`
            .toLowerCase()
            .includes(query),
      )
      .filter((p) => !sector || p.sector === sector)
      .filter((p) => !preset || presets[preset].test(p))
      .sort((a, b) => {
        const va = a[sort.key];
        const vb = b[sort.key];
        const cmp =
          typeof va === 'string'
            ? va.localeCompare(vb as string, 'fr')
            : va - (vb as number);
        return cmp * sort.dir;
      });
  }, [prospects, q, sector, preset, sort]);

  if (!prospects)
    return (
      <main className="page">
        <Loading />
      </main>
    );

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 1 ? -1 : 1 }
        : { key, dir: key === 'name' || key === 'sector' ? 1 : -1 },
    );

  const sortHeader = (key: SortKey, label: string) => {
    const active = sort.key === key;
    return (
      <button
        className={`sort${active ? ' is-active' : ''}`}
        onClick={() => toggleSort(key)}
      >
        {label}
        <i aria-hidden="true">{active ? (sort.dir === 1 ? '↑' : '↓') : '↕'}</i>
      </button>
    );
  };

  const reset = () => {
    setQ('');
    setSector('');
    setParams({});
  };

  return (
    <main className="page">
      <div className="page__head">
        <h1>Les prospects</h1>
        <div className="tools">
          <label className="search">
            <span className="sr">Rechercher</span>
            <input
              id="q"
              type="search"
              placeholder="Entreprise, secteur, contact…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <button
            className={`btn${filtersOpen ? ' is-on' : ''}`}
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            Filtrer
          </button>
        </div>
      </div>

      {(filtersOpen || preset) && (
        <div className="filters">
          <label>
            Secteur
            <select
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <option value="">Tous les secteurs</option>
              {sectors.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <div className="presets" role="group" aria-label="Filtres rapides">
            {(Object.keys(presets) as PresetKey[]).map((k) => (
              <Link
                key={k}
                className={`chip-toggle${preset === k ? ' is-on' : ''}`}
                to={preset === k ? '/prospects' : `/prospects?filtre=${k}`}
              >
                {presets[k].label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="count">
        {rows.length} prospect{rows.length > 1 ? 's' : ''}
        {preset && ` · ${presets[preset].label}`}
      </p>

      <ProspectTable
        rows={rows}
        empty={
          <>
            Aucun prospect ne correspond à ces critères.{' '}
            <button className="link" onClick={reset}>
              Effacer les filtres
            </button>
          </>
        }
        columns={[
          companyColumn(sortHeader('name', 'Entreprise')),
          {
            key: 'sector',
            label: sortHeader('sector', 'Secteur'),
            mobileLabel: 'Secteur',
            cell: (p) => p.sector,
          },
          {
            key: 'arr',
            label: sortHeader('arr', 'ARR estimé'),
            mobileLabel: 'ARR estimé',
            className: 'num',
            cell: (p) => money(p.arr),
          },
          {
            key: 'contact',
            label: 'Contact',
            mobileLabel: 'Contact',
            cell: (p) => (
              <span className="contact">
                <b>{p.contact.name}</b>
                <small>{p.contact.role}</small>
              </span>
            ),
          },
          {
            key: 'evolution',
            label: sortHeader('evolution', 'Évolution'),
            mobileLabel: 'Évolution',
            cell: (p) => <Evolution value={p.evolution} />,
          },
          {
            key: 'score',
            label: sortHeader('score', 'Score'),
            mobileLabel: 'Score',
            cell: (p) => <ScorePill score={p.score} />,
          },
        ]}
      />
    </main>
  );
}
