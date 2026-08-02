import { useState } from 'react';
import { Leaf, LogIn, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../stores/useUserStore';

export default function Login() {
  const login = useAuthStore((s) => s.login);
  const storeName = useSettingsStore((s) => s.settings.storeName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    const ok = login(email, password);
    if (!ok) setError('Incorrect email or password, or the account is inactive.');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 dark:bg-slate2-900">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-market-500 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="font-display text-lg font-semibold text-ink dark:text-slate2-50">{storeName}</h1>
          <p className="text-sm text-slate2-400">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-slate2-100 bg-white p-6 shadow-card dark:border-slate2-700 dark:bg-slate2-800">
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" error={error} />
          <Button type="submit" className="mt-2 w-full" size="lg">
            <LogIn className="h-4 w-4" /> Sign In
          </Button>
        </form>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-slate2-100 bg-slate2-50 p-3 text-xs text-slate2-500 dark:border-slate2-700 dark:bg-slate2-900 dark:text-slate2-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            First time here? Default admin login is <span className="font-mono">{DEFAULT_ADMIN_EMAIL}</span> / <span className="font-mono">{DEFAULT_ADMIN_PASSWORD}</span>. Change it from
            Users once you're in — accounts and passwords are stored only in this browser, not on a server.
          </p>
        </div>
      </div>
    </div>
  );
}
