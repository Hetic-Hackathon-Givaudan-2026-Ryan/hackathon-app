import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import type { Contact, Question } from '../types';
import { getProspect, getProspects, SOURCE } from '../data/api';
import { useData } from '../lib/useData';
import ScorePopover from '../components/ScorePopover';
import {
  LoadError,
  Loading,
  RichText,
  ScoreRing,
  useDismiss,
  useToast,
} from '../components/ui';

const linkLabel = (links: Question['links']) =>
  links === 'contacts'
    ? 'lié aux interlocuteurs'
    : `lié ${links.length > 1 ? 'aux points' : 'au point'} ${links.join(' et ')}`;

// « Contacter … » : petit menu d'actions sur l'interlocuteur recommandé
function ContactMenu({ contact }: { contact: Contact }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const notify = useToast();
  useDismiss(open, () => setOpen(false), [panel, trigger], trigger);

  const copy = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(contact.email);
      notify(`Adresse de ${contact.name} copiée`);
    } catch {
      notify(contact.email);
    }
  };

  return (
    <div className="fmenu">
      <button
        ref={trigger}
        type="button"
        className="btn btn--primary"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
      >
        Contacter {contact.name}
        <span className="pill__caret" aria-hidden="true">
          •
        </span>
      </button>
      <div
        ref={panel}
        className="fmenu__panel fmenu__panel--start"
        data-open={open}
        inert={!open}
      >
        <a className="fmenu__item" href={`mailto:${contact.email}`}>
          Écrire un e-mail
        </a>
        <button type="button" className="fmenu__item" onClick={copy}>
          Copier l’adresse e-mail
        </button>
      </div>
    </div>
  );
}

export default function ProspectDetail() {
  const { id = '' } = useParams();
  const {
    data: p,
    loading,
    error,
  } = useData(`prospect-${id}`, () => getProspect(id));
  const { data: all } = useData('prospects', getProspects);
  const notify = useToast();
  const [linked, setLinked] = useState<Question['links'] | null>(null);
  const [flash, setFlash] = useState(false);
  const recapRef = useRef<HTMLElement>(null);

  if (loading)
    return (
      <main className="page">
        <Loading>
          {SOURCE === 'ia'
            ? 'L’IA prépare la fiche… (jusqu’à 45 s la première fois)'
            : 'Chargement…'}
        </Loading>
      </main>
    );
  if (error)
    return (
      <main className="page">
        <LoadError error={error} />
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

  const contact = p.contacts.find((c) => c.recommended) ?? p.contacts[0];
  const [potential, opportunity, access] = p.score.axes;

  const prepare = () => {
    const el = recapRef.current;
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  };

  const isLinked = (n: number) => Array.isArray(linked) && linked.includes(n);

  return (
    <main className="page">
      <nav className="crumbs" aria-label="Fil d’Ariane">
        <Link to="/prospects">Prospects</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{p.name}</span>
      </nav>

      <section className="hero">
        <div className="hero__logo" aria-hidden="true">
          Logo
        </div>
        <div className="hero__id">
          <h1>{p.name}</h1>
          <p className="hero__meta">
            {/* Les champs absents d'un jeu de données importé sont omis */}
            {[
              p.segment,
              p.activity,
              p.country,
              p.city,
              p.size + (p.revenue ? ` (CA estimé ${p.revenue})` : ''),
              `Portée ${p.reach.toLowerCase()}`,
              p.website,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="hero__why">
            <b>Pourquoi maintenant :</b> {p.why}
          </p>
        </div>
        <div className="hero__score">
          <ScoreRing value={p.score.total} />
          <dl className="hero__axes">
            {[potential, opportunity, access].map((a) => (
              <div key={a.label}>
                <dt>{a.label}</dt>
                <dd>
                  {a.value}/{a.max}
                </dd>
              </div>
            ))}
          </dl>
          <ScorePopover score={p.score} total={all?.length ?? 0} />
        </div>
      </section>

      <div className="actions">
        {contact && <ContactMenu contact={contact} />}
        <button type="button" className="btn" onClick={prepare}>
          Préparer l’appel
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => notify('La planification arrive bientôt')}
        >
          Planifier un échange
        </button>
      </div>

      <div className="detail">
        <div className="detail__main">
          <section
            ref={recapRef}
            tabIndex={-1}
            className={`panel${flash ? ' is-flash' : ''}`}
            aria-labelledby="recap"
          >
            <div className="panel__head">
              <h2 id="recap">À retenir avant votre rendez-vous</h2>
              <span className="tag tag--soft">
                Généré par l’IA · {p.score.sources} sources · à vérifier
              </span>
            </div>
            {p.takeaways.length ? (
              <ol className="takeaways">
                {p.takeaways.map((t, i) => (
                  <li
                    key={t.text}
                    className={isLinked(i + 1) ? 'is-linked' : undefined}
                  >
                    <span className="num" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <p>
                        <RichText text={t.text} />
                      </p>
                      <small className="muted">Source : {t.source}</small>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="muted">
                Pas encore de synthèse pour ce prospect : les sources sont en
                cours d’analyse.
              </p>
            )}
            <p className="panel__foot">
              Une info est fausse ?{' '}
              <button
                type="button"
                className="link"
                onClick={() => notify('Merci, le signalement est envoyé')}
              >
                Signaler
              </button>
            </p>
          </section>

          {p.questions.length > 0 && (
            <section className="panel" aria-labelledby="questions">
              <h2 id="questions">Questions à poser</h2>
              <p className="muted small">
                Pour faire émerger les besoins implicites
              </p>
              <ul className="questions">
                {p.questions.map((q) => (
                  <li
                    key={q.text}
                    tabIndex={0}
                    onMouseEnter={() => setLinked(q.links)}
                    onMouseLeave={() => setLinked(null)}
                    onFocus={() => setLinked(q.links)}
                    onBlur={() => setLinked(null)}
                  >
                    <q>{q.text}</q>
                    <small>{linkLabel(q.links)}</small>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="detail__side">
          <section
            className={`panel${linked === 'contacts' ? ' is-linked' : ''}`}
            aria-labelledby="interlocuteurs"
          >
            <h2 id="interlocuteurs">Interlocuteurs</h2>
            {p.contacts.length ? (
              <ul className="contacts">
                {p.contacts.map((c) => (
                  <li key={c.name}>
                    <span className="avatar" aria-hidden="true"></span>
                    <div>
                      <p className="contacts__name">
                        <b>{c.name}</b>
                        {c.recommended && (
                          <span className="tag tag--dark">Recommandé</span>
                        )}
                      </p>
                      <p>
                        {c.role}
                        {c.since && ` · ${c.since}`}
                      </p>
                      <small className="muted">
                        Rôle dans l’achat : {c.buyingRole}
                      </small>
                      {c.why && (
                        <small className="muted">Pourquoi : {c.why}</small>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">Aucun interlocuteur identifié.</p>
            )}
            <p className="panel__foot">
              Coordonnées professionnelles uniquement · sources publiques
            </p>
          </section>

          <section className="panel" aria-labelledby="historique">
            <h2 id="historique">Historique Givaudan</h2>
            <p>{p.history}</p>
          </section>
        </aside>
      </div>
    </main>
  );
}
