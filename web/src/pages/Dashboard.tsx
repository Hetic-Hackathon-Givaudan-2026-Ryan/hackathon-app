import { Link } from 'react-router';
import { getBriefing, TODAY } from '../data/api';
import { useData } from '../lib/useData';
import CopilotBox from '../components/CopilotBox';
import ProspectTable, { columns } from '../components/ProspectTable';
import { LoadError, Loading } from '../components/ui';

const today = new Date(TODAY).toLocaleDateString('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

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

  const { user, priorities } = data;
  const top = priorities[0];

  return (
    <main className="page">
      <p className="eyebrow">{today}</p>
      <h1>Bonjour, {user.firstName}</h1>
      <p className="lede">
        {priorities.length} prospects à prioriser cette semaine.
        {top && ` ${top.name} arrive en tête.`}
      </p>

      <section className="board" aria-labelledby="prioritaires">
        <div className="board__head">
          <h2 id="prioritaires">
            <span className="board__icon" aria-hidden="true">
              ☰
            </span>
            Vos prospects prioritaires
            <span className="count-pill">{priorities.length}</span>
          </h2>
          <Link className="link link--accent" to="/prospects">
            Voir tous les prospects →
          </Link>
        </div>
        <ProspectTable
          caption="Prospects prioritaires, triés par score"
          rows={priorities}
          headless
          cols={[
            columns.name,
            columns.zone,
            columns.size,
            columns.why,
            columns.score,
          ]}
        />
      </section>

      <CopilotBox prospects={priorities} />
    </main>
  );
}
