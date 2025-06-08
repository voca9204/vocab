import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import Button from './Button';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppState();
  
  const publicNavItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' }
  ];

  const privateNavItems = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/quiz', label: 'Quiz' },
    { path: '/vocabulary', label: 'My Vocabulary' },
    { path: '/custom-vocabulary', label: 'Upload' },
    { path: '/profile', label: 'Profile' },
    { path: '/about', label: 'About' }
  ];

  const navItems = user.isAuthenticated ? privateNavItems : publicNavItems;

  const handleLogout = async () => {
    await dispatch(actions.logoutUser());
    navigate('/');
  };

  // Don't show navigation on auth pages
  const authPages = ['/login', '/register', '/forgot-password'];
  if (authPages.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">📚 Vocabulary</Link>
      </div>
      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      
      <div className="nav-auth">
        {user.isAuthenticated ? (
          <div className="auth-section">
            {user.profile && (
              <span className="user-greeting">
                Hi, {user.profile.displayName || 'User'}!
              </span>
            )}
            <Button
              variant="info"
              size="small"
              onClick={handleLogout}
              disabled={user.isLoading}
            >
              Logout
            </Button>
          </div>
        ) : (
          <div className="auth-section">
            <Link to="/login">
              <Button variant="secondary" size="small">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="small">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
