import React from 'react';
import PropTypes from 'prop-types';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#007bff', 
  text,
  className = '',
  fullScreen = false 
}) => {
  const spinnerClasses = [
    'loading-spinner',
    `spinner-${size}`,
    fullScreen && 'spinner-fullscreen',
    className
  ].filter(Boolean).join(' ');

  const spinner = (
    <div className={spinnerClasses}>
      <div 
        className="spinner" 
        style={{ borderTopColor: color }}
      ></div>
      {text && <p className="spinner-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="spinner-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.string,
  text: PropTypes.string,
  className: PropTypes.string,
  fullScreen: PropTypes.bool
};

export default LoadingSpinner;
