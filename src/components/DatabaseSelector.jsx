import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  Database, 
  ChevronDown, 
  Star, 
  StarOff, 
  Clock, 
  BookOpen, 
  Users, 
  TrendingUp,
  Search,
  X,
  Settings,
  Globe
} from 'lucide-react';
import customVocabularyAPI from '../services/customVocabularyAPI';
import './DatabaseSelector.css';

/**
 * Database Selection Component
 * 
 * Allows users to switch between system vocabulary and custom databases
 * Features: favorites, recent lists, preview functionality, search
 */

const DatabaseSelector = ({ 
  currentDatabase, 
  onDatabaseChange, 
  onClose,
  isOpen = false,
  userId = null
}) => {
  const [collections, setCollections] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentDatabases, setRecentDatabases] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // System vocabulary database
  const systemDatabase = {
    id: 'system',
    type: 'system',
    name: 'System SAT Vocabulary',
    description: 'Official SAT vocabulary database with 3000+ words',
    wordCount: 3247,
    categories: ['Academic', 'Advanced', 'Literary'],
    difficulty: 'Mixed',
    createdAt: new Date('2024-01-01'),
    lastUsed: null,
    isFavorite: false
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentDatabase) {
      setSelectedDatabase(currentDatabase);
    }
  }, [currentDatabase]);

  // Load collections and user data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load user's custom collections if userId is available
      if (userId) {
        const userCollections = await customVocabularyAPI.getUserCollections(userId);
        setCollections(userCollections);
      } else {
        setCollections([]);
      }

      // Load favorites and recent from localStorage
      loadUserPreferences();

    } catch (err) {
      console.error('Error loading database data:', err);
      setError('Failed to load databases');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user preferences from localStorage
  const loadUserPreferences = () => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem('vocabularyFavorites') || '[]');
      const savedRecent = JSON.parse(localStorage.getItem('vocabularyRecent') || '[]');
      
      setFavorites(savedFavorites);
      setRecentDatabases(savedRecent);
    } catch (err) {
      console.error('Error loading user preferences:', err);
    }
  };

  // Save user preferences to localStorage
  const saveUserPreferences = (newFavorites, newRecent) => {
    try {
      localStorage.setItem('vocabularyFavorites', JSON.stringify(newFavorites || favorites));
      localStorage.setItem('vocabularyRecent', JSON.stringify(newRecent || recentDatabases));
    } catch (err) {
      console.error('Error saving user preferences:', err);
    }
  };

  // Toggle favorite status
  const toggleFavorite = (databaseId) => {
    const newFavorites = favorites.includes(databaseId)
      ? favorites.filter(id => id !== databaseId)
      : [...favorites, databaseId];
    
    setFavorites(newFavorites);
    saveUserPreferences(newFavorites, recentDatabases);
  };

  // Add to recent databases
  const addToRecent = (database) => {
    const newRecent = [
      database.id,
      ...recentDatabases.filter(id => id !== database.id)
    ].slice(0, 10); // Keep last 10

    setRecentDatabases(newRecent);
    saveUserPreferences(favorites, newRecent);
  };

  // Get database preview data
  const getPreviewData = async (database) => {
    try {
      if (database.type === 'system') {
        // System database preview
        return {
          wordCount: database.wordCount,
          categories: database.categories,
          difficulty: database.difficulty,
          sampleWords: ['eloquent', 'ubiquitous', 'pragmatic', 'audacious'],
          lastModified: database.createdAt,
          studiedCount: 0,
          masteredCount: 0
        };
      } else {
        // Custom database preview
        const preview = await customVocabularyAPI.getCollectionPreview(database.id, userId);
        return preview;
      }
    } catch (err) {
      console.error('Error getting preview data:', err);
      return null;
    }
  };

  // Handle database selection
  const handleDatabaseSelect = async (database) => {
    setSelectedDatabase(database);
    
    // Load preview data
    const preview = await getPreviewData(database);
    setPreviewData(preview);
    
    // Add to recent
    addToRecent(database);
  };

  // Confirm database change
  const handleConfirmSelection = () => {
    if (selectedDatabase && onDatabaseChange) {
      onDatabaseChange(selectedDatabase);
      onClose?.();
    }
  };

  // Get all available databases
  const getAllDatabases = () => {
    const allDatabases = [systemDatabase, ...collections];
    
    if (searchQuery) {
      return allDatabases.filter(db => 
        db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        db.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return allDatabases;
  };

  // Get favorite databases
  const getFavoriteDatabases = () => {
    const allDatabases = getAllDatabases();
    return allDatabases.filter(db => favorites.includes(db.id));
  };

  // Get recent databases
  const getRecentDatabases = () => {
    const allDatabases = getAllDatabases();
    return recentDatabases
      .map(id => allDatabases.find(db => db.id === id))
      .filter(Boolean)
      .slice(0, 5);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render database item
  const renderDatabaseItem = (database, showFavorite = true) => (
    <div 
      key={database.id}
      className={`database-item ${selectedDatabase?.id === database.id ? 'selected' : ''}`}
      onClick={() => handleDatabaseSelect(database)}
    >
      <div className="database-info">
        <div className="database-header">
          <div className="database-icon">
            {database.type === 'system' ? <Globe size={16} /> : <Database size={16} />}
          </div>
          <h4 className="database-name">{database.name}</h4>
          {showFavorite && (
            <button
              className="favorite-btn"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(database.id);
              }}
            >
              {favorites.includes(database.id) ? 
                <Star size={14} className="favorited" /> : 
                <StarOff size={14} />
              }
            </button>
          )}
        </div>
        
        <p className="database-description">{database.description}</p>
        
        <div className="database-stats">
          <span className="stat">
            <BookOpen size={12} />
            {database.wordCount || 0} words
          </span>
          
          {database.type !== 'system' && database.studiedCount !== undefined && (
            <span className="stat">
              <TrendingUp size={12} />
              {database.studiedCount || 0} studied
            </span>
          )}
          
          <span className="stat">
            <Clock size={12} />
            {formatDate(database.lastUsed || database.createdAt)}
          </span>
        </div>
        
        {database.type === 'system' && (
          <div className="database-badge system">Official</div>
        )}
        
        {database.type !== 'system' && (
          <div className="database-badge custom">Custom</div>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="database-selector-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            <Database size={20} />
            Select Vocabulary Database
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="selector-content">
          <div className="selector-left">
            {/* Search */}
            <div className="search-section">
              <div className="search-input">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search databases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="loading-section">
                <div className="spinner"></div>
                <p>Loading databases...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="error-section">
                <p>{error}</p>
                <button className="btn btn-sm" onClick={loadData}>
                  Retry
                </button>
              </div>
            )}

            {/* Favorites */}
            {!isLoading && !error && getFavoriteDatabases().length > 0 && (
              <div className="database-section">
                <h3>
                  <Star size={16} />
                  Favorites
                </h3>
                <div className="database-list">
                  {getFavoriteDatabases().map(db => renderDatabaseItem(db, false))}
                </div>
              </div>
            )}

            {/* Recent */}
            {!isLoading && !error && getRecentDatabases().length > 0 && (
              <div className="database-section">
                <h3>
                  <Clock size={16} />
                  Recently Used
                </h3>
                <div className="database-list">
                  {getRecentDatabases().map(db => renderDatabaseItem(db))}
                </div>
              </div>
            )}

            {/* All Databases */}
            {!isLoading && !error && (
              <div className="database-section">
                <h3>
                  <Database size={16} />
                  All Databases
                </h3>
                <div className="database-list">
                  {getAllDatabases().map(db => renderDatabaseItem(db))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && getAllDatabases().length === 0 && (
              <div className="empty-state">
                <Database size={48} />
                <h3>No Databases Found</h3>
                <p>No databases match your search criteria.</p>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="selector-right">
            {selectedDatabase ? (
              <div className="preview-panel">
                <h3>Preview</h3>
                
                <div className="preview-header">
                  <div className="preview-icon">
                    {selectedDatabase.type === 'system' ? 
                      <Globe size={24} /> : 
                      <Database size={24} />
                    }
                  </div>
                  <div className="preview-info">
                    <h4>{selectedDatabase.name}</h4>
                    <p>{selectedDatabase.description}</p>
                  </div>
                </div>

                {previewData && (
                  <div className="preview-stats">
                    <div className="stat-item">
                      <span className="label">Total Words:</span>
                      <span className="value">{previewData.wordCount || 0}</span>
                    </div>
                    
                    {previewData.studiedCount !== undefined && (
                      <div className="stat-item">
                        <span className="label">Studied:</span>
                        <span className="value">{previewData.studiedCount}</span>
                      </div>
                    )}
                    
                    {previewData.masteredCount !== undefined && (
                      <div className="stat-item">
                        <span className="label">Mastered:</span>
                        <span className="value">{previewData.masteredCount}</span>
                      </div>
                    )}
                    
                    <div className="stat-item">
                      <span className="label">Last Modified:</span>
                      <span className="value">{formatDate(previewData.lastModified)}</span>
                    </div>

                    {previewData.categories && (
                      <div className="stat-item">
                        <span className="label">Categories:</span>
                        <span className="value">{previewData.categories.join(', ')}</span>
                      </div>
                    )}

                    {previewData.sampleWords && (
                      <div className="preview-samples">
                        <h5>Sample Words:</h5>
                        <div className="sample-words">
                          {previewData.sampleWords.slice(0, 4).map((word, index) => (
                            <span key={index} className="sample-word">{word}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="preview-placeholder">
                <Database size={48} />
                <h4>Select a Database</h4>
                <p>Choose a database to see preview information</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmSelection}
            disabled={!selectedDatabase}
          >
            Select Database
          </button>
        </div>
      </div>
    </div>
  );
};

DatabaseSelector.propTypes = {
  currentDatabase: PropTypes.object,
  onDatabaseChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  userId: PropTypes.string
};

export default DatabaseSelector;