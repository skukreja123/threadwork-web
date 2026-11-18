import { createContext, useContext, useState } from 'react';
import { api, getUser } from './api';
const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser),
    [open, setOpen] = useState(false);
  const logout = () => {
    api.logout();
    setUser(null);
  };
  return (
    <Ctx.Provider value={{ user, setUser, logout, openLogin: () => setOpen(true) }}>
      {children}
      {open && (
        <AuthModal
          close={() => setOpen(false)}
          done={(u) => {
            setUser(u);
            setOpen(false);
          }}
        />
      )}
    </Ctx.Provider>
  );
}

/** One form used by the full page and by the popup. */
export function AuthForm({ mode, onModeChange, onDone }) {
  const [f, setF] = useState({ name: '', email: '', password: '' }),
    [show, setShow] = useState(false),
    [err, setErr] = useState(''),
    [busy, setBusy] = useState(false);
  const signup = mode === 'signup';
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setErr('');
  };
  const checks = [
    ['8 or more characters', f.password.length >= 8],
    ['A number', /\d/.test(f.password)],
    ['Upper and lower case letters', /[a-z]/.test(f.password) && /[A-Z]/.test(f.password)],
  ];
  const score = checks.filter((c) => c[1]).length;
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (signup && !f.name.trim()) return setErr('Please enter your name.');
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr('Enter a valid email address.');
    if (signup && f.password.length < 8)
      return setErr('Your password must be at least 8 characters.');
    if (!signup && !f.password) return setErr('Enter your password.');
    setBusy(true);
    try {
      const r = signup
        ? await api.signup(f.name, f.email, f.password)
        : await api.login(f.email, f.password);
      onDone(r.user);
    } catch (x) {
      setErr(
        x.message === 'Failed to fetch'
          ? 'Cannot reach the server. Is the backend running?'
          : x.message
      );
    }
    setBusy(false);
  };
  return (
    <form className="authform" onSubmit={submit} noValidate>
      <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>
      <p className="sub">
        {signup
          ? 'Save your designs and place orders in a few clicks.'
          : 'Log in to continue your order.'}
      </p>
      {signup && (
        <div className="field">
          <label htmlFor="an">Full name</label>
          <input id="an" autoComplete="name" value={f.name} onChange={set('name')} />
        </div>
      )}
      <div className="field">
        <label htmlFor="ae">Email</label>
        <input
          id="ae"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={f.email}
          onChange={set('email')}
        />
      </div>
      <div className="field">
        <label htmlFor="ap">Password</label>
        <div className="pw">
          <input
            id="ap"
            type={show ? 'text' : 'password'}
            autoComplete={signup ? 'new-password' : 'current-password'}
            value={f.password}
            onChange={set('password')}
          />
          <button
            type="button"
            className="eye"
            onClick={() => setShow(!show)}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>
      {signup && f.password && (
        <>
          <div className="meter" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <i key={n} className={score >= n ? 'on s' + score : ''} />
            ))}
          </div>
          <ul className="checks">
            {checks.map((c) => (
              <li key={c[0]} className={c[1] ? 'ok' : ''}>
                {c[0]}
              </li>
            ))}
          </ul>
        </>
      )}
      {err && (
        <div className="alert" role="alert">
          {err}
        </div>
      )}
      <button className="btn full lg" disabled={busy}>
        {busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}
      </button>
      <p className="switch">
        {signup ? 'Already have an account?' : 'New to Threadwork?'}{' '}
        <button
          type="button"
          className="link"
          onClick={() => onModeChange(signup ? 'login' : 'signup')}
        >
          {signup ? 'Log in' : 'Create an account'}
        </button>
      </p>
    </form>
  );
}
function AuthModal({ close, done }) {
  const [mode, setMode] = useState('login');
  return (
    <div className="modal" onClick={close}>
      <div
        className="box authbox"
        role="dialog"
        aria-label="Account"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="x" onClick={close} aria-label="Close">
          ×
        </button>
        <AuthForm mode={mode} onModeChange={setMode} onDone={done} />
      </div>
    </div>
  );
}
