import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExplainPanel } from '../components/ExplainPanel';

export const ExplainPage: React.FC = () => {
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
          <h1>💡 Smart Explanations</h1>
          <p>Get explanations tailored to your preferred learning style</p>
        </div>
      </div>

      {/* Page Content */}
      <div className="feature-content">
        <div className="feature-panel">
          <ExplainPanel token={token} documentId={documentId} />
        </div>
      </div>
    </div>
  );
};