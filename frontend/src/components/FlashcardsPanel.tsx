import React, { useState } from 'react';

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

  async function generate() {
    if (!documentId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/documents/${documentId}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 8 })
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
    const res = await fetch(`http://127.0.0.1:8000/documents/${documentId}/flashcards`);
    const data = await res.json();
    if (res.ok) setCards(data.flashcards);
  }

  return (
    <section>
      <h2>Flashcards</h2>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
