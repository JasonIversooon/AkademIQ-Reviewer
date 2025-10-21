import React, { useState } from 'react';
import { API_BASE } from '../config';
import '../styles/AuthPanel.css';

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
    <div className="auth-panel">
      {token && <div className="auth-success">✅ Authenticated</div>}
      <div className="auth-form">
        <div className="form-group">
          <input 
            className="form-input" 
            placeholder="Email address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            type="email"
          />
        </div>
        <div className="form-group">
          <input 
            className="form-input" 
            placeholder="Password" 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
        </div>
        <div className="form-group select-group">
          <select className="form-select" value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="register">Register</option>
            <option value="login">Login</option>
          </select>
        </div>
        <div className="form-group button-group">
          <button className="btn btn-primary" disabled={loading} onClick={submit}>
            {loading ? <span className="loading-spinner"></span> : mode}
          </button>
        </div>
      </div>
      {error && <div className="auth-error">❌ {error}</div>}
    </div>
  );
};
