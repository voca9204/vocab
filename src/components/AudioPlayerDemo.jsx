import React, { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import Button from './Button';

const AudioPlayerDemo = () => {
  const [selectedWord, setSelectedWord] = useState('vocabulary');
  const [showControls, setShowControls] = useState(true);
  const [showWaveform, setShowWaveform] = useState(true);

  const sampleWords = [
    { word: 'vocabulary', pronunciation: 'vəˈkabyəˌlerē' },
    { word: 'pronunciation', pronunciation: 'prəˌnənsēˈāSH(ə)n' },
    { word: 'eloquent', pronunciation: 'ˈeləkwənt' },
    { word: 'sophisticated', pronunciation: 'səˈfistəˌkādəd' },
    { word: 'pronunciation', pronunciation: 'prəˌnənsēˈāSH(ə)n' }
  ];

  const handleWordSelect = (word) => {
    setSelectedWord(word);
  };

  const handlePlayCallback = () => {
    console.log(`Playing audio for: ${selectedWord}`);
  };

  const handlePauseCallback = () => {
    console.log(`Paused audio for: ${selectedWord}`);
  };

  const handleEndCallback = () => {
    console.log(`Finished playing: ${selectedWord}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>AudioPlayer Component Demo</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Select a word to hear:</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {sampleWords.map((item, index) => (
            <Button
              key={index}
              variant={selectedWord === item.word ? 'primary' : 'secondary'}
              size="small"
              onClick={() => handleWordSelect(item.word)}
            >
              {item.word}
            </Button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Full-Featured AudioPlayer</h2>
        <AudioPlayer
          word={selectedWord}
          showControls={showControls}
          showWaveform={showWaveform}
          onPlay={handlePlayCallback}
          onPause={handlePauseCallback}
          onEnd={handleEndCallback}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Compact AudioPlayer</h2>
        <AudioPlayer
          word={selectedWord}
          showControls={false}
          showWaveform={false}
          className="compact"
          onPlay={handlePlayCallback}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Settings</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showControls}
              onChange={(e) => setShowControls(e.target.checked)}
            />
            Show Extended Controls
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={showWaveform}
              onChange={(e) => setShowWaveform(e.target.checked)}
            />
            Show Waveform
          </label>
        </div>
      </div>

      <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>AudioPlayer Features:</h3>
        <ul>
          <li>Text-to-Speech synthesis as fallback</li>
          <li>Custom audio URL support</li>
          <li>Progress bar with seeking</li>
          <li>Volume control</li>
          <li>Playback speed adjustment (0.5x - 1.5x)</li>
          <li>Animated waveform visualization</li>
          <li>Error handling and loading states</li>
          <li>Responsive design and accessibility</li>
          <li>Compact mode for integration</li>
          <li>Dark mode support</li>
        </ul>
      </div>
    </div>
  );
};

export default AudioPlayerDemo;
