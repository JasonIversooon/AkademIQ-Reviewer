import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/FeaturePage.css';

export const VoicePage: React.FC = () => {
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
          <h1>🎵 Read with Voice</h1>
          <p>Listen to your documents with AI-generated audio</p>
        </div>
      </div>

      {/* Page Content */}
      <div className="feature-content">
        <div className="feature-panel">
          <div className="coming-soon">
            <div className="coming-soon-icon">🚧</div>
            <h3>Coming Soon!</h3>
            <p>Voice reading feature is under development.</p>
            <p>This will include:</p>
            <ul>
              <li>🎙️ Multiple voice options</li>
              <li>⚡ Adjustable reading speed</li>
              <li>📱 Podcast-style playback</li>
              <li>🎧 Background listening mode</li>
            </ul>
            <div style={{ marginTop: '2rem' }}>
              <button className="btn btn-primary" onClick={handleBack}>
                ← Back to Features
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};