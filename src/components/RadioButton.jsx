import React from 'react';
import PropTypes from 'prop-types';
import './RadioButton.css';

const RadioButton = ({
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
  id,
  name,
  value,
  ...props
}) => {
  const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };
  
  const containerClasses = [
    'radio-container',
    `radio-${size}`,
    `radio-${variant}`,
    disabled && 'disabled',
    error && 'error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses}>
      <div className="radio-wrapper">
        <label htmlFor={radioId} className="radio-label">
          <input
            id={radioId}
            type="radio"
            checked={checked}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            name={name}
            value={value}
            className="radio-input"
            aria-invalid={!!error}
            aria-describedby={
              error ? `${radioId}-error` : 
              helperText ? `${radioId}-helper` : undefined
            }
            {...props}
          />
          
          <span className="radio-circle">
            <span className="radio-dot"></span>
          </span>
          
          {label && (
            <span className="radio-text">
              {label}
              {required && <span className="required-asterisk">*</span>}
            </span>
          )}
        </label>
      </div>
      
      {error && (
        <div id={`${radioId}-error`} className="radio-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${radioId}-helper`} className="radio-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

RadioButton.propTypes = {
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
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default RadioButton;

// RadioGroup component for managing multiple radio buttons
export const RadioGroup = ({
  name,
  value,
  onChange,
  options = [],
  label,
  direction = 'column',
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  size = 'medium',
  variant = 'primary'
}) => {
  const groupId = `radio-group-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleChange = (optionValue) => {
    if (onChange) {
      onChange(optionValue);
    }
  };
  
  const groupClasses = [
    'radio-group',
    `radio-group-${direction}`,
    disabled && 'disabled',
    error && 'error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={groupClasses}>
      {label && (
        <div className="radio-group-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </div>
      )}
      
      <div className="radio-group-options">
        {options.map((option, index) => (
          <RadioButton
            key={option.value}
            id={`${groupId}-${index}`}
            name={name}
            value={option.value}
            label={option.label}
            checked={value === option.value}
            onChange={() => handleChange(option.value)}
            disabled={disabled || option.disabled}
            size={size}
            variant={variant}
          />
        ))}
      </div>
      
      {error && (
        <div className="radio-group-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div className="radio-group-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

RadioGroup.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool
  })),
  label: PropTypes.string,
  direction: PropTypes.oneOf(['row', 'column']),
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger'])
};
