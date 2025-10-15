import React, { useState } from 'react';
import '../styles/ExplainPanel.css';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || 'http://192.168.0.146:8000';

interface Props {
  token: string | null;
  documentId: string | null;
}

export const ExplainPanel: React.FC<Props> = ({ token, documentId }) => {
  const [style, setStyle] = useState('layman');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to format markdown-like text to HTML
  const formatContent = (text: string): string => {
    return text
      // Bold text: **text** or *text*
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // Headers
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // Line breaks and paragraphs
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      
      // Wrap in paragraph tags
      .replace(/^(.+)/, '<p>$1')
      .replace(/(.+)$/, '$1</p>')
      
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      .replace(/<p><br>/g, '<p>')
      
      // Lists (simple conversion)
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      
      // Numbered lists
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      
      // Code-like formatting
      .replace(/`(.*?)`/g, '<code>$1</code>');
  };

  async function generateExplanation() {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/documents/${documentId}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ style })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to generate explanation');
      }
      
      setContent(data.content || '');
    } catch (e: any) {
      setError(e.message);
      setContent('');
    } finally {
      setLoading(false);
    }
  }

  const styleOptions = [
    { value: 'layman', icon: '👥', label: 'Layman', description: 'Simple explanation' },
    { value: 'professor', icon: '🎓', label: 'Professor', description: 'Academic style' },
    { value: 'industry', icon: '🏢', label: 'Industry', description: 'Professional context' }
  ];

  return (
    <div className="explain-container">
      {/* Header Controls */}
      <div className="explain-header">
        <div className="section-info">
          <h2>💡 Smart Explanations</h2>
          <span className="section-description">Get explanations tailored to your preferred learning style</span>
        </div>
        
        <div className="header-controls">
          <div className="style-selector">
            <select 
              className="style-select" 
              value={style} 
              onChange={e => setStyle(e.target.value)}
            >
              {styleOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.icon} {option.label} ({option.description})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            className="btn btn-primary generate-btn" 
            onClick={generateExplanation}
            disabled={!documentId || loading}
          >
            {loading ? 'Generating...' : '✨ Generate Explanation'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="explain-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Generating explanation...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>Error: {error}</p>
            <button onClick={() => setError(null)} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {content && !loading && (
          <div className="explanation-result">
            <div className="result-header">
              <div className="style-badge">
                <span className="style-icon">
                  {styleOptions.find(opt => opt.value === style)?.icon}
                </span>
                <span className="style-name">
                  {styleOptions.find(opt => opt.value === style)?.label} Style
                </span>
              </div>
            </div>
            
            <div className="formatted-content">
              <div 
                className="content-text"
                dangerouslySetInnerHTML={{ __html: formatContent(content) }} 
              />
            </div>
          </div>
        )}

        {!content && !loading && !error && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">💡</div>
              <h3>Ready to Explain</h3>
              <p>Choose your preferred explanation style and click "Generate Explanation" to get started.</p>
              
              <div className="style-preview">
                <h4>Available Styles:</h4>
                <div className="style-options">
                  {styleOptions.map(option => (
                    <div key={option.value} className="style-option">
                      <span className="option-icon">{option.icon}</span>
                      <div className="option-info">
                        <strong>{option.label}:</strong> {option.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
