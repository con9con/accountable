import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/react';
import { Icon } from '@/components/ui/ds';

const NAV = [
  { to: '/', icon: 'home' as const, label: 'Overview', end: true },
  { to: '/accounts', icon: 'card' as const, label: 'Accounts', end: false },
  { to: '/payoff', icon: 'calc' as const, label: 'Payoff Plan', end: false },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">Accountable</div>

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

      <div className="sidebar-bottom">
        <UserButton />
      </div>
    </aside>
  );
}
