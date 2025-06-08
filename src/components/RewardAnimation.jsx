import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './RewardAnimation.css';

const RewardAnimation = ({
  isVisible = false,
  type = 'points',
  value = 0,
  message = '',
  duration = 3000,
  onComplete,
  className = '',
  ...props
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // Show fireworks for big rewards
      if (type === 'levelUp' || value >= 100) {
        setShowFireworks(true);
      }
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShowFireworks(false);
        onComplete && onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onComplete, type, value]);

  const getRewardIcon = () => {
    switch (type) {
      case 'points': return '⭐';
      case 'badge': return '🏆';
      case 'levelUp': return '🎉';
      case 'streak': return '🔥';
      case 'achievement': return '🏅';
      default: return '✨';
    }
  };

  const getRewardColor = () => {
    switch (type) {
      case 'points': return '#ffd700';
      case 'badge': return '#ff6b35';
      case 'levelUp': return '#6c5ce7';
      case 'streak': return '#fd79a8';
      case 'achievement': return '#00b894';
      default: return '#74b9ff';
    }
  };

  const formatValue = (val) => {
    if (type === 'points' && val >= 1000) {
      return `+${(val / 1000).toFixed(1)}K`;
    }
    return type === 'points' ? `+${val}` : val;
  };

  if (!isVisible && !isAnimating) return null;

  const animationClasses = [
    'reward-animation',
    `reward-${type}`,
    isAnimating && 'reward-active',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={animationClasses} {...props}>
      {/* Fireworks Background */}
      {showFireworks && (
        <div className="fireworks-container">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`firework firework-${i + 1}`}>
              {[...Array(8)].map((_, j) => (
                <div key={j} className="firework-spark"></div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Main Reward Display */}
      <div className="reward-main" style={{ color: getRewardColor() }}>
        <div className="reward-icon">{getRewardIcon()}</div>
        
        {value > 0 && (
          <div className="reward-value">
            {formatValue(value)}
          </div>
        )}
        
        {message && (
          <div className="reward-message">{message}</div>
        )}
        
        {/* Floating particles */}
        <div className="particles-container">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="particle"
              style={{
                '--delay': `${i * 0.1}s`,
                '--angle': `${i * 30}deg`,
                backgroundColor: getRewardColor()
              }}
            ></div>
          ))}
        </div>
        
        {/* Shine effect */}
        <div className="reward-shine"></div>
      </div>

      {/* Overlay */}
      <div className="reward-overlay"></div>
    </div>
  );
};

RewardAnimation.propTypes = {
  isVisible: PropTypes.bool,
  type: PropTypes.oneOf(['points', 'badge', 'levelUp', 'streak', 'achievement']),
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  message: PropTypes.string,
  duration: PropTypes.number,
  onComplete: PropTypes.func,
  className: PropTypes.string
};

export default RewardAnimation;