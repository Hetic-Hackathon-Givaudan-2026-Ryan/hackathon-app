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

// Anneau du score, qui se remplit à l'arrivée sur la fiche
export function ScoreRing({ value }: { value: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div className="ring" role="img" aria-label={`Score ${value} sur 100`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring__track" cx="50" cy="50" r={r} />
        <circle
          className="ring__value"
          cx="50"
          cy="50"
          r={r}
          strokeDasharray={`${(shown / 100) * c} ${c}`}
        />
      </svg>
      <span className="ring__label" aria-hidden="true">
        <b>{value}</b>
        <small>/100</small>
      </span>
    </div>
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

// Score mis en avant : valeur en gras et tendance fléchée (verte si ça monte,
// rouge si ça baisse). La flèche et le signe portent le sens, pas seulement la couleur.
export function ScoreBadge({
  total,
  trend = 0,
  size = 'md',
}: {
  total: number;
  trend?: number;
  size?: 'md' | 'lg';
}) {
  const kind = trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat';
  const label =
    trend > 0
      ? `en hausse de ${trend} points`
      : trend < 0
        ? `en baisse de ${-trend} points`
        : 'stable';
  return (
    <span
      className={`score-badge score-badge--${size}`}
      aria-label={`Score ${total} sur 100, ${label}`}
    >
      <b>{total}</b>
      <small>/100</small>
      <span className={`trend trend--${kind}`} aria-hidden="true">
        {kind === 'up' ? '▲' : kind === 'down' ? '▼' : '–'}
        {trend !== 0 && <i>{Math.abs(trend)}</i>}
      </span>
    </span>
  );
}
