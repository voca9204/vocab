import React from 'react';
import PropTypes from 'prop-types';
import './FormGroup.css';

const FormGroup = ({
  children,
  label,
  error,
  helperText,
  required = false,
  className = '',
  direction = 'column',
  spacing = 'medium',
  id,
  ...props
}) => {
  const groupId = id || `form-group-${Math.random().toString(36).substr(2, 9)}`;
  
  const containerClasses = [
    'form-group',
    `form-group-${direction}`,
    `form-group-spacing-${spacing}`,
    error && 'error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses} {...props}>
      {label && (
        <label htmlFor={groupId} className="form-group-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className="form-group-content">
        {children}
      </div>
      
      {error && (
        <div className="form-group-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div className="form-group-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

FormGroup.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  className: PropTypes.string,
  direction: PropTypes.oneOf(['row', 'column']),
  spacing: PropTypes.oneOf(['small', 'medium', 'large']),
  id: PropTypes.string
};

export default FormGroup;
