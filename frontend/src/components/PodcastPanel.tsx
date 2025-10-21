import React, { useState, useRef, useEffect } from 'react';
import { API_BASE } from '../config';
import '../styles/PodcastPanel.css';

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

interface AudioLine {
  index: number;
  speaker: number;
  text: string;
  voice: string;
  audio_size: number;
  audio_path?: string;
  error?: string;
}

interface AudioGenerationResponse {
  script_id: string;
  total_lines: number;
  generated_count: number;
  failed_count: number;
  audio_lines: AudioLine[];
  combined_audio_url?: string;
}

export const PodcastPanel: React.FC<PodcastPanelProps> = ({ token, documentId }) => {
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [voiceOption, setVoiceOption] = useState<'male-male' | 'female-female' | 'male-female'>('male-female');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioLines, setAudioLines] = useState<AudioLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [audioGenerationProgress, setAudioGenerationProgress] = useState<string>('');
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
    setAudioGenerationProgress('Initializing audio generation...');
    
    try {
      const response = await fetch(`${API_BASE}/documents/podcast/${script.id}/generate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          save_to_disk: true,
        }),
      });

      if (response.ok) {
        const data: AudioGenerationResponse = await response.json();
        setAudioLines(data.audio_lines);
        
        if (data.failed_count > 0) {
          alert(`Audio generated with ${data.failed_count} failures out of ${data.total_lines} lines.`);
        } else {
          setAudioGenerationProgress(`Successfully generated ${data.generated_count} audio lines!`);
        }
        
        // Auto-play first line
        if (data.audio_lines.length > 0 && !data.audio_lines[0].error) {
          setCurrentLineIndex(0);
          // Wait a bit for UI to update, then play
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play();
              setIsPlaying(true);
            }
          }, 500);
        }
      } else {
        const errorText = await response.text();
        console.error('Failed to generate audio:', errorText);
        alert('Failed to generate audio. Please try again.');
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Error generating audio. Please check your connection.');
    } finally {
      setIsGeneratingAudio(false);
      setTimeout(() => setAudioGenerationProgress(''), 3000);
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

  const playNextLine = () => {
    if (currentLineIndex < audioLines.length - 1) {
      const nextIndex = currentLineIndex + 1;
      setCurrentLineIndex(nextIndex);
      setIsPlaying(true);
      // Audio will auto-play via useEffect when src changes
    } else {
      // Reached end of podcast
      setIsPlaying(false);
      setCurrentLineIndex(0);
    }
  };

  const playPreviousLine = () => {
    if (currentLineIndex > 0) {
      const prevIndex = currentLineIndex - 1;
      setCurrentLineIndex(prevIndex);
      setIsPlaying(true);
    }
  };

  const jumpToLine = (index: number) => {
    if (index >= 0 && index < audioLines.length && !audioLines[index].error) {
      setCurrentLineIndex(index);
      setIsPlaying(true);
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
      const handleEnded = () => {
        setIsPlaying(false);
        // Auto-play next line when current line ends
        playNextLine();
      };
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentLineIndex, audioLines]);

  // Auto-play when line changes
  useEffect(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    }
  }, [currentLineIndex]);

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
            {script.dialogue.map((line, index) => {
              const isCurrentLine = audioLines.length > 0 && currentLineIndex === index;
              const hasAudio = audioLines[index] && !audioLines[index].error;
              const hasError = audioLines[index]?.error;
              
              return (
                <div 
                  key={index} 
                  className={`dialogue-line speaker-${line.speaker} ${isCurrentLine ? 'playing' : ''} ${hasAudio ? 'has-audio' : ''}`}
                  onClick={() => hasAudio ? jumpToLine(index) : null}
                  style={{ cursor: hasAudio ? 'pointer' : 'default' }}
                >
                  <div className="line-number">
                    {hasAudio && '🔊'}
                    {hasError && '❌'}
                    {!audioLines[index] && audioLines.length > 0 && '⏳'}
                  </div>
                  <div className="speaker-label">
                    {line.speaker === 1 ? script.speaker1 : script.speaker2}
                  </div>
                  <div className="dialogue-text">{line.text}</div>
                </div>
              );
            })}
          </div>

          {/* Generation Progress */}
          {audioGenerationProgress && (
            <div className="generation-progress">
              {audioGenerationProgress}
            </div>
          )}

          {/* Audio Player */}
          {audioLines.length > 0 && (
            <div className="audio-player">
              <audio 
                ref={audioRef} 
                src={`${API_BASE}/documents/audio/stream/${script.id}/${currentLineIndex}`}
                autoPlay={isPlaying}
              />
              <div className="player-header">
                <div className="now-playing">
                  <span className="now-playing-label">Now Playing:</span>
                  <span className="now-playing-text">
                    Line {currentLineIndex + 1} of {audioLines.length} - {audioLines[currentLineIndex]?.voice}
                  </span>
                </div>
              </div>
              <div className="player-controls">
                <button 
                  className="prev-btn" 
                  onClick={playPreviousLine}
                  disabled={currentLineIndex === 0}
                >
                  ⏮️
                </button>
                <button className="play-pause-btn" onClick={playPause}>
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                <button 
                  className="next-btn" 
                  onClick={playNextLine}
                  disabled={currentLineIndex >= audioLines.length - 1}
                >
                  ⏭️
                </button>
                <div className="progress-container">
                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
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