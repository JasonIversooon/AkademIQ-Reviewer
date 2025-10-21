import React, { useState } from 'react';
import { API_BASE } from '../config';
import '../styles/QuizPanel.css';

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
      <div className="quiz-container">
        {/* Header */}
        <div className="quiz-header">
          <div className="section-info">
            <h2>📝 Quiz in Progress</h2>
            <div className="section-description">
              Question {currentQuiz.currentQuestion + 1} of {currentQuiz.questions.length} • {difficulty.toUpperCase()} Level
            </div>
          </div>
          <div className="header-controls">
            <div className="quiz-progress-info">
              <div className="progress-text">
                {Math.round(((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) * 100)}% Complete
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="quiz-content">
          <div className="quiz-progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentQuiz.currentQuestion + 1) / currentQuiz.questions.length) * 100}%` }}
            />
          </div>

          <div className="question-card">
            <div className="question-header">
              <h3>{question.question}</h3>
            </div>
            
            <div className="question-options">
              {question.options.map((option, index) => (
                <div
                  key={index}
                  className={`option-card ${currentQuiz.answers[currentQuiz.currentQuestion] === index ? 'selected' : ''}`}
                  onClick={() => selectAnswer(index)}
                >
                  <div className="option-indicator">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="option-content">
                    {option}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="question-navigation">
            <button 
              className="nav-btn secondary"
              onClick={prevQuestion} 
              disabled={currentQuiz.currentQuestion === 0}
            >
              ← Previous
            </button>
            
            <div className="nav-center">
              <div className="question-indicator">
                {currentQuiz.currentQuestion + 1} / {currentQuiz.questions.length}
              </div>
            </div>
            
            <div className="nav-right">
              {isLastQuestion && allAnswered ? (
                <button 
                  className="nav-btn primary submit-btn"
                  onClick={submitQuiz} 
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : '✓ Submit Quiz'}
                </button>
              ) : (
                <button 
                  className="nav-btn primary"
                  onClick={nextQuestion} 
                  disabled={!isAnswered || isLastQuestion}
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}
        </div>
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
      <div className="quiz-container">
        {/* Header */}
        <div className="quiz-header">
          <div className="section-info">
            <h2>📊 Quiz Results</h2>
            <div className="section-description">
              {difficulty.toUpperCase()} Level • {quizResults.total_questions} Questions
            </div>
          </div>
          <div className="header-controls">
            <button className="generate-btn" onClick={resetQuiz}>
              🔄 Take Another Quiz
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="quiz-content">
          <div className="results-summary">
            <div className="score-display">
              <div className="score-card" style={{ borderColor: getScoreColor(quizResults.percentage) }}>
                <div className="score-emoji">{getScoreEmoji(quizResults.percentage)}</div>
                <div className="score-main">
                  <div className="score-number" style={{ color: getScoreColor(quizResults.percentage) }}>
                    {quizResults.score}/{quizResults.total_questions}
                  </div>
                  <div className="score-percentage">
                    {quizResults.percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="score-message" style={{ backgroundColor: getScoreColor(quizResults.percentage) }}>
                  {quizResults.percentage >= 80 ? 'Excellent!' : 
                   quizResults.percentage >= 60 ? 'Good job!' : 
                   'Keep studying!'}
                </div>
              </div>
            </div>
          </div>

          <div className="results-review">
            <div className="review-header">
              <h3>📝 Question Review</h3>
              <div className="review-stats">
                <span className="correct-count">✅ {quizResults.score} Correct</span>
                <span className="incorrect-count">❌ {quizResults.total_questions - quizResults.score} Incorrect</span>
              </div>
            </div>
            
            <div className="review-questions">
              {quizResults.results.map((result, index) => (
                <div 
                  key={result.question_id} 
                  className={`review-card ${result.is_correct ? 'correct' : 'incorrect'}`}
                >
                  <div className="review-header-row">
                    <div className="question-number">
                      {result.is_correct ? '✅' : '❌'} Question {index + 1}
                    </div>
                  </div>
                  
                  <div className="review-question">
                    {result.question}
                  </div>
                  
                  <div className="review-answers">
                    <div className="answer-row">
                      <span className="answer-label">Your answer:</span>
                      <span className={`answer-value ${result.is_correct ? 'correct' : 'incorrect'}`}>
                        {String.fromCharCode(65 + result.user_answer)}
                      </span>
                    </div>
                    {!result.is_correct && (
                      <div className="answer-row">
                        <span className="answer-label">Correct answer:</span>
                        <span className="answer-value correct">
                          {String.fromCharCode(65 + result.correct_answer)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="review-explanation">
                    <div className="explanation-label">Explanation:</div>
                    <div className="explanation-text">{result.explanation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initial state - quiz generation
  return (
    <div className="quiz-container">
      {/* Header */}
      <div className="quiz-header">
        <div className="section-info">
          <h2>📝 Interactive Quiz</h2>
          <div className="section-description">Test your knowledge with AI-generated questions</div>
        </div>
        <div className="header-controls">
          <div className="difficulty-selector">
            <select 
              className="difficulty-select" 
              value={difficulty} 
              onChange={e => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy ({getQuestionCount('easy')} questions)</option>
              <option value="medium">Medium ({getQuestionCount('medium')} questions)</option>
              <option value="hard">Hard ({getQuestionCount('hard')} questions)</option>
            </select>
          </div>
          <button 
            className="generate-btn" 
            disabled={!documentId || loading} 
            onClick={generateQuiz}
          >
            {loading ? 'Generating...' : '🚀 Start Quiz'}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="quiz-content">
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
              <p>Upload a document first to generate quizzes and test your knowledge.</p>
              
              <div className="style-preview">
                <h4>Quiz Difficulty Levels</h4>
                <div className="style-options">
                  <div className="style-option">
                    <div className="option-icon easy-icon">E</div>
                    <div className="option-info">
                      <strong>Easy:</strong> Basic definitions and simple facts (8 questions)
                    </div>
                  </div>
                  <div className="style-option">
                    <div className="option-icon medium-icon">M</div>
                    <div className="option-info">
                      <strong>Medium:</strong> Conceptual understanding and applications (12 questions)
                    </div>
                  </div>
                  <div className="style-option">
                    <div className="option-icon hard-icon">H</div>
                    <div className="option-info">
                      <strong>Hard:</strong> Analysis, synthesis, and complex scenarios (15 questions)
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
              <h3>Ready to Test Your Knowledge?</h3>
              <p>Choose a difficulty level above and start your interactive quiz session.</p>
              
              <div className="style-preview">
                <h4>Quiz Difficulty Levels</h4>
                <div className="style-options">
                  <div className="style-option">
                    <div className="option-icon easy-icon">E</div>
                    <div className="option-info">
                      <strong>Easy:</strong> Basic definitions and simple facts (8 questions)
                    </div>
                  </div>
                  <div className="style-option">
                    <div className="option-icon medium-icon">M</div>
                    <div className="option-info">
                      <strong>Medium:</strong> Conceptual understanding and applications (12 questions)
                    </div>
                  </div>
                  <div className="style-option">
                    <div className="option-icon hard-icon">H</div>
                    <div className="option-info">
                      <strong>Hard:</strong> Analysis, synthesis, and complex scenarios (15 questions)
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
};