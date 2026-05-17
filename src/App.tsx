import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Overview } from '@/pages/Overview';
import { Accounts } from '@/pages/Accounts';
import { Payoff } from '@/pages/Payoff';
import { ToastHost } from '@/components/ui/ds';
import { useAccountStore } from '@/store/useAccountStore';

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
