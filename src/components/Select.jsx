import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Select.css';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  size = 'medium',
  variant = 'outlined',
  searchable = false,
  multiple = false,
  id,
  name,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const selectRef = useRef(null);
  const optionsRef = useRef(null);
  const inputRef = useRef(null);
  
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  // Filter options based on search term
  const filteredOptions = searchable 
    ? options.filter(option => 
        option.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;
  
  // Get display value
  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return '';
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0]);
        return option ? option.label : value[0];
      }
      return `${value.length} items selected`;
    }
    
    const option = options.find(opt => opt.value === value);
    return option ? option.label : value || '';
  };
  
  // Handle option select
  const handleOptionSelect = (optionValue) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(optionValue);
      
      if (index >= 0) {
        newValue.splice(index, 1);
      } else {
        newValue.push(optionValue);
      }
      
      if (onChange) onChange({ target: { value: newValue, name } });
    } else {
      if (onChange) onChange({ target: { value: optionValue, name } });
      setIsOpen(false);
      setSearchTerm('');
    }
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          handleOptionSelect(filteredOptions[focusedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      default:
        if (searchable && isOpen) {
          // Let the search input handle the keystroke
        }
        break;
    }
  };
  
  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Reset focused index when options change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchTerm]);
  
  const containerClasses = [
    'select-container',
    `select-${variant}`,
    `select-${size}`,
    isOpen && 'open',
    disabled && 'disabled',
    error && 'error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses} ref={selectRef}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}
      
      <div 
        className="select-control"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={!!error}
        aria-describedby={
          error ? `${selectId}-error` : 
          helperText ? `${selectId}-helper` : undefined
        }
      >
        <div className="select-value">
          {getDisplayValue() || placeholder}
        </div>
        <div className="select-arrow">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {isOpen && (
        <div className="select-dropdown" ref={optionsRef}>
          {searchable && (
            <div className="select-search">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="select-search-input"
                autoFocus
              />
            </div>
          )}
          
          <ul className="select-options" role="listbox">
            {filteredOptions.length === 0 ? (
              <li className="select-option no-options">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = multiple 
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value;
                const isFocused = index === focusedIndex;
                
                return (
                  <li
                    key={option.value}
                    className={`select-option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                    onClick={() => handleOptionSelect(option.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {multiple && (
                      <span className={`select-checkbox ${isSelected ? 'checked' : ''}`}>
                        {isSelected && '✓'}
                      </span>
                    )}
                    <span className="select-option-label">{option.label}</span>
                    {option.description && (
                      <span className="select-option-description">{option.description}</span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
      
      {error && (
        <div id={`${selectId}-error`} className="select-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${selectId}-helper`} className="select-helper">
          {helperText}
        </div>
      )}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array
  ]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string
  })),
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  error: PropTypes.string,
  helperText: PropTypes.string,
  className: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  searchable: PropTypes.bool,
  multiple: PropTypes.bool,
  id: PropTypes.string,
  name: PropTypes.string
};

export default Select;
