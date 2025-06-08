import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import authService from '../services/authService';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import './Auth.css';

const Registration = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppState();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: true,
    errors: []
  });
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [user.isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password in real-time
    if (name === 'password') {
      const validation = authService.validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    dispatch(actions.clearAuthError());

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      dispatch({
        type: 'SET_AUTH_ERROR',
        payload: errors[0]
      });
      return;
    }

    // Register user
    await actions.registerUser(
      dispatch,
      formData.email,
      formData.password,
      { displayName: formData.displayName }
    );
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.displayName.trim()) {
      errors.push('Display name is required');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!authService.validateEmail(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!formData.password) {
      errors.push('Password is required');
    } else if (!passwordValidation.isValid) {
      errors.push(passwordValidation.errors[0]);
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return errors;
  };

  const handleGoogleSignUp = async () => {
    dispatch(actions.clearAuthError());
    await actions.loginWithGoogle(dispatch);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join our vocabulary learning community</p>
        </div>

        {user.error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            {user.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <TextInput
            type="text"
            name="displayName"
            label="Display Name"
            value={formData.displayName}
            onChange={handleInputChange}
            placeholder="Enter your display name"
            required
            disabled={user.isLoading}
          />

          <TextInput
            type="email"
            name="email"
            label="Email Address"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
            disabled={user.isLoading}
          />

          <TextInput
            type={showPassword ? "text" : "password"}
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a password"
            required
            disabled={user.isLoading}
            rightIcon={
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            }
          />

          {formData.password && !passwordValidation.isValid && (
            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                {passwordValidation.errors.map((error, index) => (
                  <li key={index} className="requirement-error">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <TextInput
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            required
            disabled={user.isLoading}
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={user.isLoading || !passwordValidation.isValid}
            loading={user.isLoading}
            fullWidth
          >
            Create Account
          </Button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <Button
          variant="outline"
          size="large"
          onClick={handleGoogleSignUp}
          disabled={user.isLoading}
          fullWidth
          leftIcon="🔍"
        >
          Continue with Google
        </Button>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>
        </div>

        <div className="auth-terms">
          <p>
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="auth-link">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="auth-link">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Registration;
