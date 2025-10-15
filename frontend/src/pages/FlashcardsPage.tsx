import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FlashcardsPanel } from '../components/FlashcardsPanel';
import '../styles/FlashcardsPanel.css';

export const FlashcardsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentId, token } = location.state || {};

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="flashcards-page">
      <div className="clean-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Home
        </button>
      </div>
      <FlashcardsPanel token={token} documentId={documentId} />
    </div>
  );
};