import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './AudioPlayer.css';

const AudioPlayer = ({ 
  word,
  audioUrl,
  autoPlay = false,
  showControls = true,
  showWaveform = true,
  onPlay,
  onPause,
  onEnd,
  className = ''
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState(null);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Initialize audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onEnd) onEnd();
    };

    const handleError = (e) => {
      setError('Error loading audio');
      setIsLoading(false);
      console.error('Audio error:', e);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);

    // Auto play if enabled
    if (autoPlay && audioUrl) {
      handlePlay();
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, [audioUrl, autoPlay, onEnd]);

  // Handle play/pause
  const handlePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audioUrl) {
        // Use provided audio URL
        audio.src = audioUrl;
      } else if (word && 'speechSynthesis' in window) {
        // Use TTS as fallback
        await playTTS(word);
        return;
      } else {
        throw new Error('No audio source available');
      }

      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        if (onPause) onPause();
      } else {
        await audio.play();
        setIsPlaying(true);
        if (onPlay) onPlay();
      }
    } catch (err) {
      setError('Playback failed');
      console.error('Playback error:', err);
    }
  };

  // TTS fallback
  const playTTS = async (text) => {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackRate;
      utterance.volume = volume;
      utterance.pitch = 1;

      utterance.onstart = () => {
        setIsPlaying(true);
        if (onPlay) onPlay();
      };

      utterance.onend = () => {
        setIsPlaying(false);
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = (error) => {
        setIsPlaying(false);
        setError('TTS failed');
        reject(error);
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  // Handle progress bar click
  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (x / width) * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Handle playback rate change
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Format time
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const playerClasses = [
    'audio-player',
    isPlaying && 'playing',
    isLoading && 'loading',
    error && 'error',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={playerClasses}>
      <audio ref={audioRef} preload="metadata" />
      
      {/* Main play button */}
      <div className="audio-controls">
        <Button
          variant="primary"
          size="small"
          onClick={handlePlay}
          loading={isLoading}
          disabled={!!error}
          className="play-button"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </Button>
        
        {word && (
          <span className="audio-word">{word}</span>
        )}
      </div>

      {/* Extended controls */}
      {showControls && (
        <div className="audio-extended-controls">
          {/* Progress bar */}
          <div className="progress-container">
            <span className="time-display">{formatTime(currentTime)}</span>
            <div 
              className="progress-bar"
              ref={progressRef}
              onClick={handleProgressClick}
            >
              <div 
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
              <div 
                className="progress-handle"
                style={{ left: `${progressPercentage}%` }}
              />
            </div>
            <span className="time-display">{formatTime(duration)}</span>
          </div>

          {/* Additional controls */}
          <div className="audio-additional-controls">
            {/* Volume control */}
            <div className="volume-control">
              <span className="control-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            {/* Playback rate */}
            <div className="playback-rate-control">
              <span className="control-label">Speed:</span>
              {[0.5, 0.75, 1, 1.25, 1.5].map(rate => (
                <button
                  key={rate}
                  onClick={() => handlePlaybackRateChange(rate)}
                  className={`rate-button ${playbackRate === rate ? 'active' : ''}`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Waveform visualization (placeholder) */}
      {showWaveform && (
        <div className="waveform-container">
          <div className="waveform">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={i}
                className={`waveform-bar ${isPlaying ? 'animated' : ''}`}
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="audio-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

AudioPlayer.propTypes = {
  word: PropTypes.string,
  audioUrl: PropTypes.string,
  autoPlay: PropTypes.bool,
  showControls: PropTypes.bool,
  showWaveform: PropTypes.bool,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onEnd: PropTypes.func,
  className: PropTypes.string
};

export default AudioPlayer;
