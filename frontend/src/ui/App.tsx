import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { HomePage } from '../pages/HomePage';
import { QuizPage } from '../pages/QuizPage';
import { FlashcardsPage } from '../pages/FlashcardsPage';
import { ExplainPage } from '../pages/ExplainPage';
import { VoicePage } from '../pages/VoicePage';
import '../styles/base.css';

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on app start
  useEffect(() => {
    const savedToken = localStorage.getItem('akademiq_token');
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const handleAuth = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('akademiq_token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('akademiq_token');
  };

  // Show loading spinner while checking for saved token
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          color: 'white', 
          fontSize: '18px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          Loading AcademIQ...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing Page - Login/Register */}
        <Route 
          path="/" 
          element={
            token ? (
              <Navigate to="/home" replace />
            ) : (
              <LandingPage onAuth={handleAuth} />
            )
          } 
        />
        
        {/* Home Page - Upload & Features */}
        <Route 
          path="/home" 
          element={
            token ? (
              <HomePage token={token} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Feature Pages */}
        <Route 
          path="/quiz" 
          element={
            token ? (
              <QuizPage />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/flashcards" 
          element={
            token ? (
              <FlashcardsPage />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/explain" 
          element={
            token ? (
              <ExplainPage />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        <Route 
          path="/voice" 
          element={
            token ? (
              <VoicePage />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
