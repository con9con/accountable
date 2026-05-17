import { NavLink } from 'react-router-dom';
import { Icon } from '@/components/ui/ds';
import { useAccountStore } from '@/store/useAccountStore';

const NAV = [
  { to: '/', icon: 'home' as const, label: 'Overview', end: true },
  { to: '/accounts', icon: 'card' as const, label: 'Accounts', end: false },
  { to: '/payoff', icon: 'calc' as const, label: 'Payoff Plan', end: false },
];

export function Sidebar() {
  const loadDemo = useAccountStore((s) => s.loadDemo);
  const clearAll = useAccountStore((s) => s.clearAll);
  const accounts = useAccountStore((s) => s.accounts);

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

        {/* Mobile bottom tab bar uses same links */}
        <nav className="tab-bar">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `tab-item${isActive ? ' active' : ''}`}
            >
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-foot">
        {accounts.length === 0 ? (
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={loadDemo}>
            Load Demo Data
          </button>
        ) : (
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--danger)' }} onClick={clearAll}>
            Clear All Data
          </button>
        )}
      </div>
    </aside>
  );
}
