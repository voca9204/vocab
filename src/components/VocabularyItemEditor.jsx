import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Save, Trash2, Plus } from 'lucide-react';
import './VocabularyItemEditor.css';

/**
 * Vocabulary Item Editor Modal
 * 
 * Modal component for editing individual vocabulary items.
 * Supports CRUD operations on vocabulary words with all fields.
 */

const VocabularyItemEditor = ({ 
  isOpen, 
  onClose, 
  item = null, 
  onSave, 
  onDelete,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    word: '',
    definitions: [{ definition: '' }],
    pronunciation: '',
    partOfSpeech: '',
    koreanTranslation: '',
    examples: [{ example: '' }],
    difficulty: 'medium',
    categories: [],
    customFields: {}
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        word: item.word || '',
        definitions: item.definitions?.length > 0 ? item.definitions : [{ definition: '' }],
        pronunciation: item.pronunciation || '',
        partOfSpeech: item.partOfSpeech || '',
        koreanTranslation: item.koreanTranslation || '',
        examples: item.examples?.length > 0 ? item.examples : [{ example: '' }],
        difficulty: item.difficulty || 'medium',
        categories: item.categories || [],
        customFields: item.customFields || {}
      });
    } else {
      // Reset form for new item
      setFormData({
        word: '',
        definitions: [{ definition: '' }],
        pronunciation: '',
        partOfSpeech: '',
        koreanTranslation: '',
        examples: [{ example: '' }],
        difficulty: 'medium',
        categories: [],
        customFields: {}
      });
    }
    setErrors({});
  }, [item]);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Handle array field changes (definitions, examples)
  const handleArrayFieldChange = (fieldName, index, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].map((item, i) => 
        i === index ? { ...item, [fieldName.slice(0, -1)]: value } : item
      )
    }));
  };

  // Add new array item
  const addArrayItem = (fieldName) => {
    const itemKey = fieldName.slice(0, -1); // Remove 's' from end
    setFormData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName], { [itemKey]: '' }]
    }));
  };

  // Remove array item
  const removeArrayItem = (fieldName, index) => {
    if (formData[fieldName].length > 1) {
      setFormData(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    }
  };

  // Handle categories change
  const handleCategoriesChange = (value) => {
    const categories = value.split(',').map(cat => cat.trim()).filter(cat => cat);
    handleInputChange('categories', categories);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.word.trim()) {
      newErrors.word = 'Word is required';
    }

    if (!formData.definitions[0]?.definition?.trim()) {
      newErrors.definitions = 'At least one definition is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up data before saving
      const cleanData = {
        ...formData,
        word: formData.word.trim().toLowerCase(),
        definitions: formData.definitions.filter(def => def.definition?.trim()),
        examples: formData.examples.filter(ex => ex.example?.trim()),
        categories: formData.categories.filter(cat => cat.trim())
      };

      await onSave(cleanData);
      onClose();
    } catch (error) {
      console.error('Error saving vocabulary item:', error);
      setErrors({ submit: 'Failed to save vocabulary item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!item?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.word}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsSubmitting(true);

    try {
      await onDelete(item.id);
      onClose();
    } catch (error) {
      console.error('Error deleting vocabulary item:', error);
      setErrors({ submit: 'Failed to delete vocabulary item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="vocabulary-editor-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{item ? 'Edit Vocabulary Item' : 'Add New Vocabulary Item'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="vocabulary-form" onSubmit={handleSubmit}>
          <div className="form-row">
            {/* Word */}
            <div className="form-group">
              <label htmlFor="word">Word *</label>
              <input
                id="word"
                type="text"
                value={formData.word}
                onChange={e => handleInputChange('word', e.target.value)}
                className={errors.word ? 'error' : ''}
                placeholder="Enter the vocabulary word"
                disabled={isSubmitting}
              />
              {errors.word && <span className="error-text">{errors.word}</span>}
            </div>

            {/* Pronunciation */}
            <div className="form-group">
              <label htmlFor="pronunciation">Pronunciation</label>
              <input
                id="pronunciation"
                type="text"
                value={formData.pronunciation}
                onChange={e => handleInputChange('pronunciation', e.target.value)}
                placeholder="e.g., /prəˌnʌnsiˈeɪʃən/"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            {/* Part of Speech */}
            <div className="form-group">
              <label htmlFor="partOfSpeech">Part of Speech</label>
              <select
                id="partOfSpeech"
                value={formData.partOfSpeech}
                onChange={e => handleInputChange('partOfSpeech', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select part of speech</option>
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="preposition">Preposition</option>
                <option value="conjunction">Conjunction</option>
                <option value="interjection">Interjection</option>
              </select>
            </div>

            {/* Difficulty */}
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={formData.difficulty}
                onChange={e => handleInputChange('difficulty', e.target.value)}
                disabled={isSubmitting}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {/* Korean Translation */}
          <div className="form-group">
            <label htmlFor="koreanTranslation">Korean Translation</label>
            <input
              id="koreanTranslation"
              type="text"
              value={formData.koreanTranslation}
              onChange={e => handleInputChange('koreanTranslation', e.target.value)}
              placeholder="한국어 번역"
              disabled={isSubmitting}
            />
          </div>

          {/* Definitions */}
          <div className="form-group">
            <label>Definitions *</label>
            {formData.definitions.map((def, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={def.definition}
                  onChange={e => handleArrayFieldChange('definitions', index, e.target.value)}
                  placeholder={`Definition ${index + 1}`}
                  className={errors.definitions ? 'error' : ''}
                  disabled={isSubmitting}
                />
                {formData.definitions.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeArrayItem('definitions', index)}
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-btn"
              onClick={() => addArrayItem('definitions')}
              disabled={isSubmitting}
            >
              <Plus size={16} />
              Add Definition
            </button>
            {errors.definitions && <span className="error-text">{errors.definitions}</span>}
          </div>

          {/* Examples */}
          <div className="form-group">
            <label>Examples</label>
            {formData.examples.map((ex, index) => (
              <div key={index} className="array-item">
                <input
                  type="text"
                  value={ex.example}
                  onChange={e => handleArrayFieldChange('examples', index, e.target.value)}
                  placeholder={`Example sentence ${index + 1}`}
                  disabled={isSubmitting}
                />
                {formData.examples.length > 1 && (
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeArrayItem('examples', index)}
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-btn"
              onClick={() => addArrayItem('examples')}
              disabled={isSubmitting}
            >
              <Plus size={16} />
              Add Example
            </button>
          </div>

          {/* Categories */}
          <div className="form-group">
            <label htmlFor="categories">Categories</label>
            <input
              id="categories"
              type="text"
              value={formData.categories.join(', ')}
              onChange={e => handleCategoriesChange(e.target.value)}
              placeholder="Enter categories separated by commas"
              disabled={isSubmitting}
            />
            <small className="form-help">Separate multiple categories with commas</small>
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="error-message">
              {errors.submit}
            </div>
          )}

          {/* Form Actions */}
          <div className="modal-actions">
            <div className="action-group">
              {item && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
            
            <div className="action-group">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

VocabularyItemEditor.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  item: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default VocabularyItemEditor;
