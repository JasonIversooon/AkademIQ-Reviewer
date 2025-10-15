import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QuizPanel } from '../components/QuizPanel';
import '../styles/QuizPanel.css';

export const QuizPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentId, token } = location.state || {};

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="quiz-page">
      <div className="clean-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Home
        </button>
      </div>
      <QuizPanel token={token} documentId={documentId} />
    </div>
  );
};