import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { getCurrentUser } from '../data/api';
import { useData } from '../lib/useData';

const nav = [
  { to: '/', label: 'Tableau de bord' },
  { to: '/prospects', label: 'Prospects' },
];
const soon = ['Alertes', 'Rapports'];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { data: user } = useData('user', getCurrentUser);

  return (
    <>
      <header className={`topbar${open ? ' is-open' : ''}`}>
        <div className="topbar__inner">
          <Link className="brand" to="/">
            Givaudan<span>Prospect</span>
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
          <nav id="mainnav" className="nav">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `nav__item${isActive ? ' is-active' : ''}`
                }
                onClick={() => setOpen(false)}
              >
                {n.label}
              </NavLink>
            ))}
            {soon.map((label) => (
              <span key={label} className="nav__item nav__item--soon">
                {label}
                <em>bientôt</em>
              </span>
            ))}
          </nav>
          {user && (
            <div className="user">
              <span className="user__name">{user.firstName}</span>
              <span className="avatar" aria-hidden="true">
                {user.firstName[0]}
                {user.lastName[0]}
              </span>
            </div>
          )}
        </div>
      </header>
      <Outlet />
    </>
  );
}
