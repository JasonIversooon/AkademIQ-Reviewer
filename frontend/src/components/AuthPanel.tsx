import React, { useState } from 'react';

interface Props {
  onAuth: (token: string) => void;
  token: string | null;
}

export const AuthPanel: React.FC<Props> = ({ onAuth, token }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      onAuth(data.access_token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Auth</h2>
      {token && <p style={{ color: 'green' }}>Authenticated</p>}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <select value={mode} onChange={e => setMode(e.target.value as any)}>
          <option value="register">Register</option>
          <option value="login">Login</option>
        </select>
        <button disabled={loading} onClick={submit}>{loading ? '...' : mode}</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </section>
  );
};
