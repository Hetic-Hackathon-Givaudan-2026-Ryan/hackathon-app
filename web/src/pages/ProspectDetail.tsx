import { Link, useParams } from 'react-router';
import { getProspect } from '../data/api';
import { formatDate, isNewSignal, money } from '../lib/format';
import { useData } from '../lib/useData';
import {
  CompanyLogo,
  Evolution,
  Loading,
  ScoreRing,
  SignalChip,
} from '../components/ui';

export default function ProspectDetail() {
  const { id = '' } = useParams();
  const { data: p, loading } = useData(`prospect-${id}`, () => getProspect(id));

  if (loading)
    return (
      <main className="page">
        <Loading />
      </main>
    );
  if (!p)
    return (
      <main className="page">
        <p>
          Ce prospect n’existe pas ou plus.{' '}
          <Link className="link" to="/prospects">
            Retour à la liste
          </Link>
        </p>
      </main>
    );

  const max = Math.max(...p.scoreFactors.map((f) => Math.abs(f.weight)));

  return (
    <main className="page">
      <Link className="back" to="/prospects">
        ‹ Les prospects
      </Link>

      <section className="hero">
        <CompanyLogo prospect={p} size="lg" />
        <div className="hero__id">
          <h1>{p.name}</h1>
          <p className="hero__meta">
            {p.sector} · {p.country} · ARR estimé {money(p.arr)}
          </p>
          <a className="link" href={p.website} target="_blank" rel="noopener">
            Consulter le site ↗
          </a>
        </div>
        <div className="hero__score">
          <ScoreRing score={p.score} />
          <span className="hero__evo">
            <Evolution value={p.evolution} /> <small>sur 30 jours</small>
          </span>
        </div>
      </section>

      <div className="detail">
        <div className="detail__main">
          <section className="panel panel--ai">
            <h2>
              <span className="tag">IA</span> Synthèse
            </h2>
            <p>{p.aiOverview}</p>
            <h3>Ce qui fait le score</h3>
            <ul className="factors">
              {p.scoreFactors.map((f) => (
                <li key={f.label}>
                  <span>{f.label}</span>
                  <span
                    className={`factor-bar${f.weight < 0 ? ' is-neg' : ''}`}
                  >
                    <i
                      style={{ width: `${(Math.abs(f.weight) / max) * 100}%` }}
                    ></i>
                  </span>
                  <b className="num">
                    {f.weight > 0 ? '+' : ''}
                    {f.weight}
                  </b>
                </li>
              ))}
            </ul>
            <p className="disclaimer">
              Synthèse générée à partir de sources publiques. À vérifier avant
              tout échange client.
            </p>
          </section>

          <section className="panel">
            <h2>Actualités</h2>
            {p.news.length ? (
              <ol className="news">
                {p.news.map((n) => (
                  <li key={n.date + n.title}>
                    <time dateTime={n.date}>{formatDate(n.date)}</time>
                    <p>{n.title}</p>
                    <small>{n.source}</small>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">
                Aucune actualité récente trouvée pour ce prospect.
              </p>
            )}
          </section>
        </div>

        <aside className="detail__side">
          <section className="panel">
            <h2>Contact</h2>
            <p className="contact contact--lg">
              <b>{p.contact.name}</b>
              <small>{p.contact.role}</small>
            </p>
            <p className="mono">{p.contact.email}</p>
          </section>
          <section className="panel">
            <h2>Signaux</h2>
            {p.signals.length ? (
              <ul className="signals">
                {p.signals.map((s) => (
                  <li key={s.date + s.label}>
                    <span className="sig-head">
                      <SignalChip type={s.type} />
                      {isNewSignal(s.date) && (
                        <span className="new">Nouveau</span>
                      )}
                    </span>
                    <p>{s.label}</p>
                    <time dateTime={s.date}>{formatDate(s.date)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Aucun signal détecté.</p>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
