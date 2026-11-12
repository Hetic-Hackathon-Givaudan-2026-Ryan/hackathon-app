import { Link } from 'react-router';
import { getBriefing } from '../data/api';
import { shortDate } from '../lib/format';
import { useData } from '../lib/useData';
import ProspectTable, { columns } from '../components/ProspectTable';
import { LoadError, Loading } from '../components/ui';

export default function Dashboard() {
  const { data, error } = useData('briefing', getBriefing);
  if (error)
    return (
      <main className="page">
        <LoadError error={error} />
      </main>
    );
  if (!data)
    return (
      <main className="page">
        <Loading />
      </main>
    );

  const { user, signals, priorities } = data;

  return (
    <main className="page">
      <h1>Bonjour {user.firstName}</h1>
      <p className="lede">
        {signals.length} nouveaux signaux ces 3 dernières semaines ·{' '}
        {priorities.length} prospects à prioriser cette semaine
      </p>

      <section className="block" aria-labelledby="signaux">
        <div className="block__head">
          <h2 id="signaux">Nouveaux signaux</h2>
          <Link className="link" to="/signaux">
            Tous les signaux
          </Link>
        </div>
        {signals.length === 0 && (
          <p className="muted">
            Aucun signal daté de moins de 3 semaines dans ce jeu de données.
          </p>
        )}
        <ul className="cards">
          {signals.map(({ prospect, signal }, i) => (
            <li
              key={prospect.id}
              className="card signal-card"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="tag">{signal.kind}</span>
              <h3>{prospect.name}</h3>
              <p>{signal.summary}</p>
              <small className="muted">
                {signal.source} · {shortDate(signal.date)}
              </small>
              <Link
                className="link card__link"
                to={`/prospects/${prospect.id}`}
              >
                Voir la fiche
                <span className="sr"> de {prospect.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="block" aria-labelledby="prioritaires">
        <div className="block__head">
          <h2 id="prioritaires">
            Vos {priorities.length} prospects prioritaires
          </h2>
          <Link className="link" to="/prospects">
            Voir tous les prospects
          </Link>
        </div>
        <ProspectTable
          caption="Prospects prioritaires, triés par score"
          rows={priorities}
          cols={[
            columns.name,
            columns.segment,
            columns.zone,
            columns.size,
            columns.score,
            {
              key: 'why',
              label: 'Pourquoi maintenant',
              className: 'col-why',
              cell: (p) => p.why.charAt(0).toUpperCase() + p.why.slice(1, -1),
            },
          ]}
        />
      </section>
    </main>
  );
}
