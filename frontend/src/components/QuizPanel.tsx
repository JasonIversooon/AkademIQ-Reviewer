import React, { useState } from 'react';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || 'http://192.168.0.142:8000';

interface Props {
  token: string | null;
  documentId: string | null;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface QuizResult {
  question_id: string;
  question: string;
  user_answer: number;
  correct_answer: number;
  is_correct: boolean;
  explanation: string;
}

export const QuizPanel: React.FC<Props> = ({ token, documentId }) => {
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<'idle' | 'taking' | 'completed'>('idle');
  const [currentQuiz, setCurrentQuiz] = useState<{
    quiz_id: string;
    questions: QuizQuestion[];
    currentQuestion: number;
    answers: number[];
  } | null>(null);
  const [quizResults, setQuizResults] = useState<{
    score: number;
    total_questions: number;
    percentage: number;
    results: QuizResult[];
  } | null>(null);

  async function generateQuiz() {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/documents/${documentId}/quiz/generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ difficulty })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate quiz');
      
      setCurrentQuiz({
        quiz_id: data.quiz_id,
        questions: data.questions,
        currentQuestion: 0,
        answers: new Array(data.questions.length).fill(-1)
      });
      setQuizState('taking');
      setQuizResults(null);
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(answerIndex: number) {
    if (!currentQuiz) return;
    
    const newAnswers = [...currentQuiz.answers];
    newAnswers[currentQuiz.currentQuestion] = answerIndex;
    
    setCurrentQuiz({
      ...currentQuiz,
      answers: newAnswers
    });
  }

  function nextQuestion() {
    if (!currentQuiz) return;
    
    if (currentQuiz.currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuiz({
        ...currentQuiz,
        currentQuestion: currentQuiz.currentQuestion + 1
      });
    }
  }

  function prevQuestion() {
    if (!currentQuiz) return;
    
    if (currentQuiz.currentQuestion > 0) {
      setCurrentQuiz({
        ...currentQuiz,
        currentQuestion: currentQuiz.currentQuestion - 1
      });
    }
  }

  async function submitQuiz() {
    if (!currentQuiz) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/documents/quiz/${currentQuiz.quiz_id}/submit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answers: currentQuiz.answers })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit quiz');
      
      setQuizResults(data);
      setQuizState('completed');
      
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function resetQuiz() {
    setCurrentQuiz(null);
    setQuizResults(null);
    setQuizState('idle');
    setError(null);
  }

  const getQuestionCount = (diff: string) => {
    const counts = { easy: 8, medium: 12, hard: 15 };
    return counts[diff as keyof typeof counts] || 12;
  };

  if (quizState === 'taking' && currentQuiz) {
    const question = currentQuiz.questions[currentQuiz.currentQuestion];
    const isAnswered = currentQuiz.answers[currentQuiz.currentQuestion] !== -1;
    const isLastQuestion = currentQuiz.currentQuestion === currentQuiz.questions.length - 1;
    const allAnswered = currentQuiz.answers.every(a => a !== -1);

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, color: '#4a5568' }}>Quiz - {difficulty.toUpperCase()}</h3>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Question {currentQuiz.currentQuestion + 1} of {currentQuiz.questions.length}
          </div>
        </div>
        
        <div className="quiz-progress">
          <div 
            className="quiz-progress-bar"
            style={{ width: `${((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) * 100}%` }}
          />
        </div>
        
        <div className="quiz-question">
          <h3 style={{ marginBottom: '1.5rem', color: '#2d3748' }}>{question.question}</h3>
          <div className="quiz-options">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`quiz-option ${currentQuiz.answers[currentQuiz.currentQuestion] === index ? 'selected' : ''}`}
                onClick={() => selectAnswer(index)}
              >
                <strong>{String.fromCharCode(65 + index)}.</strong> {option}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={prevQuestion} 
            disabled={currentQuiz.currentQuestion === 0}
          >
            ← Previous
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isLastQuestion && allAnswered ? (
              <button 
                className="btn btn-primary"
                onClick={submitQuiz} 
                disabled={loading}
              >
                {loading ? <span className="loading-spinner"></span> : '✓ Submit Quiz'}
              </button>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={nextQuestion} 
                disabled={!isAnswered || isLastQuestion}
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {error && <p className="status-error">❌ {error}</p>}
      </div>
    );
  }

  if (quizState === 'completed' && quizResults) {
    const getScoreColor = (percentage: number) => {
      if (percentage >= 80) return '#38a169';
      if (percentage >= 60) return '#ed8936';
      return '#e53e3e';
    };

    const getScoreEmoji = (percentage: number) => {
      if (percentage >= 80) return '🎉';
      if (percentage >= 60) return '👍';
      return '📚';
    };

    return (
      <div>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h3 style={{ color: '#2d3748', marginBottom: '1rem' }}>Quiz Complete!</h3>
          <div style={{ 
            background: 'white',
            border: `3px solid ${getScoreColor(quizResults.percentage)}`,
            borderRadius: '16px',
            padding: '2rem',
            display: 'inline-block',
            minWidth: '200px'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {getScoreEmoji(quizResults.percentage)}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: getScoreColor(quizResults.percentage) }}>
              {quizResults.score}/{quizResults.total_questions}
            </div>
            <div style={{ fontSize: '1.2rem', color: '#666' }}>
              {quizResults.percentage.toFixed(1)}%
            </div>
            <div style={{ 
              background: getScoreColor(quizResults.percentage),
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              marginTop: '1rem',
              fontSize: '0.9rem'
            }}>
              {quizResults.percentage >= 80 ? 'Excellent!' : 
               quizResults.percentage >= 60 ? 'Good job!' : 
               'Keep studying!'}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#4a5568' }}>📝 Review Questions:</h4>
          <div className="card-list">
            {quizResults.results.map((result, index) => (
              <div 
                key={result.question_id} 
                className="card"
                style={{ 
                  borderLeft: `4px solid ${result.is_correct ? '#38a169' : '#e53e3e'}`,
                  background: result.is_correct ? '#f0fff4' : '#fff5f5'
                }}
              >
                <div className="card-title">
                  {result.is_correct ? '✅' : '❌'} Q{index + 1}: {result.question}
                </div>
                <div className="card-content">
                  <p><strong>Your answer:</strong> {String.fromCharCode(65 + result.user_answer)}</p>
                  {!result.is_correct && (
                    <p><strong>Correct answer:</strong> {String.fromCharCode(65 + result.correct_answer)}</p>
                  )}
                  <p style={{ marginTop: '0.5rem', fontStyle: 'italic', color: '#666' }}>
                    {result.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={resetQuiz}>
            🔄 Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  // Initial state - quiz generation
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="easy">Easy ({getQuestionCount('easy')} questions)</option>
            <option value="medium">Medium ({getQuestionCount('medium')} questions)</option>
            <option value="hard">Hard ({getQuestionCount('hard')} questions)</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={!documentId || loading} onClick={generateQuiz}>
          {loading ? <span className="loading-spinner"></span> : '🚀 Start Quiz'}
        </button>
      </div>
      
      {error && <p className="status-error">❌ {error}</p>}
      
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-title">📚 Quiz Difficulty Levels</div>
        <div className="card-content">
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#68d391', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>E</span>
              <span><strong>Easy:</strong> Basic definitions and simple facts (8 questions)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#f6ad55', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>M</span>
              <span><strong>Medium:</strong> Conceptual understanding and applications (12 questions)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ background: '#fc8181', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>H</span>
              <span><strong>Hard:</strong> Analysis, synthesis, and complex scenarios (15 questions)</span>
            </div>
          </div>
        </div>
      </div>
      
      {!documentId && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>Upload a document first to generate quizzes</p>
        </div>
      )}
    </div>
  );
};