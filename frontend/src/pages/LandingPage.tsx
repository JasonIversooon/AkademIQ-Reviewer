import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LandingPage.css';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

interface Props {
  onAuth: (token: string) => void;
}

export const LandingPage: React.FC<Props> = ({ onAuth }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true); 
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      
      onAuth(data.access_token);
      navigate('/home'); // Navigate to home page after successful auth
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submit();
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Left side - Branding */}
        <div className="landing-left">
          <div className="brand-section">
            <h1 className="brand-title">AcademIQ</h1>
            <p className="brand-subtitle">
              Transform your documents into interactive learning experiences
            </p>
            <div className="features-preview">
              <div className="feature-item">
                <span className="feature-icon">🧠</span>
                <span>AI-Generated Flashcards</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📝</span>
                <span>Interactive Quizzes</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💡</span>
                <span>Smart Explanations</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📚</span>
                <span>Document Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="landing-right">
          <div className="auth-container">
            <div className="auth-header">
              <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
              <p>
                {mode === 'login' 
                  ? 'Sign in to continue your learning journey' 
                  : 'Join thousands of learners using AI-powered study tools'
                }
              </p>
            </div>

            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); submit(); }}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input 
                  id="email"
                  className="form-input" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  type="email"
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input 
                  id="password"
                  className="form-input" 
                  placeholder="Enter your password" 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  onKeyPress={handleKeyPress}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary auth-submit"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>

              {error && <p className="status-error">❌ {error}</p>}
            </form>

            <div className="auth-switch">
              <p>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button"
                  className="auth-switch-btn"
                  onClick={() => {
                    setMode(mode === 'login' ? 'register' : 'login');
                    setError(null);
                  }}
                >
                  {mode === 'login' ? 'Create one' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};