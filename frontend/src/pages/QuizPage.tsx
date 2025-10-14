import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QuizPanel } from '../components/QuizPanel';

export const QuizPage: React.FC = () => {
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
          <h1>📝 Interactive Quiz</h1>
          <p>Test your knowledge with AI-generated questions</p>
        </div>
      </div>

      {/* Page Content */}
      <div className="feature-content">
        <div className="feature-panel">
          <QuizPanel token={token} documentId={documentId} />
        </div>
      </div>
    </div>
  );
};