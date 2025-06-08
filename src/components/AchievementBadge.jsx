import React from 'react';
import PropTypes from 'prop-types';
import './AchievementBadge.css';

const AchievementBadge = ({
  title,
  description,
  icon,
  earned = false,
  rarity = 'common',
  progress = 0,
  maxProgress = 100,
  showProgress = false,
  size = 'medium',
  animated = false,
  className = '',
  onClick,
  ...props
}) => {
  const badgeClasses = [
    'achievement-badge',
    `badge-${rarity}`,
    `badge-${size}`,
    earned && 'badge-earned',
    !earned && 'badge-locked',
    animated && 'badge-animated',
    onClick && 'badge-clickable',
    className
  ].filter(Boolean).join(' ');

  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  return (
    <div
      className={badgeClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      <div className="badge-container">
        {/* Badge Icon */}
        <div className="badge-icon-wrapper">
          <div className="badge-icon">
            {icon || '🏆'}
          </div>
          {earned && <div className="badge-shine"></div>}
        </div>

        {/* Badge Content */}
        <div className="badge-content">
          <h3 className="badge-title">{title}</h3>
          {description && (
            <p className="badge-description">{description}</p>
          )}
          
          {/* Progress Bar */}
          {showProgress && !earned && (
            <div className="badge-progress">
              <div className="badge-progress-bar">
                <div 
                  className="badge-progress-fill"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <span className="badge-progress-text">
                {progress}/{maxProgress}
              </span>
            </div>
          )}
        </div>

        {/* Rarity Indicator */}
        <div className="badge-rarity-indicator">
          <span className="badge-rarity-text">{rarity}</span>
        </div>

        {/* Lock Overlay for unearned badges */}
        {!earned && (
          <div className="badge-lock-overlay">
            <div className="badge-lock-icon">🔒</div>
          </div>
        )}
      </div>
    </div>
  );
};

AchievementBadge.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  icon: PropTypes.node,
  earned: PropTypes.bool,
  rarity: PropTypes.oneOf(['common', 'rare', 'epic', 'legendary']),
  progress: PropTypes.number,
  maxProgress: PropTypes.number,
  showProgress: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default AchievementBadge;