import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import Button from './Button';
import './Form.css';

const Form = ({
  children,
  onSubmit,
  validation = {},
  className = '',
  layout = 'vertical',
  spacing = 'medium',
  showSubmitButton = true,
  submitButtonText = 'Submit',
  submitButtonProps = {},
  resetOnSubmit = false,
  disabled = false,
  ...props
}) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validate single field
  const validateField = useCallback((name, value) => {
    const fieldValidation = validation[name];
    if (!fieldValidation) return '';
    
    // Required validation
    if (fieldValidation.required && (!value || value.toString().trim() === '')) {
      return fieldValidation.requiredMessage || `${name} is required`;
    }
    
    // Min length validation
    if (fieldValidation.minLength && value && value.toString().length < fieldValidation.minLength) {
      return fieldValidation.minLengthMessage || `${name} must be at least ${fieldValidation.minLength} characters`;
    }
    
    // Max length validation
    if (fieldValidation.maxLength && value && value.toString().length > fieldValidation.maxLength) {
      return fieldValidation.maxLengthMessage || `${name} must be no more than ${fieldValidation.maxLength} characters`;
    }
    
    // Pattern validation
    if (fieldValidation.pattern && value && !fieldValidation.pattern.test(value.toString())) {
      return fieldValidation.patternMessage || `${name} format is invalid`;
    }
    
    // Custom validation
    if (fieldValidation.custom && typeof fieldValidation.custom === 'function') {
      const result = fieldValidation.custom(value, values);
      if (result !== true && typeof result === 'string') {
        return result;
      }
    }
    
    return '';
  }, [validation, values]);
  
  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;
    
    Object.keys(validation).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  }, [validation, values, validateField]);
  
  // Handle field change
  const handleFieldChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error if field becomes valid
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);
  
  // Handle field blur
  const handleFieldBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [values, validateField]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (disabled || isSubmitting) return;
    
    // Mark all fields as touched
    const allFieldNames = Object.keys(validation);
    const newTouched = {};
    allFieldNames.forEach(name => {
      newTouched[name] = true;
    });
    setTouched(newTouched);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(values, { setErrors, setValues });
      }
      
      if (resetOnSubmit) {
        setValues({});
        setErrors({});
        setTouched({});
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset form
  const resetForm = useCallback(() => {
    setValues({});
    setErrors({});
    setTouched({});
  }, []);
  
  // Form context value
  const formContext = {
    values,
    errors,
    touched,
    isSubmitting,
    disabled: disabled || isSubmitting,
    handleFieldChange,
    handleFieldBlur,
    resetForm
  };
  
  const formClasses = [
    'form',
    `form-${layout}`,
    `form-spacing-${spacing}`,
    disabled && 'disabled',
    isSubmitting && 'submitting',
    className
  ].filter(Boolean).join(' ');
  
  // Enhanced children with form context
  const enhancedChildren = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { formContext });
    }
    return child;
  });
  
  return (
    <form className={formClasses} onSubmit={handleSubmit} {...props}>
      <div className="form-content">
        {enhancedChildren}
      </div>
      
      {showSubmitButton && (
        <div className="form-actions">
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={disabled}
            {...submitButtonProps}
          >
            {submitButtonText}
          </Button>
        </div>
      )}
    </form>
  );
};

Form.propTypes = {
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func,
  validation: PropTypes.objectOf(PropTypes.shape({
    required: PropTypes.bool,
    requiredMessage: PropTypes.string,
    minLength: PropTypes.number,
    minLengthMessage: PropTypes.string,
    maxLength: PropTypes.number,
    maxLengthMessage: PropTypes.string,
    pattern: PropTypes.instanceOf(RegExp),
    patternMessage: PropTypes.string,
    custom: PropTypes.func
  })),
  className: PropTypes.string,
  layout: PropTypes.oneOf(['vertical', 'horizontal', 'inline']),
  spacing: PropTypes.oneOf(['small', 'medium', 'large']),
  showSubmitButton: PropTypes.bool,
  submitButtonText: PropTypes.string,
  submitButtonProps: PropTypes.object,
  resetOnSubmit: PropTypes.bool,
  disabled: PropTypes.bool
};

export default Form;

// FormField wrapper for automatic integration
export const FormField = ({ 
  name, 
  children, 
  formContext,
  ...props 
}) => {
  if (!formContext || !name) {
    return children;
  }
  
  const { values, errors, touched, handleFieldChange, handleFieldBlur, disabled } = formContext;
  
  const enhancedChild = React.cloneElement(children, {
    value: values[name] || '',
    error: touched[name] ? errors[name] : '',
    disabled: disabled,
    onChange: (e) => {
      const value = e.target ? e.target.value : e;
      handleFieldChange(name, value);
      if (children.props.onChange) {
        children.props.onChange(e);
      }
    },
    onBlur: (e) => {
      handleFieldBlur(name);
      if (children.props.onBlur) {
        children.props.onBlur(e);
      }
    }
  });
  
  return enhancedChild;
};

FormField.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired,
  formContext: PropTypes.object
};
