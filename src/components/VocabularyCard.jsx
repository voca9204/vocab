import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import AudioPlayer from './AudioPlayer';
import './VocabularyCard.css';

const VocabularyCard = ({ 
  word, 
  pronunciation, 
  definition, 
  example, 
  difficulty,
  onAudioPlay,
  onMarkKnown,
  onMarkUnknown,
  showActions = true,
  flipped = false
}) => {
  const [isFlipped, setIsFlipped] = useState(flipped);
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const getDifficultyColor = (level) => {
    switch(level) {
      case 'easy': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hard': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className={`vocabulary-card ${isFlipped ? 'flipped' : ''}`}>
      <div className="card-inner">
        {/* Front of card */}
        <div className="card-front">
          <div className="card-header">
            <h2 className="word">{word}</h2>
            {difficulty && (
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(difficulty) }}
              >
                {difficulty}
              </span>
            )}
          </div>
          
          {pronunciation && (
            <div className="pronunciation">
              <span className="pronunciation-text">/{pronunciation}/</span>
              <AudioPlayer 
                word={word}
                showControls={false}
                showWaveform={false}
                className="compact"
                onPlay={onAudioPlay}
              />
            </div>
          )}
          
          <Button onClick={handleFlip} variant="secondary" size="small">
            Show Definition
          </Button>
        </div>

        {/* Back of card */}
        <div className="card-back">
          <div className="definition">
            <h3>Definition</h3>
            <p>{definition}</p>
          </div>
          
          {example && (
            <div className="example">
              <h4>Example</h4>
              <p>"{example}"</p>
            </div>
          )}
          
          <div className="card-actions">
            <Button onClick={handleFlip} variant="secondary" size="small">
              Show Word
            </Button>
            
            {showActions && (
              <div className="knowledge-actions">
                <Button 
                  onClick={() => onMarkUnknown?.(word)} 
                  variant="danger" 
                  size="small"
                >
                  Don't Know
                </Button>
                <Button 
                  onClick={() => onMarkKnown?.(word)} 
                  variant="success" 
                  size="small"
                >
                  Know It!
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

VocabularyCard.propTypes = {
  word: PropTypes.string.isRequired,
  pronunciation: PropTypes.string,
  definition: PropTypes.string.isRequired,
  example: PropTypes.string,
  difficulty: PropTypes.oneOf(['easy', 'medium', 'hard']),
  onAudioPlay: PropTypes.func,
  onMarkKnown: PropTypes.func,
  onMarkUnknown: PropTypes.func,
  showActions: PropTypes.bool,
  flipped: PropTypes.bool
};

export default VocabularyCard;
