import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppState();
  
  const from = location.state?.from?.pathname || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [user.isAuthenticated, navigate, from]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    dispatch(actions.clearAuthError());

    if (!formData.email || !formData.password) {
      dispatch({
        type: 'SET_AUTH_ERROR',
        payload: 'Please fill in all fields'
      });
      return;
    }

    // Login user
    await actions.loginUser(dispatch, formData.email, formData.password, rememberMe);
  };

  const handleGoogleSignIn = async () => {
    dispatch(actions.clearAuthError());
    await actions.loginWithGoogle(dispatch);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue your learning journey</p>
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
            placeholder="Enter your password"
            required
            disabled={user.isLoading}
            endIcon={
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            }
          />

          <div className="auth-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={user.isLoading}
              />
              <span>Remember me</span>
            </label>
            
            <button
              type="button"
              className="forgot-password-link"
              onClick={handleForgotPassword}
              disabled={user.isLoading}
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={user.isLoading}
            loading={user.isLoading}
            fullWidth
          >
            Sign In
          </Button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <Button
          variant="outline"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={user.isLoading}
          fullWidth
          leftIcon="🔍"
        >
          Continue with Google
        </Button>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
