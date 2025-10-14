import React, { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

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
    <section>
      <h2>Flashcards</h2>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button disabled={!documentId || loading} onClick={generate}>Generate</button>
        <button disabled={!documentId} onClick={refresh}>Refresh</button>
      </div>
      {loading && <p>Generating...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {cards.map(c => (
          <li key={c.id} style={{ marginBottom: '0.5rem' }}>
            <strong>{c.question}</strong><br />
            <em>{c.answer}</em>
          </li>
        ))}
      </ul>
    </section>
  );
};
