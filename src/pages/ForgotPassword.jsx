import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import authService from '../services/authService';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import './Auth.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppState();
  
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    dispatch(actions.clearAuthError());

    if (!email) {
      dispatch({
        type: 'SET_AUTH_ERROR',
        payload: 'Please enter your email address'
      });
      return;
    }

    if (!authService.validateEmail(email)) {
      dispatch({
        type: 'SET_AUTH_ERROR',
        payload: 'Please enter a valid email address'
      });
      return;
    }

    // Send password reset email
    await actions.resetPassword(dispatch, email);
    
    if (!user.error) {
      setIsEmailSent(true);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleResendEmail = async () => {
    await actions.resetPassword(dispatch, email);
  };

  if (isEmailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to your email address</p>
          </div>

          <div className="auth-success">
            <span className="success-icon">✅</span>
            Password reset email sent to {email}
          </div>

          <div className="email-instructions">
            <h3>What's next?</h3>
            <ol>
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the password reset link in the email</li>
              <li>Follow the instructions to create a new password</li>
              <li>Return to the app and sign in with your new password</li>
            </ol>
          </div>

          <div className="auth-actions">
            <Button
              variant="outline"
              size="large"
              onClick={handleResendEmail}
              disabled={user.isLoading}
              fullWidth
            >
              Resend Email
            </Button>
            
            <Button
              variant="primary"
              size="large"
              onClick={handleBackToLogin}
              fullWidth
            >
              Back to Login
            </Button>
          </div>

          <div className="auth-footer">
            <p>
              Didn't receive the email? Check your spam folder or{' '}
              <button
                type="button"
                className="auth-link"
                onClick={handleResendEmail}
                disabled={user.isLoading}
              >
                try again
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Enter your email address and we'll send you a reset link</p>
        </div>

        {user.error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            {user.error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <TextInput
            type="email"
            name="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            disabled={user.isLoading}
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={user.isLoading || !email}
            loading={user.isLoading}
            fullWidth
          >
            Send Reset Link
          </Button>
        </form>

        <div className="auth-footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;