import { useId, useRef, useState } from 'react';
import { useDismiss } from './ui';

export interface Option {
  value: string;
  label: string;
}

// Pastille de filtre qui ouvre une petite liste de choix.
// `multiple` : cases à cocher ; sinon : choix unique qui ferme la liste.
export default function FilterMenu({
  label,
  summary,
  options,
  selected,
  onChange,
  multiple = false,
  align = 'start',
  variant = 'pill',
}: {
  label: string;
  summary?: string; // texte affiché quand un choix est fait
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  multiple?: boolean;
  align?: 'start' | 'end';
  variant?: 'pill' | 'text';
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useDismiss(open, () => setOpen(false), [panel, trigger], trigger);

  const active = selected.length > 0;

  const toggle = (value: string) => {
    if (!multiple) {
      onChange(selected[0] === value ? [] : [value]);
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value],
    );
  };

  return (
    <div className="fmenu">
      <button
        ref={trigger}
        type="button"
        className={
          variant === 'pill'
            ? `pill${active ? ' is-set' : ''}${open ? ' is-open' : ''}`
            : 'sort-btn'
        }
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        {active && summary ? summary : label}
        <span className="pill__caret" aria-hidden="true">
          {variant === 'pill' ? '•' : ''}
        </span>
      </button>
      <div
        ref={panel}
        id={id}
        className={`fmenu__panel fmenu__panel--${align}`}
        data-open={open}
        inert={!open}
        role="group"
        aria-label={label}
      >
        {options.map((o) => {
          const checked = selected.includes(o.value);
          return (
            <label key={o.value} className="fmenu__opt">
              <input
                type={multiple ? 'checkbox' : 'radio'}
                name={id}
                checked={checked}
                onChange={() => toggle(o.value)}
                onClick={() => {
                  // un clic sur le choix déjà fait le retire (choix unique)
                  if (!multiple && checked) toggle(o.value);
                }}
              />
              <span>{o.label}</span>
            </label>
          );
        })}
        {multiple && active && (
          <button
            type="button"
            className="link fmenu__clear"
            onClick={() => onChange([])}
          >
            Tout effacer
          </button>
        )}
      </div>
    </div>
  );
}
