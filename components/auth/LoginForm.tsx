'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Brand } from '../layout/Brand';

type Mode = 'login' | 'register' | 'recovery' | 'resend' | 'verify' | 'reset' | 'invite-accept';
const content: Record<Mode, { title: string; description: string; action: string }> = {
  login: { title: 'Welcome back', description: 'Sign in to stay connected with your church family.', action: 'Sign in' },
  register: { title: 'Join your church family', description: 'Create your account with your phone number and branch details.', action: 'Create account' },
  recovery: { title: 'Forgot your password?', description: 'Enter your phone number to request a password reset link.', action: 'Send reset link' },
  resend: { title: 'Verify your phone number', description: 'Request a new verification link for your account.', action: 'Resend verification' },
  verify: { title: 'Complete your account', description: 'Set your password to finish verifying your phone number.', action: 'Verify account' },
  reset: { title: 'Choose a new password', description: 'Use at least 15 characters to keep your account secure.', action: 'Reset password' },
  'invite-accept': { title: 'Welcome to the team', description: 'Accept your staff invitation using your existing password.', action: 'Accept staff invitation' },
};
export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState('');
  useEffect(() => {
    const values = new URLSearchParams(window.location.hash.slice(1));
    for (const [key, next] of [['verify', 'verify'], ['reset', 'reset'], ['invite', 'invite-accept']] as const) {
      const value = values.get(key);
      if (value) { queueMicrotask(() => { setToken(value); setMode(next); }); break; }
    }
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);
  function switchMode(next: Mode) {
    setMode(next); setMessage(''); setFailed(false); setShowPassword(false);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setMessage(''); setFailed(false);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, token }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Request unavailable.');
      if (mode === 'login') { router.push('/'); router.refresh(); return; }
      setMessage(result.message || 'Completed. You can now sign in.');
      if (['verify', 'reset', 'invite-accept'].includes(mode)) { setMode('login'); setToken(''); setShowPassword(false); }
    } catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : 'Request unavailable.'); }
    finally { setPending(false); }
  }
  const credentials = ['login', 'register', 'recovery', 'resend'].includes(mode);
  const newPassword = ['register', 'reset', 'verify'].includes(mode);
  const copy = content[mode];
  const fieldClass = 'mt-2 block w-full rounded-lg border px-3.5 py-3';
  return <div className="mx-auto grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
    <aside className="hidden lg:block">
      <Brand />
      <div className="mt-14 h-1 w-12 rounded-full bg-[var(--accent)]" />
      <h2 className="mt-7 max-w-sm text-4xl leading-tight">A place to belong.<br />A family to grow with.</h2>
      <p className="mt-5 max-w-sm text-base text-[var(--text-muted)]">Stay connected to the life of Fountain Gate Chapel, Change Pastures.</p>
    </aside>
    <section aria-labelledby="account-heading" className="w-full rounded-2xl border bg-white p-6 shadow-[var(--shadow-card)] sm:p-10">
      <div className="mb-8 lg:hidden"><Brand /></div>
      <h1 id="account-heading" className="text-3xl">{copy.title}</h1>
      <p className="mt-3 text-sm text-[var(--text-muted)]">{copy.description}</p>
      <form key={mode} onSubmit={submit} className="mt-8 space-y-5" aria-busy={pending}>
        <fieldset disabled={pending} className="space-y-5">
          <legend className="sr-only">{copy.title}</legend>
          {credentials && <div><label htmlFor="account-phone">Phone number</label><input id="account-phone" required name="phone" autoComplete="tel" type="tel" maxLength={32} placeholder="+233 24 123 4567" aria-describedby="phone-help" className={fieldClass} /><p id="phone-help" className="mt-1.5 text-sm text-[var(--text-muted)]">Include your country code, for example +233.</p></div>}
          {['login', 'register'].includes(mode) && <div><label htmlFor="account-branch">Branch ID</label><input id="account-branch" required name="branch_id" aria-describedby="branch-help" className={fieldClass} /><p id="branch-help" className="mt-1.5 text-sm text-[var(--text-muted)]">Use the Branch ID provided by your church office.</p></div>}
          {mode === 'register' && <div><label htmlFor="account-name">Full name</label><input id="account-name" required name="full_name" maxLength={160} autoComplete="name" className={fieldClass} /></div>}
          {!['recovery', 'resend'].includes(mode) && <div>
            <label htmlFor="account-password">{mode === 'verify' ? 'Set your password to finish verification' : 'Password'}</label>
            <div className="relative mt-2"><input id="account-password" required name="password" type={showPassword ? 'text' : 'password'} minLength={newPassword ? 15 : undefined} maxLength={128} autoComplete={newPassword ? 'new-password' : 'current-password'} aria-describedby={newPassword ? 'password-help' : undefined} className="block w-full rounded-lg border py-3 pl-3.5 pr-14" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} aria-controls="account-password" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-1 flex w-11 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]">{showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}</button></div>
            {newPassword && <p id="password-help" className="mt-1.5 text-sm text-[var(--text-muted)]">Use at least 15 characters.</p>}
          </div>}
          {['verify', 'reset', 'invite-accept'].includes(mode) && <div><label htmlFor="account-token">Link token</label><input id="account-token" required value={token} onChange={event => setToken(event.target.value)} maxLength={43} className={fieldClass} /></div>}
          <button disabled={pending} className="btn-primary w-full py-3">{pending ? 'Working…' : copy.action}</button>
        </fieldset>
      </form>
      {message && <p role={failed ? 'alert' : 'status'} className={`mt-5 rounded-lg border p-3 text-sm ${failed ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>{message}</p>}
      <nav aria-label="Account help" className="mt-6 text-sm">
        {mode === 'login' ? <>
          <div className="flex flex-wrap justify-between gap-x-4"><button type="button" disabled={pending} onClick={() => switchMode('recovery')} className="text-[var(--accent-hover)] underline">Forgot password?</button><button type="button" disabled={pending} onClick={() => switchMode('resend')} className="text-[var(--accent-hover)] underline">Resend verification</button></div>
          <p className="mt-6 border-t pt-5 text-[var(--text-muted)]">New to the portal? <button type="button" disabled={pending} onClick={() => switchMode('register')} className="text-[var(--accent-hover)] underline">Create account</button></p>
        </> : <button type="button" disabled={pending} onClick={() => switchMode('login')} className="text-[var(--accent-hover)] underline">Back to sign in</button>}
      </nav>
    </section>
  </div>;
}
