import React, { useState, useEffect } from 'react';
import '../styles/FlashcardsPanel.css';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || 'http://192.168.0.146:8000';

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

interface CustomCard {
  id: string;
  front: string;
  back: string;
  isCustom: true;
}

type Card = Flashcard | CustomCard;

export const FlashcardsPanel: React.FC<Props> = ({ token, documentId }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [studyMode, setStudyMode] = useState<'browse' | 'focus'>('browse');

  useEffect(() => {
    if (documentId) {
      loadExistingCards();
    }
  }, [documentId]);

  async function loadExistingCards() {
    if (!documentId) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${documentId}/flashcards`);
      const data = await res.json();
      if (res.ok && data.flashcards) {
        // Limit to maximum 20 cards
        const limitedCards = data.flashcards.slice(0, 20);
        setCards(limitedCards);
      }
    } catch (e) {
      // No existing cards, that's fine
    }
  }

  async function generateCards() {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      // Count existing cards
      const aiCards = cards.filter((card: Card) => !('isCustom' in card && card.isCustom));
      const customCards = cards.filter((card: Card) => 'isCustom' in card && card.isCustom);
      
      // Check total cards limit
      const totalCards = cards.length;
      if (totalCards >= 20) {
        setError('Maximum of 20 cards reached. Use "Regenerate" to create a new set.');
        setLoading(false);
        return;
      }
      
      // Calculate how many more AI cards we can add
      const maxNewCards = 20 - totalCards;
      const cardsToGenerate = Math.min(5, maxNewCards);
      
      const res = await fetch(`${API_BASE}/documents/${documentId}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: cardsToGenerate, difficulty })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate flashcards');
      
      // Add new AI cards to existing cards
      const newAiCards = data.flashcards || [];
      setCards(prev => [...prev, ...newAiCards]);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function regenerateCards() {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const customCards = cards.filter((card: Card) => 'isCustom' in card && card.isCustom);
      const maxAiCards = 20 - customCards.length;
      
      const res = await fetch(`${API_BASE}/documents/${documentId}/flashcards/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: Math.min(10, maxAiCards), difficulty })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate flashcards');
      
      // Replace AI cards but keep custom cards
      const newAiCards = data.flashcards || [];
      setCards([
        ...customCards, // Keep custom cards
        ...newAiCards   // Replace all AI cards with new ones
      ]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function addCustomCard() {
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    
    const customCard: CustomCard = {
      id: `custom-${Date.now()}`,
      front: newCardFront.trim(),
      back: newCardBack.trim(),
      isCustom: true
    };
    
    setCards(prev => [...prev, customCard]);
    setNewCardFront('');
    setNewCardBack('');
    setShowCreateForm(false);
  }

  async function deleteCard(cardId: string) {
    try {
      // Remove from local state immediately
      setCards(prev => prev.filter(card => card.id !== cardId));
      
      // Adjust current card index if needed
      if (currentCardIndex >= cards.length - 1 && currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }
      
      // Try to delete from backend (for AI-generated cards)
      const cardToDelete = cards.find(card => card.id === cardId);
      if (cardToDelete && !('isCustom' in cardToDelete && cardToDelete.isCustom)) {
        await fetch(`${API_BASE}/documents/${documentId}/flashcards/${cardId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e: any) {
      // If backend deletion fails, still keep it removed from frontend
      console.warn('Failed to delete card from backend:', e.message);
    }
  }

  function toggleCardFlip(index: number) {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }

  function nextCard() {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlippedCards(new Set());
    }
  }

  function prevCard() {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setFlippedCards(new Set());
    }
  }

  function getCardFront(card: Card): string {
    return 'isCustom' in card ? card.front : card.question;
  }

  function getCardBack(card: Card): string {
    return 'isCustom' in card ? card.back : card.answer;
  }

  if (cards.length === 0 && !loading) {
    return (
      <div className="flashcards-container">
        {/* Header */}
        <div className="flashcards-header">
          <div className="section-info">
            <h2>🧠 Flashcard Deck</h2>
            <div className="section-description">Generate AI flashcards from your document or create custom ones</div>
          </div>
          <div className="header-controls">
            <div className="difficulty-selector">
              <select 
                className="difficulty-select" 
                value={difficulty} 
                onChange={e => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy Difficulty</option>
                <option value="medium">Medium Difficulty</option>
                <option value="hard">Hard Difficulty</option>
              </select>
            </div>
            <button 
              className="generate-btn" 
              disabled={!documentId || loading} 
              onClick={generateCards}
            >
              {loading ? 'Generating...' : '🚀 Generate Flashcards'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flashcards-content">
          {error && (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <p>{error}</p>
              <button className="retry-btn" onClick={() => setError(null)}>
                Try Again
              </button>
            </div>
          )}
          
          {!documentId ? (
            <div className="empty-state">
              <div className="empty-content">
                <div className="empty-icon">📄</div>
                <h3>No Document Selected</h3>
                <p>Upload a document first to generate flashcards and start studying.</p>
                
                <div className="style-preview">
                  <h4>Flashcard Features</h4>
                  <div className="style-options">
                    <div className="style-option">
                      <div className="option-icon easy-icon">🤖</div>
                      <div className="option-info">
                        <strong>AI Generation:</strong> Create flashcards automatically from your document content
                      </div>
                    </div>
                    <div className="style-option">
                      <div className="option-icon medium-icon">✏️</div>
                      <div className="option-info">
                        <strong>Custom Cards:</strong> Add your own questions and answers manually
                      </div>
                    </div>
                    <div className="style-option">
                      <div className="option-icon hard-icon">📊</div>
                      <div className="option-info">
                        <strong>Study Modes:</strong> Browse all cards or focus on specific ones
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-content">
                <div className="empty-icon">🧠</div>
                <h3>Ready to Create Flashcards?</h3>
                <p>Choose a difficulty level above and generate your first set of flashcards.</p>
                
                <div className="style-preview">
                  <h4>Flashcard Features</h4>
                  <div className="style-options">
                    <div className="style-option">
                      <div className="option-icon easy-icon">🤖</div>
                      <div className="option-info">
                        <strong>AI Generation:</strong> Create flashcards automatically from your document content
                      </div>
                    </div>
                    <div className="style-option">
                      <div className="option-icon medium-icon">✏️</div>
                      <div className="option-info">
                        <strong>Custom Cards:</strong> Add your own questions and answers manually
                      </div>
                    </div>
                    <div className="style-option">
                      <div className="option-icon hard-icon">📊</div>
                      <div className="option-info">
                        <strong>Study Modes:</strong> Browse all cards or focus on specific ones
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-container">
      {/* Header */}
      <div className="flashcards-header">
        <div className="section-info">
          <h2>📚 Flashcard Deck</h2>
          <div className={`section-description ${cards.length >= 20 ? 'limit-reached' : ''}`}>
            {cards.length}/20 cards • Study with AI-generated and custom flashcards
            {cards.length >= 20 && " • Maximum limit reached"}
          </div>
        </div>
        
        <div className="header-controls">
          <div className="study-mode-toggle">
            <button 
              className={`mode-btn ${studyMode === 'browse' ? 'active' : ''}`}
              onClick={() => setStudyMode('browse')}
            >
              Browse All
            </button>
            <button 
              className={`mode-btn ${studyMode === 'focus' ? 'active' : ''}`}
              onClick={() => setStudyMode('focus')}
            >
              Focus Mode
            </button>
          </div>
          
          <button 
            className="add-card-btn" 
            onClick={() => setShowCreateForm(true)}
          >
            + Add Card
          </button>

          {cards.length > 0 && (
            <button 
              className="clear-all-btn" 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete all ${cards.length} cards? This action cannot be undone.`)) {
                  setCards([]);
                  setCurrentCardIndex(0);
                  setFlippedCards(new Set());
                }
              }}
              title="Delete all cards"
            >
              🗑️ Clear All
            </button>
          )}
          
          {(() => {
            const aiCards = cards.filter((card: Card) => !('isCustom' in card && card.isCustom));
            const totalCards = cards.length;
            const canGenerateMore = totalCards < 20;
            
            return (
              <>
                {aiCards.length > 0 && (
                  <button 
                    className="regenerate-btn" 
                    onClick={regenerateCards}
                    disabled={loading}
                  >
                    {loading ? 'Regenerating...' : '🔄 Regenerate'}
                  </button>
                )}
                <button 
                  className="generate-btn" 
                  onClick={generateCards}
                  disabled={loading || !canGenerateMore}
                  title={!canGenerateMore ? 'Maximum 20 cards reached' : ''}
                >
                  {loading ? 'Generating...' : 
                   !canGenerateMore ? '🤖 Max Cards (20)' : 
                   `🤖 Generate More`}
                </button>
              </>
            );
          })()}
        </div>
      </div>

      {/* Content Area */}
      <div className="flashcards-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            {error}
            <button className="retry-btn" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Study Modes */}
        {studyMode === 'focus' ? (
        <div className="focus-mode">
          <div className="focus-controls">
            <button 
              className="nav-btn prev" 
              onClick={prevCard} 
              disabled={currentCardIndex === 0}
            >
              ← Previous
            </button>
            
            <span className="focus-counter">
              {currentCardIndex + 1} / {cards.length}
            </span>
            
            <button 
              className="nav-btn next" 
              onClick={nextCard} 
              disabled={currentCardIndex === cards.length - 1}
            >
              Next →
            </button>
          </div>
          
          <div className="focus-card-container">
            {cards[currentCardIndex] && (
              <div className="focus-card-wrapper">
                <div 
                  className={`flashcard focus-card ${flippedCards.has(0) ? 'flipped' : ''}`}
                  onClick={() => toggleCardFlip(0)}
                >
                  <div className="card-inner">
                    <div className="card-front">
                      <div className="card-header">
                        <div className="card-type">
                          {'isCustom' in cards[currentCardIndex] ? '✏️ Custom' : '🤖 AI Generated'}
                        </div>
                        <button 
                          className="delete-btn focus-delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this card?')) {
                              deleteCard(cards[currentCardIndex].id);
                            }
                          }}
                          title="Delete card"
                        >
                          ×
                        </button>
                      </div>
                      <div className="card-content">
                        <p>{getCardFront(cards[currentCardIndex])}</p>
                      </div>
                      <div className="flip-hint">Click to flip</div>
                    </div>
                    <div className="card-back">
                      <div className="card-content">
                        <div className="card-type">Answer</div>
                        <p>{getCardBack(cards[currentCardIndex])}</p>
                      </div>
                      <div className="flip-hint">Click to flip back</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="browse-mode">
          <div className="flashcards-grid">
            {cards.map((card, index) => (
              <div 
                key={card.id}
                className={`flashcard browse-card ${flippedCards.has(index) ? 'flipped' : ''}`}
                onClick={() => toggleCardFlip(index)}
              >
                <div className="card-inner">
                  <div className="card-front">
                    <div className="card-header">
                      <span className="card-type">
                        {'isCustom' in card ? '✏️ Custom' : '🤖 AI'}
                      </span>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this card?')) {
                            deleteCard(card.id);
                          }
                        }}
                        title="Delete card"
                      >
                        ×
                      </button>
                    </div>
                    <div className="card-content">
                      <p>{getCardFront(card)}</p>
                    </div>
                    <div className="flip-hint">Click to reveal answer</div>
                  </div>
                  <div className="card-back">
                    <div className="card-header">
                      <span className="card-type">Answer</span>
                    </div>
                    <div className="card-content">
                      <p>{getCardBack(card)}</p>
                    </div>
                    <div className="flip-hint">Click to see question</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Card Modal */}
      {showCreateForm && (
        <div className="create-card-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Custom Flashcard</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Front (Question/Term):</label>
                <textarea
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  placeholder="Enter the question or term..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Back (Answer/Definition):</label>
                <textarea
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  placeholder="Enter the answer or definition..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={addCustomCard}
                disabled={!newCardFront.trim() || !newCardBack.trim()}
              >
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Generating flashcards...</p>
        </div>
      )}
      </div>

      {/* Custom Card Creation Modal */}
      {showCreateForm && (
        <div className="create-card-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Custom Flashcard</h3>
              <button className="close-btn" onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Front (Question/Term):</label>
                <textarea
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  placeholder="Enter the question or term..."
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Back (Answer/Definition):</label>
                <textarea
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  placeholder="Enter the answer or definition..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={addCustomCard}
                disabled={!newCardFront.trim() || !newCardBack.trim()}
              >
                Create Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
