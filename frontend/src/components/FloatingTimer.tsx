import React, { useState, useEffect, useRef } from 'react';
import '../styles/FloatingTimer.css';

interface Position {
  x: number;
  y: number;
}

interface TimerSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
}

interface Props {
  onSettingsChange?: (settings: TimerSettings) => void;
}

export const FloatingTimer: React.FC<Props> = ({ onSettingsChange }) => {
  const [position, setPosition] = useState<Position>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [currentSession, setCurrentSession] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [sessionCount, setSessionCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  
  const [settings, setSettings] = useState<TimerSettings>({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    longBreakInterval: 4
  });

  const dragRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });
  const intervalRef = useRef<number>();

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (currentSession === 'work') {
      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      
      if (newSessionCount % settings.longBreakInterval === 0) {
        setCurrentSession('longBreak');
        setTimeLeft(settings.longBreakMinutes * 60);
      } else {
        setCurrentSession('shortBreak');
        setTimeLeft(settings.shortBreakMinutes * 60);
      }
    } else {
      setCurrentSession('work');
      setTimeLeft(settings.workMinutes * 60);
    }

    // Play notification sound or show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: `${currentSession === 'work' ? 'Work' : 'Break'} session completed!`,
        icon: '⏰'
      });
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentSession('work');
    setTimeLeft(settings.workMinutes * 60);
    setSessionCount(0);
  };

  const handleControlClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation(); // Prevent timer expansion/collapse
    action();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionEmoji = () => {
    switch (currentSession) {
      case 'work': return '🍅';
      case 'shortBreak': return '☕';
      case 'longBreak': return '🌴';
      default: return '⏰';
    }
  };

  const getSessionColor = () => {
    switch (currentSession) {
      case 'work': return '#e74c3c';
      case 'shortBreak': return '#3498db';
      case 'longBreak': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getCurrentSessionDuration = () => {
    switch (currentSession) {
      case 'work': return settings.workMinutes * 60;
      case 'shortBreak': return settings.shortBreakMinutes * 60;
      case 'longBreak': return settings.longBreakMinutes * 60;
      default: return settings.workMinutes * 60;
    }
  };

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dragRef.current) {
      setIsDragging(true);
      const rect = dragRef.current.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (isExpanded ? 300 : 60);
      const maxY = window.innerHeight - (isExpanded ? 200 : 60);
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleTimerClick = () => {
    if (!isDragging) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSettingsClick = () => {
    setShowModal(true);
  };

  const handleSettingsButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent timer expansion/collapse
    handleSettingsClick();
  };

  const updateSettings = (newSettings: TimerSettings) => {
    setSettings(newSettings);
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
    
    // Reset timer with new settings if not running
    if (!isRunning) {
      setTimeLeft(newSettings.workMinutes * 60);
    }
  };

  return (
    <>
      <div
        ref={dragRef}
        className={`floating-timer ${isExpanded ? 'expanded' : 'collapsed'} ${isDragging ? 'dragging' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          borderColor: getSessionColor()
        }}
        onMouseDown={handleMouseDown}
        onClick={handleTimerClick}
      >
        {!isExpanded ? (
          // Collapsed view - show timer or session icon
          <div className="timer-icon" style={{ backgroundColor: getSessionColor() }}>
            {isRunning ? (
              <span className="timer-countdown">{formatTime(timeLeft)}</span>
            ) : (
              <span className="timer-emoji">{getSessionEmoji()}</span>
            )}
            <div className="timer-progress" style={{
              background: `conic-gradient(${getSessionColor()} ${((getCurrentSessionDuration() - timeLeft) / getCurrentSessionDuration()) * 360}deg, transparent 0deg)`
            }}></div>
          </div>
        ) : (
          // Expanded view - full timer interface
          <div className="timer-expanded">
            <div className="timer-header">
              <div className="session-info">
                <span className="session-emoji">{getSessionEmoji()}</span>
                <span className="session-name">
                  {currentSession === 'work' ? 'Work' : 
                   currentSession === 'shortBreak' ? 'Short Break' : 
                   'Long Break'}
                </span>
              </div>
              <button className="settings-btn" onClick={handleSettingsButtonClick}>
                ⚙️
              </button>
            </div>

            <div className="timer-display">
              <div className="time-text" style={{ color: getSessionColor() }}>
                {formatTime(timeLeft)}
              </div>
              <div className="session-counter">
                Session {sessionCount + 1}
              </div>
            </div>

            <div className="timer-controls">
              <button 
                className={`control-btn ${isRunning ? 'pause' : 'play'}`}
                onClick={(e) => handleControlClick(e, toggleTimer)}
                style={{ backgroundColor: getSessionColor() }}
              >
                {isRunning ? '⏸️' : '▶️'}
              </button>
              <button 
                className="control-btn reset" 
                onClick={(e) => handleControlClick(e, resetTimer)}
              >
                🔄
              </button>
            </div>

            <div className="timer-progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${((getCurrentSessionDuration() - timeLeft) / getCurrentSessionDuration()) * 100}%`,
                  backgroundColor: getSessionColor()
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal would go here */}
      {showModal && (
        <div className="timer-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="timer-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Timer Settings</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="setting-group">
                <label>🍅 Work Duration (minutes)</label>
                <input 
                  type="number" 
                  value={settings.workMinutes}
                  onChange={e => updateSettings({...settings, workMinutes: parseInt(e.target.value)})}
                  min="1" 
                  max="60"
                />
              </div>
              
              <div className="setting-group">
                <label>☕ Short Break (minutes)</label>
                <input 
                  type="number" 
                  value={settings.shortBreakMinutes}
                  onChange={e => updateSettings({...settings, shortBreakMinutes: parseInt(e.target.value)})}
                  min="1" 
                  max="30"
                />
              </div>
              
              <div className="setting-group">
                <label>🌴 Long Break (minutes)</label>
                <input 
                  type="number" 
                  value={settings.longBreakMinutes}
                  onChange={e => updateSettings({...settings, longBreakMinutes: parseInt(e.target.value)})}
                  min="1" 
                  max="60"
                />
              </div>
              
              <div className="setting-group">
                <label>📊 Long Break Interval</label>
                <input 
                  type="number" 
                  value={settings.longBreakInterval}
                  onChange={e => updateSettings({...settings, longBreakInterval: parseInt(e.target.value)})}
                  min="1" 
                  max="10"
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={() => setShowModal(false)}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};