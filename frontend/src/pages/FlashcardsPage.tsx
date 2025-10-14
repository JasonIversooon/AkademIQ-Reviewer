import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FlashcardsPanel } from '../components/FlashcardsPanel';
import '../styles/FeaturePage.css';

export const FlashcardsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentId, token } = location.state || {};

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="feature-page">
      {/* Page Header */}
      <div className="feature-header">
        <button className="btn btn-secondary back-btn" onClick={handleBack}>
          ← Back to Home
        </button>
        <div className="feature-title">
          <h1>🧠 AI Flashcards</h1>
          <p>Study with intelligent flashcards generated from your document</p>
        </div>
      </div>

      {/* Page Content */}
      <div className="feature-content">
        <div className="feature-panel">
          <FlashcardsPanel token={token} documentId={documentId} />
        </div>
      </div>
    </div>
  );
};