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
    <section>
      <h2>Explain</h2>
      <select value={style} onChange={e => setStyle(e.target.value)}>
        <option value="layman">Layman</option>
        <option value="professor">Professor</option>
        <option value="industry">Industry</option>
      </select>
      <button disabled={!documentId || loading} onClick={generate}>Explain</button>
      {loading && <p>Loading...</p>}
      {content && <pre style={{ background: '#f5f5f5', padding: '0.75rem', whiteSpace: 'pre-wrap' }}>{content}</pre>}
    </section>
  );
};
