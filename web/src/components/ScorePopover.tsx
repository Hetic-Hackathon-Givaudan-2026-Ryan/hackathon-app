import { useEffect, useId, useRef, useState } from 'react';
import type { ScoreDetail } from '../types';
import { Meter, useDismiss, useToast } from './ui';

// Bouton « Détail du score » et son panneau.
// Échap, un clic en dehors ou × ferment le panneau ; le focus revient au bouton.
export default function ScorePopover({
  score,
  total,
}: {
  score: ScoreDetail;
  total: number; // nombre de prospects du portefeuille
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const notify = useToast();
  const titleId = useId();
  const panelId = useId();
  useDismiss(open, () => setOpen(false), [panel, trigger], trigger);

  // À l'ouverture, le focus va dans le panneau (après la transition d'entrée)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeBtn.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div className="score-pop">
      <button
        ref={trigger}
        type="button"
        className="score-pop__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        Détail du score
        <span className="pill__caret" aria-hidden="true">
          •
        </span>
      </button>

      <div
        ref={panel}
        id={panelId}
        className="popover"
        role="dialog"
        aria-labelledby={titleId}
        data-open={open}
        inert={!open}
      >
        <div className="popover__head">
          <div>
            <h2 id={titleId}>Détail du score</h2>
            <p className="muted">
              {score.total}/100 · {score.rank === 1 ? '1er' : `${score.rank}e`}{' '}
              sur {total} dans votre portefeuille · Fiabilité :{' '}
              {score.reliability} ({score.sources} sources)
            </p>
          </div>
          <button
            ref={closeBtn}
            type="button"
            className="icon-btn"
            aria-label="Fermer le détail du score"
            onClick={close}
          >
            ×
          </button>
        </div>

        {score.axes.map((axis, i) => (
          <section key={axis.label} className={`axis axis--${i}`}>
            <h3>
              <span className={`dot axis-${i}`} aria-hidden="true"></span>
              {axis.label}
              <span className="axis__total">
                {axis.value}/{axis.max}
              </span>
            </h3>
            <ul>
              {axis.items.map((it) => (
                <li key={it.label} className="axis__row">
                  <span>{it.label}</span>
                  <Meter
                    value={open ? it.value : 0}
                    max={it.max}
                    label={it.label}
                  />
                  <b>
                    {it.value}/{it.max}
                  </b>
                </li>
              ))}
            </ul>
            {axis.notes && axis.notes.length > 0 && (
              <ul className="axis__notes">
                {axis.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <button
          type="button"
          className="link link--accent"
          onClick={() => notify('La page de méthode arrive bientôt')}
        >
          Comment ce score est-il calculé ? →
        </button>
      </div>
    </div>
  );
}
