import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../contexts/AppContext';
import customVocabularyAPI from '../services/customVocabularyAPI';
import VocabularyItemEditor from '../components/VocabularyItemEditor';
import OpenAISettings from '../components/OpenAISettings';
import DatabaseSelector from '../components/DatabaseSelector';
import { 
  Database, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Filter,
  MoreVertical,
  BookOpen,
  Calendar,
  TrendingUp,
  Users,
  Eye,
  Settings
} from 'lucide-react';
import './VocabularyManagement.css';

/**
 * Vocabulary Management Dashboard
 * 
 * Main interface for managing custom vocabulary collections and words.
 * Features:
 * - View all collections
 * - CRUD operations on collections and vocabulary items
 * - Search and filter functionality
 * - Batch operations
 * - Organization with tags/favorites
 */

const VocabularyManagement = () => {
  const { user } = useAppState();
  const navigate = useNavigate();
  
  // State management
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [vocabularyItems, setVocabularyItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [view, setView] = useState('collections'); // 'collections' | 'vocabulary'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    tags: [],
    difficulty: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  // Editor state
  const [showEditor, setShowEditor] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isEditorLoading, setIsEditorLoading] = useState(false);
  
  // OpenAI Settings state
  const [showOpenAISettings, setShowOpenAISettings] = useState(false);
  
  // Database Selection state
  const [showDatabaseSelector, setShowDatabaseSelector] = useState(false);
  const [currentDatabase, setCurrentDatabase] = useState({
    id: 'system',
    type: 'system',
    name: 'System SAT Vocabulary',
    description: 'Official SAT vocabulary database with 3000+ words'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Load collections on component mount
  useEffect(() => {
    if (user?.uid) {
      loadCollections();
    }
  }, [user]);

  // Load user's collections
  const loadCollections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userCollections = await customVocabularyAPI.getUserCollections(
        user.uid, 
        {
          sortBy: filterOptions.sortBy,
          sortOrder: filterOptions.sortOrder,
          limit: 50
        }
      );
      
      setCollections(userCollections);
    } catch (err) {
      console.error('Error loading collections:', err);
      setError('Failed to load collections. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load vocabulary items for selected collection
  const loadVocabularyItems = async (collectionId, page = 1) => {
    try {
      setIsLoading(true);
      
      const result = await customVocabularyAPI.getCollectionVocabularies(
        collectionId,
        user.uid,
        {
          page,
          limit: itemsPerPage,
          search: searchQuery,
          difficulty: filterOptions.difficulty,
          sortBy: filterOptions.sortBy,
          sortOrder: filterOptions.sortOrder
        }
      );
      
      setVocabularyItems(result.vocabularies);
      setTotalItems(result.vocabularies.length); // Note: This is approximate
      setCurrentPage(page);
    } catch (err) {
      console.error('Error loading vocabulary items:', err);
      setError('Failed to load vocabulary items.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle collection selection
  const handleSelectCollection = async (collection) => {
    setSelectedCollection(collection);
    setView('vocabulary');
    setCurrentPage(1);
    await loadVocabularyItems(collection.id);
  };

  // Handle back to collections view
  const handleBackToCollections = () => {
    setView('collections');
    setSelectedCollection(null);
    setVocabularyItems([]);
    setSelectedItems([]);
    setShowEditor(false);
    setEditingItem(null);
  };

  // Toggle collection favorite status
  const handleToggleFavorite = async (collectionId, currentStatus) => {
    try {
      await customVocabularyAPI.toggleFavorite(collectionId, user.uid);
      
      // Update local state
      setCollections(prev => prev.map(collection => 
        collection.id === collectionId 
          ? { ...collection, isFavorite: !currentStatus }
          : collection
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status.');
    }
  };

  // Delete collection
  const handleDeleteCollection = async (collectionId) => {
    if (!window.confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
      return;
    }

    try {
      await customVocabularyAPI.deleteCollection(collectionId, user.uid);
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      
      // If currently viewing this collection, go back to collections view
      if (selectedCollection?.id === collectionId) {
        handleBackToCollections();
      }
    } catch (err) {
      console.error('Error deleting collection:', err);
      setError('Failed to delete collection.');
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (view === 'vocabulary' && selectedCollection) {
      await loadVocabularyItems(selectedCollection.id, 1);
    }
  };

  // Handle filter change
  const handleFilterChange = async (newFilters) => {
    setFilterOptions(prev => ({ ...prev, ...newFilters }));
    
    if (view === 'collections') {
      await loadCollections();
    } else if (view === 'vocabulary' && selectedCollection) {
      await loadVocabularyItems(selectedCollection.id, 1);
    }
  };

  // Handle item selection for batch operations
  const handleItemSelect = (itemId) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      setShowBatchActions(newSelection.length > 0);
      return newSelection;
    });
  };

  // Select all items
  const handleSelectAll = () => {
    if (selectedItems.length === vocabularyItems.length) {
      setSelectedItems([]);
      setShowBatchActions(false);
    } else {
      const allIds = vocabularyItems.map(item => item.id);
      setSelectedItems(allIds);
      setShowBatchActions(true);
    }
  };

  // Handle vocabulary item editing
  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowEditor(true);
  };

  // Handle adding new vocabulary item
  const handleAddItem = () => {
    setEditingItem(null);
    setShowEditor(true);
  };

  // Handle closing editor
  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingItem(null);
    setIsEditorLoading(false);
  };

  // Handle vocabulary item save
  const handleSaveItem = async (itemData) => {
    try {
      setIsEditorLoading(true);
      
      if (editingItem) {
        // Update existing item
        await customVocabularyAPI.updateVocabulary(editingItem.id, itemData);
      } else {
        // Add new item
        await customVocabularyAPI.addVocabulary(
          selectedCollection.id,
          user.uid,
          itemData
        );
      }
      
      // Reload vocabulary items
      await loadVocabularyItems(selectedCollection.id, currentPage);
      
      // Close editor
      handleCloseEditor();
      
    } catch (err) {
      console.error('Error saving vocabulary item:', err);
      throw new Error('Failed to save vocabulary item. Please try again.');
    } finally {
      setIsEditorLoading(false);
    }
  };

  // Handle vocabulary item delete
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this word? This action cannot be undone.')) {
      return;
    }

    try {
      await customVocabularyAPI.deleteVocabulary(itemId);
      
      // Reload vocabulary items
      await loadVocabularyItems(selectedCollection.id, currentPage);
      
    } catch (err) {
      console.error('Error deleting vocabulary item:', err);
      setError('Failed to delete vocabulary item.');
    }
  };

  // Handle delete from editor
  const handleDeleteFromEditor = async (itemId) => {
    try {
      setIsEditorLoading(true);
      
      await customVocabularyAPI.deleteVocabulary(itemId);
      
      // Reload vocabulary items
      await loadVocabularyItems(selectedCollection.id, currentPage);
      
      // Close editor
      handleCloseEditor();
      
    } catch (err) {
      console.error('Error deleting vocabulary item:', err);
      throw new Error('Failed to delete vocabulary item. Please try again.');
    } finally {
      setIsEditorLoading(false);
    }
  };

  // Handle batch delete
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.length} selected word(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setIsLoading(true);
      
      // Delete all selected items
      await Promise.all(
        selectedItems.map(itemId => customVocabularyAPI.deleteVocabulary(itemId))
      );
      
      // Clear selection
      setSelectedItems([]);
      setShowBatchActions(false);
      
      // Reload vocabulary items
      await loadVocabularyItems(selectedCollection.id, currentPage);
      
    } catch (err) {
      console.error('Error deleting vocabulary items:', err);
      setError('Failed to delete selected items.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle database change
  const handleDatabaseChange = async (database) => {
    try {
      setCurrentDatabase(database);
      
      if (database.type === 'system') {
        // Switch to system vocabulary
        setView('collections');
        setSelectedCollection(null);
        setVocabularyItems([]);
        
        // Note: You might want to implement system vocabulary integration here
        console.log('Switched to system vocabulary database');
        
      } else {
        // Switch to custom collection
        setView('collections');
        setSelectedCollection(null);
        setVocabularyItems([]);
        
        // Reload collections (they might be filtered by database)
        await loadCollections();
        
        console.log(`Switched to custom database: ${database.name}`);
      }
      
    } catch (err) {
      console.error('Error switching database:', err);
      setError('Failed to switch database. Please try again.');
    }
  };

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render collections grid
  const renderCollectionsView = () => (
    <div className="collections-view">
      <div className="collections-header">
        <div className="header-content">
          <div className="header-top">
            <h2>My Vocabulary Collections</h2>
            <div className="current-database">
              <span className="database-label">Current Database:</span>
              <button 
                className="database-selector-btn"
                onClick={() => setShowDatabaseSelector(true)}
                title="Switch vocabulary database"
              >
                <Database size={16} />
                {currentDatabase.name}
                <Settings size={14} />
              </button>
            </div>
          </div>
          <p>Manage your custom vocabulary collections and study materials</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowOpenAISettings(true)}
            title="OpenAI Settings for AI example generation"
          >
            <Settings size={16} />
            AI Settings
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/custom-vocabulary')}
          >
            <Plus size={16} />
            Upload Collection
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls-section">
        <div className="search-controls">
          <div className="search-input">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-outline">
            <Filter size={16} />
            Filters
          </button>
        </div>
        
        <div className="sort-controls">
          <select 
            value={`${filterOptions.sortBy}-${filterOptions.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange({ sortBy, sortOrder });
            }}
          >
            <option value="updatedAt-desc">Recently Updated</option>
            <option value="createdAt-desc">Recently Created</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="wordCount-desc">Most Words</option>
          </select>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="collections-grid">
        {collections.map(collection => (
          <div key={collection.id} className="collection-card">
            <div className="collection-header">
              <div className="collection-title">
                <h3>{collection.name}</h3>
                <button
                  className={`favorite-btn ${collection.isFavorite ? 'active' : ''}`}
                  onClick={() => handleToggleFavorite(collection.id, collection.isFavorite)}
                >
                  {collection.isFavorite ? <Star size={16} /> : <StarOff size={16} />}
                </button>
              </div>
              <div className="collection-actions">
                <button 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleSelectCollection(collection)}
                >
                  <Eye size={14} />
                  View
                </button>
                <div className="dropdown">
                  <button className="btn btn-sm btn-ghost">
                    <MoreVertical size={14} />
                  </button>
                  <div className="dropdown-menu">
                    <button onClick={() => handleSelectCollection(collection)}>
                      <Edit size={14} />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteCollection(collection.id)}
                      className="danger"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="collection-description">
              <p>{collection.description || 'No description available'}</p>
            </div>

            <div className="collection-stats">
              <div className="stat">
                <BookOpen size={14} />
                <span>{collection.wordCount || 0} words</span>
              </div>
              <div className="stat">
                <TrendingUp size={14} />
                <span>{collection.studiedCount || 0} studied</span>
              </div>
              <div className="stat">
                <Calendar size={14} />
                <span>{formatDate(collection.updatedAt)}</span>
              </div>
            </div>

            <div className="collection-tags">
              {collection.tags?.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {collections.length === 0 && !isLoading && (
        <div className="empty-state">
          <Database size={48} />
          <h3>No Collections Yet</h3>
          <p>Create your first custom vocabulary collection to get started.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/custom-vocabulary')}
          >
            <Plus size={16} />
            Upload Collection
          </button>
        </div>
      )}
    </div>
  );

  // Render vocabulary items view
  const renderVocabularyView = () => (
    <div className="vocabulary-view">
      <div className="vocabulary-header">
        <div className="breadcrumb">
          <button 
            className="btn btn-ghost"
            onClick={handleBackToCollections}
          >
            ← Back to Collections
          </button>
          <span>/</span>
          <h2>{selectedCollection?.name}</h2>
        </div>

        <div className="collection-info">
          <div className="collection-stats">
            <div className="stat">
              <BookOpen size={16} />
              <span>{selectedCollection?.wordCount || 0} total words</span>
            </div>
            <div className="stat">
              <TrendingUp size={16} />
              <span>{selectedCollection?.studiedCount || 0} studied</span>
            </div>
            <div className="stat">
              <Users size={16} />
              <span>{Math.round(((selectedCollection?.masteredCount || 0) / (selectedCollection?.wordCount || 1)) * 100)}% mastered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="vocabulary-controls">
        <div className="search-input">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search vocabulary..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="control-buttons">
          <button 
            className="btn btn-outline"
            onClick={handleSelectAll}
          >
            {selectedItems.length === vocabularyItems.length ? 'Deselect All' : 'Select All'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleAddItem}
          >
            <Plus size={16} />
            Add Word
          </button>
        </div>
      </div>

      {/* Batch Actions */}
      {showBatchActions && (
        <div className="batch-actions">
          <span>{selectedItems.length} selected</span>
          <div className="actions">
            <button className="btn btn-sm btn-outline">
              <Edit size={14} />
              Edit Selected
            </button>
            <button className="btn btn-sm btn-outline">
              <Settings size={14} />
              Change Difficulty
            </button>
            <button 
              className="btn btn-sm btn-danger"
              onClick={handleBatchDelete}
            >
              <Trash2 size={14} />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Vocabulary Items List */}
      <div className="vocabulary-list">
        {vocabularyItems.map(item => (
          <div key={item.id} className="vocabulary-item">
            <div className="item-checkbox">
              <input
                type="checkbox"
                checked={selectedItems.includes(item.id)}
                onChange={() => handleItemSelect(item.id)}
              />
            </div>
            
            <div className="item-content">
              <div className="item-header">
                <h4 className="word">{item.word}</h4>
                <span className={`difficulty ${item.difficulty}`}>
                  {item.difficulty}
                </span>
              </div>
              
              <div className="item-definition">
                <p>{item.definitions?.[0]?.definition || 'No definition'}</p>
              </div>
              
              {item.koreanTranslation && (
                <div className="item-translation">
                  <span className="label">Korean:</span>
                  <span>{item.koreanTranslation}</span>
                </div>
              )}
              
              {item.examples?.length > 0 && (
                <div className="item-examples">
                  <span className="label">Example:</span>
                  <span>{item.examples[0].example}</span>
                </div>
              )}
              
              <div className="item-stats">
                <span>Studied: {item.timesStudied || 0}</span>
                <span>Mastery: {item.masteryLevel || 0}%</span>
                {item.lastStudied && (
                  <span>Last: {formatDate(item.lastStudied)}</span>
                )}
              </div>
            </div>
            
            <div className="item-actions">
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => handleEditItem(item)}
                title="Edit word"
              >
                <Edit size={14} />
              </button>
              <button 
                className="btn btn-sm btn-ghost"
                onClick={() => handleDeleteItem(item.id)}
                title="Delete word"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {vocabularyItems.length === 0 && !isLoading && (
        <div className="empty-state">
          <BookOpen size={48} />
          <h3>No Words in Collection</h3>
          <p>This collection doesn't have any vocabulary words yet.</p>
          <button 
            className="btn btn-primary"
            onClick={handleAddItem}
          >
            <Plus size={16} />
            Add First Word
          </button>
        </div>
      )}
    </div>
  );

  // Main render
  return (
    <div className="vocabulary-management">
      {/* Loading State */}
      {isLoading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-message">
            <h3>Error</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setError(null);
                if (view === 'collections') {
                  loadCollections();
                } else if (selectedCollection) {
                  loadVocabularyItems(selectedCollection.id, currentPage);
                }
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <>
          {view === 'collections' && renderCollectionsView()}
          {view === 'vocabulary' && renderVocabularyView()}
        </>
      )}

      {/* Vocabulary Item Editor Modal */}
      {showEditor && (
        <VocabularyItemEditor
          isOpen={showEditor}
          onClose={handleCloseEditor}
          item={editingItem}
          onSave={handleSaveItem}
          onDelete={handleDeleteFromEditor}
          isLoading={isEditorLoading}
        />
      )}

      {/* Database Selector Modal */}
      {showDatabaseSelector && (
        <DatabaseSelector
          isOpen={showDatabaseSelector}
          currentDatabase={currentDatabase}
          onDatabaseChange={handleDatabaseChange}
          onClose={() => setShowDatabaseSelector(false)}
          userId={user?.uid}
        />
      )}

      {/* OpenAI Settings Modal */}
      {showOpenAISettings && (
        <OpenAISettings
          isOpen={showOpenAISettings}
          onClose={() => setShowOpenAISettings(false)}
        />
      )}
    </div>
  );
};

export default VocabularyManagement;