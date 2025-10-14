import React, { useState } from 'react';

// Vite exposes env variables prefixed with VITE_ via import.meta.env
const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

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
      const res = await fetch(`${API_BASE}/auth/${mode}`, {
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
    <div>
      {token && <p className="status-success">✅ Authenticated</p>}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
          <input 
            className="form-input" 
            placeholder="Email address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            type="email"
          />
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
          <input 
            className="form-input" 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <div className="form-group">
          <select className="form-select" value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="register">Register</option>
            <option value="login">Login</option>
          </select>
        </div>
        <div className="form-group">
          <button className="btn btn-primary" disabled={loading} onClick={submit}>
            {loading ? <span className="loading-spinner"></span> : mode}
          </button>
        </div>
      </div>
      {error && <p className="status-error">❌ {error}</p>}
    </div>
  );
};
