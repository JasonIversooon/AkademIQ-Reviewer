import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadPanel } from '../components/UploadPanel';

interface Props {
  token: string | null;
  onLogout: () => void;
}

export const HomePage: React.FC<Props> = ({ token, onLogout }) => {
  const navigate = useNavigate();
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const features = [
    {
      id: 'flashcards',
      title: 'Flashcards',
      description: 'Generate AI-powered flashcards from your documents',
      icon: '🧠',
      color: '#667eea',
      path: '/flashcards'
    },
    {
      id: 'quiz',
      title: 'Quiz',
      description: 'Take interactive quizzes with multiple difficulty levels',
      icon: '📝',
      color: '#f093fb',
      path: '/quiz'
    },
    {
      id: 'explain',
      title: 'Explain',
      description: 'Get explanations in different styles and complexity levels',
      icon: '💡',
      color: '#4facfe',
      path: '/explain'
    },
    {
      id: 'voice',
      title: 'Read with Voices',
      description: 'Listen to your documents with AI-generated audio',
      icon: '🎵',
      color: '#43e97b',
      path: '/voice'
    }
  ];

  const handleFeatureClick = (feature: any) => {
    if (!documentId) {
      alert('Please upload a document first!');
      return;
    }
    navigate(feature.path, { state: { documentId, token } });
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="home-page">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h2>AcademIQ</h2>
          </div>
          <div className="navbar-actions">
            <span className="user-status">
              <span className="status-dot"></span>
              Authenticated
            </span>
            <button className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="home-container">
        {/* Left Side - Upload & Preview */}
        <div className="home-left">
          <div className="upload-section">
            <div className="section-header">
              <h3>📁 Upload Document</h3>
              <p>Upload a PDF to start generating study materials</p>
            </div>
            <UploadPanel 
              token={token} 
              onUploaded={(id) => {
                setDocumentId(id);
                setShowPreview(true);
              }} 
            />
          </div>

          {/* Preview Section */}
          {documentId && (
            <div className="preview-section">
              <div className="preview-header">
                <h4>📄 Document Preview</h4>
                <button 
                  className="preview-toggle"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? '▼ Hide' : '▶ Show'}
                </button>
              </div>
              
              {showPreview && (
                <div className="preview-content">
                  <div className="preview-placeholder">
                    <p>✅ Document uploaded successfully!</p>
                    <p><strong>Document ID:</strong> {documentId}</p>
                    <p>Ready to generate study materials →</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side - Features */}
        <div className="home-right">
          <div className="features-section">
            <div className="section-header">
              <h3>🚀 Features</h3>
              <p>Choose a study tool to get started</p>
            </div>
            
            <div className="features-grid">
              {features.map((feature) => (
                <div 
                  key={feature.id}
                  className={`feature-card ${!documentId ? 'disabled' : ''}`}
                  onClick={() => handleFeatureClick(feature)}
                  style={{ borderLeftColor: feature.color }}
                >
                  <div className="feature-icon-large" style={{ backgroundColor: feature.color }}>
                    {feature.icon}
                  </div>
                  <div className="feature-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                  <div className="feature-arrow">
                    →
                  </div>
                </div>
              ))}
            </div>

            {!documentId && (
              <div className="features-disabled-message">
                <p>📤 Upload a document to unlock all features</p>
              </div>
            )}
          </div>

          {/* Timer Section (Future Feature) */}
          <div className="timer-section">
            <div className="section-header">
              <h4>⏰ Study Timer</h4>
              <p>Pomodoro-style study sessions (Coming Soon)</p>
            </div>
            <div className="timer-placeholder">
              <div className="timer-circle">
                <span>25:00</span>
              </div>
              <p>Set intervals and track your study time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};