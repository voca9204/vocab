import React from 'react';
import PropTypes from 'prop-types';
import './Checkbox.css';

const Checkbox = ({
  checked = false,
  onChange,
  label,
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  size = 'medium',
  variant = 'primary',
  indeterminate = false,
  id,
  name,
  value,
  ...props
}) => {
  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };
  
  const containerClasses = [
    'checkbox-container',
    `checkbox-${size}`,
    `checkbox-${variant}`,
    disabled && 'disabled',
    error && 'error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses}>
      <div className="checkbox-wrapper">
        <label htmlFor={checkboxId} className="checkbox-label">
          <input
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            name={name}
            value={value}
            className="checkbox-input"
            aria-invalid={!!error}
            aria-describedby={
              error ? `${checkboxId}-error` : 
              helperText ? `${checkboxId}-helper` : undefined
            }
            {...props}
          />
          
          <span className={`checkbox-box ${indeterminate ? 'indeterminate' : ''}`}>
            {checked && !indeterminate && (
              <svg className="checkbox-check" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            
            {indeterminate && (
              <svg className="checkbox-indeterminate" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
          </span>
          
          {label && (
            <span className="checkbox-text">
              {label}
              {required && <span className="required-asterisk">*</span>}
            </span>
          )}
        </label>
      </div>
      
      {error && (
        <div id={`${checkboxId}-error`} className="checkbox-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${checkboxId}-helper`} className="checkbox-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

Checkbox.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  label: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger']),
  indeterminate: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default Checkbox;
