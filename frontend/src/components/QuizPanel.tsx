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
      <section>
        <h2>Quiz - {difficulty.toUpperCase()}</h2>
        <div style={{ marginBottom: '1rem' }}>
          <strong>Question {currentQuiz.currentQuestion + 1} of {currentQuiz.questions.length}</strong>
          <div style={{ background: '#f0f0f0', height: '8px', borderRadius: '4px', marginTop: '0.5rem' }}>
            <div 
              style={{ 
                background: '#007bff', 
                height: '100%', 
                width: `${((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) * 100}%`,
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '2rem' }}>
          <h3>{question.question}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                style={{
                  padding: '1rem',
                  textAlign: 'left',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  background: currentQuiz.answers[currentQuiz.currentQuestion] === index ? '#e3f2fd' : 'white',
                  borderColor: currentQuiz.answers[currentQuiz.currentQuestion] === index ? '#2196f3' : '#ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <strong>{String.fromCharCode(65 + index)}.</strong> {option}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={prevQuestion} 
            disabled={currentQuiz.currentQuestion === 0}
            style={{ opacity: currentQuiz.currentQuestion === 0 ? 0.5 : 1 }}
          >
            Previous
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isLastQuestion && allAnswered ? (
              <button 
                onClick={submitQuiz} 
                disabled={loading}
                style={{ background: '#4caf50', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none' }}
              >
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button 
                onClick={nextQuestion} 
                disabled={!isAnswered || isLastQuestion}
                style={{ opacity: !isAnswered || isLastQuestion ? 0.5 : 1 }}
              >
                Next
              </button>
            )}
          </div>
        </div>

        {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      </section>
    );
  }

  if (quizState === 'completed' && quizResults) {
    return (
      <section>
        <h2>Quiz Results</h2>
        <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Score: {quizResults.score}/{quizResults.total_questions} ({quizResults.percentage.toFixed(1)}%)</h3>
          <div style={{ 
            background: quizResults.percentage >= 70 ? '#4caf50' : quizResults.percentage >= 50 ? '#ff9800' : '#f44336',
            color: 'white',
            padding: '0.5rem',
            borderRadius: '4px',
            textAlign: 'center',
            marginTop: '0.5rem'
          }}>
            {quizResults.percentage >= 70 ? '🎉 Great job!' : quizResults.percentage >= 50 ? '👍 Good effort!' : '📚 Keep studying!'}
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h4>Review Questions:</h4>
          {quizResults.results.map((result, index) => (
            <div 
              key={result.question_id} 
              style={{ 
                margin: '1rem 0', 
                padding: '1rem', 
                border: `2px solid ${result.is_correct ? '#4caf50' : '#f44336'}`,
                borderRadius: '8px',
                background: result.is_correct ? '#f1f8e9' : '#ffebee'
              }}
            >
              <p><strong>Q{index + 1}: {result.question}</strong></p>
              <p>Your answer: <strong>{String.fromCharCode(65 + result.user_answer)}</strong></p>
              {!result.is_correct && (
                <p>Correct answer: <strong>{String.fromCharCode(65 + result.correct_answer)}</strong></p>
              )}
              <p><em>{result.explanation}</em></p>
            </div>
          ))}
        </div>

        <button onClick={resetQuiz} style={{ background: '#2196f3', color: 'white', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none' }}>
          Take Another Quiz
        </button>
      </section>
    );
  }

  // Initial state - quiz generation
  return (
    <section>
      <h2>Quiz</h2>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
          <option value="easy">Easy ({getQuestionCount('easy')} questions)</option>
          <option value="medium">Medium ({getQuestionCount('medium')} questions)</option>
          <option value="hard">Hard ({getQuestionCount('hard')} questions)</option>
        </select>
        <button disabled={!documentId || loading} onClick={generateQuiz}>
          {loading ? 'Generating...' : 'Start Quiz'}
        </button>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '1rem' }}>
        <p><strong>Quiz Difficulty:</strong></p>
        <ul>
          <li><strong>Easy:</strong> Basic definitions and simple facts (8 questions)</li>
          <li><strong>Medium:</strong> Conceptual understanding and applications (12 questions)</li>
          <li><strong>Hard:</strong> Analysis, synthesis, and complex scenarios (15 questions)</li>
        </ul>
      </div>
    </section>
  );
};