import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Overview } from '@/pages/Overview';
import { Accounts } from '@/pages/Accounts';
import { Payoff } from '@/pages/Payoff';
import { ToastHost, Icon } from '@/components/ui/ds';
import { useAccountStore } from '@/store/useAccountStore';

const NAV = [
  { to: '/', icon: 'home' as const, label: 'Overview', end: true },
  { to: '/accounts', icon: 'card' as const, label: 'Accounts', end: false },
  { to: '/payoff', icon: 'calc' as const, label: 'Payoff', end: false },
];

function AppShell() {
  const toasts = useAccountStore((s) => s.toasts);
  const dismissToast = useAccountStore((s) => s.dismissToast);

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/payoff" element={<Payoff />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile-only bottom tab bar */}
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

      <ToastHost toasts={toasts} dismiss={dismissToast} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
