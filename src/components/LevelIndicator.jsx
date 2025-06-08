import React from 'react';
import PropTypes from 'prop-types';
import './LevelIndicator.css';

const LevelIndicator = ({
  currentLevel = 1,
  currentXP = 0,
  nextLevelXP = 100,
  showProgress = true,
  showNumbers = true,
  variant = 'default',
  size = 'medium',
  animated = false,
  className = '',
  ...props
}) => {
  const progressPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);
  const remainingXP = nextLevelXP - currentXP;
  
  const indicatorClasses = [
    'level-indicator',
    `level-${variant}`,
    `level-${size}`,
    animated && 'level-animated',
    className
  ].filter(Boolean).join(' ');

  const getLevelColor = (level) => {
    if (level < 5) return '#28a745'; // Green
    if (level < 10) return '#17a2b8'; // Cyan
    if (level < 20) return '#6f42c1'; // Purple
    if (level < 30) return '#e83e8c'; // Pink
    if (level < 50) return '#fd7e14'; // Orange
    return '#dc3545'; // Red for high levels
  };

  const getLevelTitle = (level) => {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Learner';
    if (level < 20) return 'Student';
    if (level < 30) return 'Scholar';
    if (level < 50) return 'Expert';
    return 'Master';
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className={indicatorClasses} {...props}>
      {/* Level Badge */}
      <div 
        className="level-badge"
        style={{ 
          backgroundColor: getLevelColor(currentLevel),
          boxShadow: `0 0 20px ${getLevelColor(currentLevel)}40`
        }}
      >
        <div className="level-number">{currentLevel}</div>
        <div className="level-title">{getLevelTitle(currentLevel)}</div>
      </div>

      {/* Progress Section */}
      {showProgress && (
        <div className="level-progress">
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-track">
              <div 
                className="progress-bar"
                style={{ 
                  width: `${progressPercentage}%`,
                  backgroundColor: getLevelColor(currentLevel)
                }}
              >
                <div className="progress-glow"></div>
              </div>
            </div>
            {/* Progress Labels */}
            {showNumbers && (
              <div className="progress-labels">
                <span className="current-xp">{formatNumber(currentXP)}</span>
                <span className="next-level-xp">{formatNumber(nextLevelXP)}</span>
              </div>
            )}
          </div>
          
          {/* XP Info */}
          {showNumbers && (
            <div className="xp-info">
              <div className="xp-remaining">
                {formatNumber(remainingXP)} XP to next level
              </div>
              <div className="xp-percentage">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

LevelIndicator.propTypes = {
  currentLevel: PropTypes.number,
  currentXP: PropTypes.number,
  nextLevelXP: PropTypes.number,
  showProgress: PropTypes.bool,
  showNumbers: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact', 'minimal']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool,
  className: PropTypes.string
};

export default LevelIndicator;