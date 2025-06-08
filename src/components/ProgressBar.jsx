import React from 'react';
import PropTypes from 'prop-types';
import './ProgressBar.css';

const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  showLabel = true,
  label,
  color = '#007bff',
  backgroundColor = '#e9ecef',
  height = 'medium',
  animated = false,
  className = ''
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const progressClasses = [
    'progress-bar',
    `progress-${height}`,
    animated && 'progress-animated',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={progressClasses}>
      {showLabel && (
        <div className="progress-label">
          <span>{label || `${Math.round(percentage)}%`}</span>
          <span className="progress-fraction">{value}/{max}</span>
        </div>
      )}
      
      <div 
        className="progress-track"
        style={{ backgroundColor }}
      >
        <div 
          className="progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color 
          }}
        >
          {animated && <div className="progress-shine"></div>}
        </div>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number,
  showLabel: PropTypes.bool,
  label: PropTypes.string,
  color: PropTypes.string,
  backgroundColor: PropTypes.string,
  height: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool,
  className: PropTypes.string
};

export default ProgressBar;
