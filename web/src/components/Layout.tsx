import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { getCurrentUser } from '../data/api';
import { useData } from '../lib/useData';
import { ToastProvider } from './ui';

const nav = [
  { to: '/', label: 'Tableau de bord' },
  { to: '/prospects', label: 'Prospects' },
  { to: '/signaux', label: 'Signaux' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { data: user } = useData('user', getCurrentUser);
  const { pathname } = useLocation();

  // Chaque page s'ouvre en haut, comme une navigation classique
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <ToastProvider>
      <a className="skip" href="#contenu">
        Aller au contenu
      </a>
      <header className={`topbar${open ? ' is-open' : ''}`}>
        <div className="topbar__inner">
          <Link className="brand" to="/">
            <b>Givaudan</b> · Copilote commercial
          </Link>
          <button
            className="menu-btn"
            aria-expanded={open}
            aria-controls="mainnav"
            aria-label="Menu"
            onClick={() => setOpen(!open)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <nav id="mainnav" className="nav" aria-label="Navigation principale">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className="nav__item"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          {user && (
            <div className="user">
              <span className="user__name">{user.firstName}</span>
              <span className="avatar" aria-hidden="true"></span>
            </div>
          )}
        </div>
      </header>
      <div id="contenu" className="route" key={pathname}>
        <Outlet />
      </div>
      <footer className="foot">
        Wireframe v2 · données fictives pour la démo · G01 Arom’hetic
      </footer>
    </ToastProvider>
  );
}
