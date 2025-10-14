import React, { useState } from 'react';
import '../styles/FlashcardsPanel.css';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

interface Props {
  token: string | null;
  documentId: string | null;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  status: string;
}

export const FlashcardsPanel: React.FC<Props> = ({ token, documentId }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('medium');

  async function generate() {
    if (!documentId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/documents/${documentId}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 8, difficulty })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed');
      setCards(data.flashcards);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  async function refresh() {
    if (!documentId) return;
  const res = await fetch(`${API_BASE}/documents/${documentId}/flashcards`);
    const data = await res.json();
    if (res.ok) setCards(data.flashcards);
  }

  return (
    <div className="flashcards-panel">
      <div className="flashcards-controls">
        <div className="form-group">
          <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={!documentId || loading} onClick={generate}>
          {loading ? <span className="loading-spinner"></span> : 'Generate'}
        </button>
        <button className="btn btn-secondary" disabled={!documentId} onClick={refresh}>
          Refresh
        </button>
      </div>
      
      {loading && <div className="flashcards-status status-loading">⏳ Generating flashcards...</div>}
      {error && <div className="flashcards-status status-error">❌ {error}</div>}
      
      {cards.length > 0 && (
        <div className="flashcards-grid">
          {cards.map(c => (
            <div key={c.id} className={`flashcard ${c.status}`}>
              <div className="flashcard-question">{c.question}</div>
              <div className="flashcard-answer">{c.answer}</div>
              <div className="flashcard-actions">
                <button className={`flashcard-btn ${c.status === 'mastered' ? 'mastered' : 'new'}`}>
                  {c.status === 'mastered' ? '✅ Mastered' : '📚 Study'}
                </button>
                <button className={`flashcard-btn ${c.status === 'later' ? 'later' : 'new'}`}>
                  {c.status === 'later' ? '⏰ Later' : '⏰ Study Later'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && cards.length === 0 && documentId && (
        <div className="flashcards-empty">
          <div className="empty-icon">🧠</div>
          <h3>No flashcards yet</h3>
          <p>Click "Generate" to create flashcards from your document.</p>
        </div>
      )}
    </div>
  );
};
