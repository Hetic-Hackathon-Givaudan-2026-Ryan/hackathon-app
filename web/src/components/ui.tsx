import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import type { ScoreDetail } from '../types';

// Ferme un panneau (popover, menu) sur Échap ou sur un clic en dehors.
// Échap rend le focus au bouton qui l'a ouvert.
export function useDismiss(
  open: boolean,
  close: () => void,
  refs: RefObject<HTMLElement | null>[],
  trigger: RefObject<HTMLElement | null>,
) {
  // Dernières valeurs, lues par les écouteurs sans les rebrancher à chaque rendu
  const latest = useRef({ close, refs, trigger });
  useEffect(() => {
    latest.current = { close, refs, trigger };
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      latest.current.close();
      latest.current.trigger.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      const inside = latest.current.refs.some((r) =>
        r.current?.contains(target),
      );
      if (!inside) latest.current.close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);
}

// Texte avec **gras**, utilisé par la synthèse « À retenir »
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*)/)
        .map((part, i) =>
          part.startsWith('**') ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            part
          ),
        )}
    </>
  );
}

// Anneau du score en trois arcs (Potentiel, Opportunité, Accessibilité), chacun
// de la longueur de ses points sur 100. Il se remplit à l'arrivée sur la fiche.
export function ScoreRing({ score }: { score: ScoreDetail }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const gap = 1.6; // espace entre deux arcs, en points sur 100
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const arcs = score.axes.map((axis, i) => ({
    key: axis.label,
    i,
    // l'arc commence après les points des axes précédents
    start: score.axes.slice(0, i).reduce((sum, a) => sum + a.value, 0),
    len: Math.max(0, axis.value - (axis.value > 0 ? gap : 0)),
  }));

  return (
    <div
      className="ring"
      role="img"
      aria-label={`Score ${score.total} sur 100 : ${score.axes
        .map((a) => `${a.label} ${a.value} sur ${a.max}`)
        .join(', ')}`}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring__track" cx="50" cy="50" r={r} />
        {arcs.map((a) => (
          <circle
            key={a.key}
            className={`ring__arc axis-${a.i}`}
            cx="50"
            cy="50"
            r={r}
            strokeDasharray={`${shown ? (a.len / 100) * c : 0} ${c}`}
            strokeDashoffset={-(a.start / 100) * c}
          />
        ))}
      </svg>
      <span className="ring__label" aria-hidden="true">
        <b>{score.total}</b>
        <small>/100</small>
      </span>
    </div>
  );
}

// Barre tricolore du score, utilisée dans les listes
export function ScoreBars({ score }: { score: ScoreDetail }) {
  return (
    <span className="bars" aria-hidden="true">
      {score.axes.map((a, i) => (
        <i
          key={a.label}
          className={`axis-${i}`}
          style={{ flexBasis: `${a.value}%` }}
        ></i>
      ))}
    </span>
  );
}

// Barre de progression d'un critère du score
export function Meter({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  return (
    <span
      className="meter"
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <i style={{ width: `${(value / max) * 100}%` }}></i>
    </span>
  );
}

// Notifications discrètes en bas de l'écran, lues par les lecteurs d'écran
const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string }>();
  const notify = useCallback(
    (message: string) => setToast({ id: Date.now(), message }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-zone" role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function Loading({
  children = 'Chargement…',
}: {
  children?: ReactNode;
}) {
  return (
    <p className="loading muted" role="status">
      <span className="spinner" aria-hidden="true"></span>
      {children}
    </p>
  );
}

export function LoadError({ error }: { error: Error }) {
  return (
    <p className="muted" role="alert">
      Impossible de charger les données : {error.message}. Le service IA est-il
      lancé sur le port 8000 ?
    </p>
  );
}

// Score d'une ligne de liste : chiffre en police mono, barre tricolore, et
// tendance fléchée (verte si ça monte, rouge si ça baisse). La flèche et le
// signe portent le sens, pas seulement la couleur.
export function ScoreBadge({ score }: { score: ScoreDetail }) {
  const trend = score.trend ?? 0;
  const kind = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
  const label =
    trend > 0
      ? `en hausse de ${trend} points`
      : trend < 0
        ? `en baisse de ${-trend} points`
        : 'stable';
  return (
    <span
      className="score-badge"
      aria-label={`Score ${score.total} sur 100, ${label}`}
    >
      <span className="score-badge__top">
        <b>{score.total}</b>
        <small>/100</small>
        {trend !== 0 && (
          <span className={`trend trend--${kind}`} aria-hidden="true">
            {kind === 'up' ? '▲' : '▼'}
            <i>{Math.abs(trend)}</i>
          </span>
        )}
      </span>
      <ScoreBars score={score} />
    </span>
  );
}

// Pavé à l'initiale de l'entreprise, en attendant les logos
export function CompanyMark({
  name,
  size = 'sm',
}: {
  name: string;
  size?: 'sm' | 'lg';
}) {
  return (
    <span className={`mark mark--${size}`} aria-hidden="true">
      {name.trim()[0]?.toUpperCase()}
    </span>
  );
}
