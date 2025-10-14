import React, { useState } from 'react';
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

  const handleAuth = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
  };

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
