import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch, actions } from '../contexts/AppContext';
import authService from '../services/authService';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import './Profile.css';

const Profile = () => {
  const { user, learning } = useAppState();
  const dispatch = useAppDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    preferences: {
      dailyGoal: 10,
      difficulty: 'medium',
      theme: 'light',
      soundEnabled: true,
      language: 'en'
    }
  });

  // Initialize profile data when user data is available
  useEffect(() => {
    if (user.profile) {
      setProfileData({
        displayName: user.profile.displayName || '',
        email: user.profile.email || '',
        photoURL: user.profile.photoURL || '',
        preferences: {
          dailyGoal: user.profile.learningPreferences?.dailyGoal || 10,
          difficulty: user.profile.learningPreferences?.difficulty || 'medium',
          theme: user.profile.learningPreferences?.theme || 'light',
          soundEnabled: user.profile.learningPreferences?.soundEnabled ?? true,
          language: user.profile.learningPreferences?.language || 'en'
        }
      });
    }
  }, [user.profile]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;

    if (name.startsWith('preferences.')) {
      const prefKey = name.split('.')[1];
      setProfileData(prev => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [prefKey]: finalValue
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      // Update user profile in Firestore
      const updateData = {
        displayName: profileData.displayName,
        learningPreferences: profileData.preferences,
        lastModified: new Date().toISOString()
      };

      const result = await authService.updateUserProfile(user.profile.uid, updateData);
      
      if (result.success) {
        // Update context with new profile data
        dispatch(actions.setUser({
          ...user.profile,
          ...updateData
        }));
        
        dispatch(actions.setNotification({
          type: 'success',
          message: 'Profile updated successfully!'
        }));
        
        setIsEditing(false);
      } else {
        dispatch(actions.setError(result.error));
      }
    } catch (error) {
      dispatch(actions.setError('Failed to update profile'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original data
    if (user.profile) {
      setProfileData({
        displayName: user.profile.displayName || '',
        email: user.profile.email || '',
        photoURL: user.profile.photoURL || '',
        preferences: {
          dailyGoal: user.profile.learningPreferences?.dailyGoal || 10,
          difficulty: user.profile.learningPreferences?.difficulty || 'medium',
          theme: user.profile.learningPreferences?.theme || 'light',
          soundEnabled: user.profile.learningPreferences?.soundEnabled ?? true,
          language: user.profile.learningPreferences?.language || 'en'
        }
      });
    }
    setIsEditing(false);
  };

  const handleSendVerification = async () => {
    await actions.sendEmailVerification(dispatch);
    setShowEmailVerification(false);
  };

  const difficultyOptions = [
    { value: 'easy', label: 'Easy - Basic vocabulary' },
    { value: 'medium', label: 'Medium - Intermediate vocabulary' },
    { value: 'hard', label: 'Hard - Advanced vocabulary' }
  ];

  const themeOptions = [
    { value: 'light', label: 'Light Theme' },
    { value: 'dark', label: 'Dark Theme' },
    { value: 'auto', label: 'Auto (System)' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ko', label: 'Korean' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }
  ];

  if (!user.profile) {
    return (
      <div className="profile-page">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          <img 
            src={profileData.photoURL || '/default-avatar.svg'} 
            alt="Profile"
            className="avatar-image"
          />
          {isEditing && (
            <button className="avatar-edit-btn">
              📷
            </button>
          )}
        </div>
        
        <div className="profile-info">
          <h1>{profileData.displayName || 'User'}</h1>
          <p className="profile-email">
            {profileData.email}
            {!user.profile.emailVerified && (
              <span className="verification-status">
                <span className="unverified">Not verified</span>
                <button 
                  className="verify-btn"
                  onClick={() => setShowEmailVerification(true)}
                >
                  Verify
                </button>
              </span>
            )}
          </p>
        </div>

        <div className="profile-actions">
          {!isEditing ? (
            <Button 
              variant="primary" 
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="edit-actions">
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSaveProfile}
                loading={isLoading}
                disabled={isLoading}
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Profile Information</h2>
          
          {isEditing ? (
            <div className="profile-form">
              <TextInput
                label="Display Name"
                name="displayName"
                value={profileData.displayName}
                onChange={handleInputChange}
                placeholder="Enter your display name"
                disabled={isLoading}
              />
              
              <TextInput
                label="Email Address"
                name="email"
                type="email"
                value={profileData.email}
                disabled={true}
                helperText="Email cannot be changed. Contact support if you need to update your email."
              />
            </div>
          ) : (
            <div className="profile-display">
              <div className="info-item">
                <label>Display Name:</label>
                <span>{profileData.displayName || 'Not set'}</span>
              </div>
              <div className="info-item">
                <label>Email Address:</label>
                <span>{profileData.email}</span>
              </div>
              <div className="info-item">
                <label>Member Since:</label>
                <span>{new Date(user.profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Learning Preferences</h2>
          
          {isEditing ? (
            <div className="preferences-form">
              <div className="form-row">
                <TextInput
                  label="Daily Goal (words)"
                  name="preferences.dailyGoal"
                  type="number"
                  min="1"
                  max="100"
                  value={profileData.preferences.dailyGoal}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                
                <Select
                  label="Difficulty Level"
                  name="preferences.difficulty"
                  value={profileData.preferences.difficulty}
                  onChange={handleInputChange}
                  options={difficultyOptions}
                  disabled={isLoading}
                />
              </div>

              <div className="form-row">
                <Select
                  label="Theme"
                  name="preferences.theme"
                  value={profileData.preferences.theme}
                  onChange={handleInputChange}
                  options={themeOptions}
                  disabled={isLoading}
                />
                
                <Select
                  label="Language"
                  name="preferences.language"
                  value={profileData.preferences.language}
                  onChange={handleInputChange}
                  options={languageOptions}
                  disabled={isLoading}
                />
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="preferences.soundEnabled"
                    checked={profileData.preferences.soundEnabled}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />
                  <span>Enable sound effects and pronunciation</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="preferences-display">
              <div className="info-item">
                <label>Daily Goal:</label>
                <span>{profileData.preferences.dailyGoal} words</span>
              </div>
              <div className="info-item">
                <label>Difficulty Level:</label>
                <span className="capitalize">{profileData.preferences.difficulty}</span>
              </div>
              <div className="info-item">
                <label>Theme:</label>
                <span className="capitalize">{profileData.preferences.theme}</span>
              </div>
              <div className="info-item">
                <label>Language:</label>
                <span>{languageOptions.find(opt => opt.value === profileData.preferences.language)?.label}</span>
              </div>
              <div className="info-item">
                <label>Sound Effects:</label>
                <span>{profileData.preferences.soundEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Learning Progress</h2>
          <div className="progress-stats">
            <div className="stat-card">
              <div className="stat-number">{learning.totalWordsLearned}</div>
              <div className="stat-label">Words Learned</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{learning.currentLevel}</div>
              <div className="stat-label">Current Level</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{learning.streakDays}</div>
              <div className="stat-label">Day Streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{learning.todayProgress}/{learning.dailyGoal}</div>
              <div className="stat-label">Today's Progress</div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <Modal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        title="Verify Email Address"
      >
        <div className="verification-modal">
          <p>
            To verify your email address, we'll send a verification link to:
          </p>
          <strong>{profileData.email}</strong>
          
          <div className="modal-actions">
            <Button
              variant="outline"
              onClick={() => setShowEmailVerification(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendVerification}
              loading={user.isLoading}
            >
              Send Verification Email
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;