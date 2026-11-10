import { Link } from 'react-router';
import { getCurrentUser, getProspects } from '../data/api';
import { isNewSignal, money, moneyShort } from '../lib/format';
import { useData } from '../lib/useData';
import ProspectTable, { companyColumn } from '../components/ProspectTable';
import { Evolution, Loading, ScorePill, SignalChip } from '../components/ui';

export default function Dashboard() {
  const { data: user } = useData('user', getCurrentUser);
  const { data: prospects } = useData('prospects', getProspects);
  if (!user || !prospects)
    return (
      <main className="page">
        <Loading />
      </main>
    );

  const newSignals = prospects.flatMap((p) =>
    p.signals.filter((s) => isNewSignal(s.date)),
  );
  const priority = prospects.filter((p) => p.priority);
  const kpis = [
    {
      label: 'Prospects suivis',
      value: prospects.length,
      hint: 'dans votre portefeuille',
      to: '/prospects',
    },
    {
      label: 'Nouveaux signaux',
      value: newSignals.length,
      hint: 'ces 7 derniers jours',
      to: '/prospects?filtre=signaux',
    },
    {
      label: 'Potentiel élevé',
      value: prospects.filter((p) => p.score >= 80).length,
      hint: 'score de 80 ou plus',
      to: '/prospects?filtre=potentiel',
    },
    {
      label: 'Actions prioritaires',
      value: priority.length,
      hint: 'à traiter cette semaine',
      to: '/prospects?filtre=actions',
      alert: true,
    },
  ];

  const pct = Math.round((user.revenue / user.target) * 100);

  // Opportunités : un signal récent ou une forte hausse du score, triés par score
  const opportunities = prospects
    .filter(
      (p) => p.signals.some((s) => isNewSignal(s.date)) || p.evolution >= 5,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <main className="page">
      <h1 className="hello">Bonjour {user.firstName},</h1>
      <p className="lede">
        {priority.length} prospects attendent une action de votre part cette
        semaine.
      </p>

      <section className="kpis" aria-label="Indicateurs">
        {kpis.map((k) => (
          <Link
            key={k.label}
            className={`kpi${k.alert ? ' kpi--alert' : ''}`}
            to={k.to}
          >
            <span className="kpi__label">{k.label}</span>
            <span className="kpi__value">{k.value}</span>
            <span className="kpi__hint">{k.hint}</span>
            <span className="kpi__arrow" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </section>

      <section className="revenue" aria-label="Chiffre d'affaires">
        <div className="revenue__figures">
          <div>
            <span className="eyebrow">
              CA réalisé {new Date().getFullYear()}
            </span>
            <strong className="big">{moneyShort(user.revenue)}</strong>
          </div>
          <div className="revenue__target">
            <span className="eyebrow">Objectif</span>
            <strong className="big big--muted">
              {moneyShort(user.target)}
            </strong>
          </div>
        </div>
        <div
          className="bar"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avancement de l'objectif"
        >
          <span style={{ width: `${Math.min(pct, 100)}%` }}></span>
        </div>
        <p className="revenue__note">
          <b>{pct} %</b> de l’objectif atteint · il reste{' '}
          {money(Math.max(user.target - user.revenue, 0))} à signer d’ici le 31
          décembre
        </p>
      </section>

      <section className="block">
        <div className="block__head">
          <h2>Ne manquez pas ces opportunités</h2>
          <Link className="link" to="/prospects">
            Voir tout
          </Link>
        </div>
        <ProspectTable
          rows={opportunities}
          columns={[
            companyColumn(),
            {
              key: 'sector',
              label: 'Secteur',
              mobileLabel: 'Secteur',
              cell: (p) => p.sector,
            },
            {
              key: 'score',
              label: 'Score',
              mobileLabel: 'Score',
              cell: (p) => <ScorePill score={p.score} />,
            },
            {
              key: 'evolution',
              label: 'Évolution',
              mobileLabel: 'Évolution',
              cell: (p) => <Evolution value={p.evolution} />,
            },
            {
              key: 'signal',
              label: 'Signal',
              mobileLabel: 'Signal',
              cell: (p) =>
                p.signals[0] ? (
                  <>
                    <SignalChip type={p.signals[0].type} />
                    <span className="signal-txt">{p.signals[0].label}</span>
                  </>
                ) : (
                  <span className="muted">Aucun</span>
                ),
            },
          ]}
        />
      </section>
    </main>
  );
}
