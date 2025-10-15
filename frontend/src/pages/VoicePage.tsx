import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PodcastPanel } from '../components/PodcastPanel';
import '../styles/PodcastPanel.css';

export const PodcastPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { documentId, token } = location.state || {};

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div className="podcast-page">
      <div className="clean-header">
        <button className="back-button" onClick={handleBack}>
          ← Back to Home
        </button>
      </div>
      <PodcastPanel token={token} documentId={documentId} />
    </div>
  );
};

export const VoicePage = PodcastPage;