import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExplainPanel } from '../components/ExplainPanel';
import '../styles/ExplainPanel.css';

export const ExplainPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentId, token } = location.state || {};

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="explain-page">
      <div className="clean-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Home
        </button>
      </div>
      <ExplainPanel token={token} documentId={documentId} />
    </div>
  );
};