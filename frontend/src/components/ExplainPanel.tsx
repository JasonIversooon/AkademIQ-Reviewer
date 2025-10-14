import React, { useState } from 'react';
import '../styles/ExplainPanel.css';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

interface Props {
  token: string | null;
  documentId: string | null;
}

export const ExplainPanel: React.FC<Props> = ({ token, documentId }) => {
  const [style, setStyle] = useState('layman');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!documentId) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/documents/${documentId}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ style })
    });
    const data = await res.json();
    if (res.ok) setContent(data.content); else setContent('[Error generating explanation]');
    setLoading(false);
  }

  return (
    <div className="explain-panel">
      <div className="explain-controls">
        <div className="form-group">
          <select className="form-select explain-select" value={style} onChange={e => setStyle(e.target.value)}>
            <option value="layman">👥 Layman (Simple explanation)</option>
            <option value="professor">🎓 Professor (Academic style)</option>
            <option value="industry">🏢 Industry (Professional context)</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={!documentId || loading} onClick={generate}>
          {loading ? <span className="loading-spinner"></span> : '✨ Generate Explanation'}
        </button>
      </div>

      {loading && <div className="explain-status status-loading">⏳ Generating explanation...</div>}
      
      {content && (
        <div className="explanation-content">
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />
        </div>
      )}
      
      <div className="explain-styles-info">
        <h4>💡 Explanation Styles</h4>
        <div className="style-options">
          <div className="style-option">
            <span className="style-icon">👥</span>
            <span><strong>Layman:</strong> Simple, easy-to-understand explanations for general audiences</span>
          </div>
          <div className="style-option">
            <span className="style-icon">🎓</span>
            <span><strong>Professor:</strong> Academic, detailed explanations with theoretical context</span>
          </div>
          <div className="style-option">
            <span className="style-icon">🏢</span>
            <span><strong>Industry:</strong> Professional, practical explanations focused on applications</span>
          </div>
        </div>
      </div>
      
      {!documentId && (
        <div className="explain-empty">
          <div className="empty-icon">💡</div>
          <h3>No document loaded</h3>
          <p>Upload a document first to generate explanations</p>
        </div>
      )}
    </div>
  );
};
