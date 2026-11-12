import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { getCurrentUser } from '../data/api';
import { useData } from '../lib/useData';
import { ToastProvider } from './ui';

// Icônes au trait, 16 px, dans la couleur du texte
const icon = {
  home: 'M3 10.5 10 4l7 6.5V17a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1z',
  users:
    'M7.5 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 17c0-3 2.5-5 5.5-5S13 14 13 17M13 3.3a3 3 0 0 1 0 5.4M15 12.3c1.8.6 3 2.3 3 4.7',
  calendar:
    'M4 5h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 9h14M7 3v4M13 3v4',
};
const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const nav = [
  { to: '/', label: 'Accueil', d: icon.home },
  { to: '/prospects', label: 'Prospects', d: icon.users },
  { to: '/rendez-vous', label: 'Rendez-vous', d: icon.calendar },
];

// Listes enregistrées : des filtres de la base des prospects
const lists = [
  { label: 'Prospects chauds', to: '/prospects?score=80', tone: 'hot' },
  {
    label: 'Fragrance & Beauty',
    to: `/prospects?segment=${encodeURIComponent('Fragrance & Beauty')}`,
    tone: 'fb',
  },
  {
    label: 'Taste & Wellbeing',
    to: `/prospects?segment=${encodeURIComponent('Taste & Wellbeing')}`,
    tone: 'tw',
  },
];

const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const search = useRef<HTMLInputElement>(null);
  const { data: user } = useData('user', getCurrentUser);
  const { pathname, search: query } = useLocation();
  const navigate = useNavigate();

  // Chaque page s'ouvre en haut
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // ⌘K ou Ctrl+K : aller à la recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
        search.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/prospects?q=${encodeURIComponent(term)}` : '/prospects');
    setQ('');
    setOpen(false);
    search.current?.blur();
  };

  const initials = user
    ? user.firstName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '';

  return (
    <ToastProvider>
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
      <div className={`shell${open ? ' is-open' : ''}`}>
        <header className="mobilebar">
          <Link className="brand" to="/">
            Givaudan <span className="badge">Copilote</span>
          </Link>
          <button
            className="menu-btn"
            aria-expanded={open}
            aria-controls="sidebar"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>

        <aside
          id="sidebar"
          className="sidebar"
          onClick={(e) => {
            // Sur mobile, choisir une page referme le menu
            if ((e.target as HTMLElement).closest('a')) setOpen(false);
          }}
        >
          <Link className="brand sidebar__brand" to="/">
            Givaudan <span className="badge">Copilote</span>
          </Link>

          <form className="sidesearch" role="search" onSubmit={submit}>
            <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
              <circle
                cx="9"
                cy="9"
                r="5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="m13 13 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <label className="sr" htmlFor="sidesearch">
              Rechercher un prospect
            </label>
            <input
              ref={search}
              id="sidesearch"
              type="search"
              placeholder="Rechercher"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <kbd aria-hidden="true">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
          </form>

          <nav className="sidenav" aria-label="Navigation principale">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className="sidenav__item"
              >
                <Icon d={n.d} />
                {n.label}
              </NavLink>
            ))}
          </nav>

          <p className="sidebar__title" id="mes-listes">
            Mes listes
          </p>
          <ul className="sidelists" aria-labelledby="mes-listes">
            {lists.map((l) => {
              const active =
                pathname === '/prospects' && `/prospects${query}` === l.to;
              return (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className={`sidelists__item${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span
                      className={`dot dot--${l.tone}`}
                      aria-hidden="true"
                    ></span>
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {user && (
            <div className="usercard">
              <span className="usercard__avatar" aria-hidden="true">
                {initials}
              </span>
              <span>
                <b>{user.firstName}</b>
                <small>{user.role ?? 'Commerciale'}</small>
              </span>
            </div>
          )}
        </aside>

        <div className="main">
          <div id="contenu" className="route" key={pathname}>
            <Outlet />
          </div>
          <footer className="foot">
            Prototype · données fictives pour la démo · scores calculés par
            règles · G01 Arom’hetic
          </footer>
        </div>
        <button
          className="scrim"
          aria-label="Fermer le menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        ></button>
      </div>
    </ToastProvider>
  );
}
