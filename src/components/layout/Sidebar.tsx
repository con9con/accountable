import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { UserButton, useAuth } from '@clerk/react';
import { Icon } from '@/components/ui/ds';

function useNav() {
  const { pathname } = useLocation();
  const demo = pathname.startsWith('/demo');
  const base = demo ? '/demo' : '';
  return [
    { to: `${base}/`, icon: 'home' as const, label: 'Overview', end: true },
    { to: `${base}/accounts`, icon: 'card' as const, label: 'Accounts', end: false },
    { to: `${base}/payoff`, icon: 'calc' as const, label: 'Payoff Plan', end: false },
  ];
}

const USER_BUTTON_APPEARANCE = {
  elements: {
    avatarBox: { width: '2.5rem', height: '2.5rem', border: '3px solid #fff', borderRadius: '50%' },
  },
};

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const NAV = useNav();
  const { isSignedIn } = useAuth();

  // Close drawer on navigation
  const close = () => setOpen(false);

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/" className="brand" style={{ textDecoration: 'none', color: '#F0F0FA' }}>Accountable</Link>

          <nav className="sidebar-nav">
            {NAV.map(({ to, icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <Icon name={icon} size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {isSignedIn && (
          <div className="sidebar-bottom">
            <UserButton appearance={USER_BUTTON_APPEARANCE} />
          </div>
        )}

        {/* Mobile: kebab menu on right of top bar */}
        <button className="hamburger" onClick={() => setOpen(true)} aria-label="Open menu">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="rgba(255,255,255,0.85)">
            <circle cx="9" cy="3.5" r="1.6" />
            <circle cx="9" cy="9" r="1.6" />
            <circle cx="9" cy="14.5" r="1.6" />
          </svg>
        </button>
      </aside>

      {/* Drawer overlay */}
      {open && (
        <div className="drawer-backdrop" onClick={close} />
      )}

      {/* Drawer panel */}
      <div className={`drawer${open ? ' drawer-open' : ''}`}>
        <div className="drawer-head">
          <Link to="/" className="drawer-brand" onClick={close} style={{ textDecoration: 'none', color: '#F0F0FA' }}>Accountable</Link>
          <button className="drawer-close" onClick={close} aria-label="Close menu">
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="drawer-nav">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={close}
              className={({ isActive }) => `drawer-link${isActive ? ' drawer-link-active' : ''}`}
            >
              <Icon name={icon} size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {isSignedIn && (
          <div className="drawer-foot">
            <UserButton appearance={USER_BUTTON_APPEARANCE} />
          </div>
        )}
      </div>
    </>
  );
}

