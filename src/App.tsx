import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { SignIn, SignUp, useAuth } from '@clerk/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Overview } from '@/pages/Overview';
import { Accounts } from '@/pages/Accounts';
import { Payoff } from '@/pages/Payoff';
import { ToastHost } from '@/components/ui/ds';
import { useAccountStore } from '@/store/useAccountStore';

function DemoShell() {
  const initDemo = useAccountStore((s) => s.initDemo);
  const initialized = useAccountStore((s) => s.initialized);
  const toasts = useAccountStore((s) => s.toasts);
  const dismissToast = useAccountStore((s) => s.dismissToast);

  useEffect(() => { initDemo(); }, [initDemo]);

  if (!initialized) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Demo banner */}
      <div style={{
        background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
        color: '#fff',
        fontSize: 12.5,
        fontWeight: 500,
        textAlign: 'center',
        padding: '7px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexShrink: 0,
        zIndex: 50,
      }}>
        <span>You're viewing a demo — data is not saved</span>
        <Link to="/sign-up" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}>
          Create an account →
        </Link>
      </div>
      <div className="app" style={{ flex: 1, minHeight: 0 }}>
        <Sidebar />
        <main className="main">
          <ScrollToTop />
          <Routes>
            <Route index element={<Overview />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="payoff" element={<Payoff />} />
            <Route path="*" element={<Navigate to="/demo" replace />} />
          </Routes>
        </main>
        <ToastHost toasts={toasts} dismiss={dismissToast} />
      </div>
    </div>
  );
}

function AppShell() {
  const { getToken } = useAuth();
  const toasts = useAccountStore((s) => s.toasts);
  const dismissToast = useAccountStore((s) => s.dismissToast);
  const init = useAccountStore((s) => s.init);
  const initialized = useAccountStore((s) => s.initialized);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = await getToken();
      if (token && !cancelled) init(token);
    }
    load();
    return () => { cancelled = true; };
  }, [getToken, init]);

  if (!initialized) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <ScrollToTop />
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

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', gap: 24,
    }}>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Accountable</div>
      {mode === 'sign-in'
        ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
        : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />}
    </div>
  );
}

function AuthGuard() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/demo/*" element={<DemoShell />} />
      <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />
      {isSignedIn
        ? <Route path="/*" element={<AppShell />} />
        : <Route path="*" element={<Navigate to="/sign-in" replace />} />}
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthGuard />
    </BrowserRouter>
  );
}

export default App;
