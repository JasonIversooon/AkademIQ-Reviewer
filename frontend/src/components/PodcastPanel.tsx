import React, { useState, useRef, useEffect } from 'react';
import '../styles/PodcastPanel.css';

// Use same API base as other components
const API_BASE = 'http://localhost:8000';

interface PodcastPanelProps {
  token: string;
  documentId: string;
}

interface PodcastScript {
  id: string;
  speaker1: string;
  speaker2: string;
  dialogue: Array<{
    speaker: 1 | 2;
    text: string;
  }>;
  audioUrl?: string;
}

export const PodcastPanel: React.FC<PodcastPanelProps> = ({ token, documentId }) => {
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [voiceOption, setVoiceOption] = useState<'male-male' | 'female-female' | 'male-female'>('male-female');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateScript = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/documents/${documentId}/generate-podcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voice_option: voiceOption,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScript(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to generate podcast script:', errorText);
        alert('Failed to generate podcast script. Please try again.');
      }
    } catch (error) {
      console.error('Error generating podcast script:', error);
      alert('Error generating podcast script. Please check your connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAudio = async () => {
    if (!script) return;
    
    setIsGeneratingAudio(true);
    try {
      // TODO: Implement TTS API call
      // This will be implemented when you add the TTS API
      const response = await fetch(`${API_BASE}/documents/${documentId}/generate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_id: script.id,
          voice_option: voiceOption,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScript(prev => prev ? { ...prev, audioUrl: data.audio_url } : null);
      } else {
        console.error('Failed to generate audio');
        alert('Audio generation coming soon!');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Audio generation coming soon!');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const regenerateScript = () => {
    setScript(null);
    generateScript();
  };

  const playPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, [script]);

  return (
    <div className="podcast-container">
      {/* Header */}
      <div className="podcast-header">
        <div className="section-info">
          <h2>🎙️ AI Podcast Generator</h2>
          <p className="section-description">Generate a conversational podcast from your document</p>
        </div>
        {script && (
          <div className="header-controls">
            <button className="regenerate-btn" onClick={regenerateScript}>
              🔄 Regenerate Script
            </button>
            <button 
              className="listen-btn" 
              onClick={generateAudio}
              disabled={isGeneratingAudio}
            >
              {isGeneratingAudio ? (
                <>
                  <div className="spinner"></div>
                  Generating Audio...
                </>
              ) : (
                <>
                  🎧 Listen
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Voice Options */}
      <div className="voice-options">
        <h3>Voice Configuration</h3>
        <div className="voice-selector">
          <div 
            className={`voice-option ${voiceOption === 'male-male' ? 'selected' : ''}`}
            onClick={() => setVoiceOption('male-male')}
          >
            <div className="voice-icon">👨‍🎤👨‍🎤</div>
            <span>Male - Male</span>
          </div>
          <div 
            className={`voice-option ${voiceOption === 'female-female' ? 'selected' : ''}`}
            onClick={() => setVoiceOption('female-female')}
          >
            <div className="voice-icon">👩‍🎤👩‍🎤</div>
            <span>Female - Female</span>
          </div>
          <div 
            className={`voice-option ${voiceOption === 'male-female' ? 'selected' : ''}`}
            onClick={() => setVoiceOption('male-female')}
          >
            <div className="voice-icon">👨‍🎤👩‍🎤</div>
            <span>Male - Female</span>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      {!script && (
        <div className="generate-section">
          <button 
            className="generate-btn" 
            onClick={generateScript}
            disabled={isGenerating || !documentId}
          >
            {isGenerating ? (
              <>
                <div className="spinner"></div>
                Generating Podcast Script...
              </>
            ) : (
              <>
                🎬 Generate Podcast Script
              </>
            )}
          </button>
          {!documentId && (
            <p className="error-message">Please upload a document first</p>
          )}
        </div>
      )}

      {/* Script Display */}
      {script && (
        <div className="script-section">
          <div className="script-header">
            <h3>📜 Podcast Script</h3>
            <div className="speakers-info">
              <span className="speaker speaker-1">{script.speaker1}</span>
              <span className="speaker speaker-2">{script.speaker2}</span>
            </div>
          </div>
          
          <div className="script-content">
            {script.dialogue.map((line, index) => (
              <div key={index} className={`dialogue-line speaker-${line.speaker}`}>
                <div className="speaker-label">
                  {line.speaker === 1 ? script.speaker1 : script.speaker2}
                </div>
                <div className="dialogue-text">{line.text}</div>
              </div>
            ))}
          </div>

          {/* Audio Player */}
          {script.audioUrl && (
            <div className="audio-player">
              <audio ref={audioRef} src={script.audioUrl} />
              <div className="player-controls">
                <button className="play-pause-btn" onClick={playPause}>
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <div className="progress-container">
                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};