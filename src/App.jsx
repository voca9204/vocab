import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import About from './pages/About';
import Login from './pages/Login';
import Registration from './pages/Registration';
import ForgotPassword from './pages/ForgotPassword';
import CustomVocabulary from './pages/CustomVocabulary';
import VocabularyManagement from './pages/VocabularyManagement';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="app">
            <Navigation />
            <main className="main-content">
              <ErrorBoundary title="Page Error" message="There was an error loading this page.">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Registration />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/about" element={<About />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/quiz" 
                    element={
                      <ProtectedRoute>
                        <Quiz />
                      </ProtectedRoute>
                    } 
                  />
                  {/* Custom Vocabulary 경로들 */}
                  <Route 
                    path="/custom-vocabulary" 
                    element={
                      <ProtectedRoute>
                        <CustomVocabulary />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/vocabulary" 
                    element={
                      <ProtectedRoute>
                        <VocabularyManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/vocabulary-management" 
                    element={
                      <ProtectedRoute>
                        <VocabularyManagement />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
