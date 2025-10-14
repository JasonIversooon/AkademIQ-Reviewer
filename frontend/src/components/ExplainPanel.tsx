import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

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
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <select className="form-select" value={style} onChange={e => setStyle(e.target.value)}>
            <option value="layman">👥 Layman (Simple explanation)</option>
            <option value="professor">🎓 Professor (Academic style)</option>
            <option value="industry">🏢 Industry (Professional context)</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={!documentId || loading} onClick={generate}>
          {loading ? <span className="loading-spinner"></span> : '✨ Generate Explanation'}
        </button>
      </div>

      {loading && <p className="status-loading">⏳ Generating explanation...</p>}
      
      {content && (
        <div className="explanation-content">
          <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }} />
        </div>
      )}
      
      {!documentId && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>Upload a document first to generate explanations</p>
        </div>
      )}
    </div>
  );
};
