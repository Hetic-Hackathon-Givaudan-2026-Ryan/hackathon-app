import { Link, useSearchParams } from 'react-router';
import type { SignalKind } from '../types';
import { daysAgo, getProspects } from '../data/api';
import { longDate, plural } from '../lib/format';
import { useData } from '../lib/useData';
import { Loading } from '../components/ui';

// Tous les signaux du portefeuille, du plus récent au plus ancien
export default function Signals() {
  const { data: prospects } = useData('prospects', getProspects);
  const [params, setParams] = useSearchParams();
  const kind = params.get('type');

  if (!prospects)
    return (
      <main className="page">
        <Loading />
      </main>
    );

  const all = prospects
    .flatMap((p) => p.signals.map((s) => ({ prospect: p, signal: s })))
    .sort((a, b) => b.signal.date.localeCompare(a.signal.date));
  const kinds = [...new Set(all.map((x) => x.signal.kind))] as SignalKind[];
  const rows = all.filter((x) => !kind || x.signal.kind === kind);

  return (
    <main className="page">
      <h1>Signaux</h1>
      <p className="lede">
        {plural(all.length, 'signal')} détectés sur vos prospects
      </p>

      <div
        className="toolbar__filters"
        role="group"
        aria-label="Type de signal"
      >
        <button
          type="button"
          className={`pill${!kind ? ' is-set' : ''}`}
          aria-pressed={!kind}
          onClick={() => setParams({}, { replace: true })}
        >
          Tous
        </button>
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            className={`pill${kind === k ? ' is-set' : ''}`}
            aria-pressed={kind === k}
            onClick={() =>
              setParams(kind === k ? {} : { type: k }, { replace: true })
            }
          >
            {k}
          </button>
        ))}
      </div>

      <ol className="timeline fade-in" key={kind ?? 'tous'}>
        {rows.map(({ prospect, signal }) => (
          <li key={prospect.id + signal.date}>
            <time dateTime={signal.date}>
              {longDate(signal.date)}
              <small className="muted">il y a {daysAgo(signal.date)} j</small>
            </time>
            <div className="card timeline__card">
              <span className="tag">{signal.kind}</span>
              <h2>
                <Link to={`/prospects/${prospect.id}`}>{prospect.name}</Link>
                <span className="muted"> · {prospect.score.total}/100</span>
              </h2>
              <p>{signal.summary}</p>
              <small className="muted">{signal.source}</small>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
