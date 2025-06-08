import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './TextInput.css';

const TextInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  size = 'medium',
  variant = 'outlined',
  startIcon,
  endIcon,
  maxLength,
  autoComplete,
  autoFocus = false,
  id,
  name,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    if (props.onBlur) props.onBlur(e);
  };
  
  const handleChange = (e) => {
    if (onChange) onChange(e);
  };
  
  const containerClasses = [
    'text-input-container',
    `text-input-${variant}`,
    `text-input-${size}`,
    isFocused && 'focused',
    disabled && 'disabled',
    error && 'error',
    value && 'has-value',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="text-input-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div className="text-input-wrapper">
        {startIcon && (
          <span className="text-input-icon start-icon">
            {startIcon}
          </span>
        )}
        
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type={type}
          value={value || ''}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className="text-input-field"
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : 
            helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        
        {endIcon && (
          <span className="text-input-icon end-icon">
            {endIcon}
          </span>
        )}
      </div>
      
      {error && (
        <div id={`${inputId}-error`} className="text-input-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${inputId}-helper`} className="text-input-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

TextInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  type: PropTypes.oneOf(['text', 'password', 'email', 'number', 'tel', 'url', 'search']),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  maxLength: PropTypes.number,
  autoComplete: PropTypes.string,
  autoFocus: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func
};

export default TextInput;
