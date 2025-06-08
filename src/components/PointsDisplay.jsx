import React from 'react';
import PropTypes from 'prop-types';
import './PointsDisplay.css';

const PointsDisplay = ({
  currentPoints = 0,
  totalPoints = 0,
  level = 1,
  nextLevelPoints = 100,
  showLevel = true,
  showProgress = true,
  animated = false,
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}) => {
  const pointsToNextLevel = nextLevelPoints - currentPoints;
  const progressPercentage = Math.min((currentPoints / nextLevelPoints) * 100, 100);
  
  const displayClasses = [
    'points-display',
    `points-${variant}`,
    `points-${size}`,
    animated && 'points-animated',
    className
  ].filter(Boolean).join(' ');

  const formatPoints = (points) => {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  };

  return (
    <div className={displayClasses} {...props}>
      {/* Main Points Display */}
      <div className="points-main">
        <div className="points-icon">⭐</div>
        <div className="points-info">
          <div className="points-current">
            <span className="points-number">{formatPoints(currentPoints)}</span>
            <span className="points-label">Points</span>
          </div>
          {totalPoints > 0 && (
            <div className="points-total">
              Total: {formatPoints(totalPoints)}
            </div>
          )}
        </div>
      </div>

      {/* Level Information */}
      {showLevel && (
        <div className="points-level">
          <div className="level-badge">
            <span className="level-number">Lv.{level}</span>
          </div>
          {pointsToNextLevel > 0 && (
            <div className="level-next">
              {formatPoints(pointsToNextLevel)} to next level
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {showProgress && pointsToNextLevel > 0 && (
        <div className="points-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="progress-shine"></div>
            </div>
          </div>
          <div className="progress-text">
            {currentPoints} / {nextLevelPoints} XP
          </div>
        </div>
      )}
    </div>
  );
};

PointsDisplay.propTypes = {
  currentPoints: PropTypes.number,
  totalPoints: PropTypes.number,
  level: PropTypes.number,
  nextLevelPoints: PropTypes.number,
  showLevel: PropTypes.bool,
  showProgress: PropTypes.bool,
  animated: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'compact', 'detailed']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};

export default PointsDisplay;