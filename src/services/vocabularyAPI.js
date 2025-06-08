import { vocabularyDatabase, wordCategories, difficultyLevels } from '../data/vocabularyData';

class VocabularyAPI {
  constructor() {
    this.words = vocabularyDatabase;
    this.cache = new Map();
    this.searchHistory = [];
  }

  // Get all words with optional filtering and pagination
  async getWords(options = {}) {
    const {
      page = 1,
      limit = 20,
      difficulty = null,
      category = null,
      search = null,
      sortBy = 'word',
      sortOrder = 'asc'
    } = options;

    const cacheKey = JSON.stringify(options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let filteredWords = [...this.words];

    // Apply filters
    if (difficulty) {
      filteredWords = filteredWords.filter(word => word.difficulty === difficulty);
    }

    if (category) {
      filteredWords = filteredWords.filter(word => 
        word.categories.includes(category)
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredWords = filteredWords.filter(word =>
        word.word.toLowerCase().includes(searchLower) ||
        word.definitions.some(def => 
          def.definition.toLowerCase().includes(searchLower)
        ) ||
        word.examples.some(ex => 
          ex.sentence.toLowerCase().includes(searchLower)
        )
      );
      
      // Add to search history
      this.addToSearchHistory(search);
    }

    // Sort results
    filteredWords.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'frequency') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWords = filteredWords.slice(startIndex, endIndex);

    const result = {
      words: paginatedWords,
      totalWords: filteredWords.length,
      currentPage: page,
      totalPages: Math.ceil(filteredWords.length / limit),
      hasNext: endIndex < filteredWords.length,
      hasPrev: page > 1
    };

    // Cache the result
    this.cache.set(cacheKey, result);
    
    return result;
  }

  // Get a specific word by ID
  async getWordById(wordId) {
    const word = this.words.find(w => w.id === wordId);
    if (!word) {
      throw new Error(`Word with ID ${wordId} not found`);
    }
    return word;
  }

  // Get a specific word by the word itself
  async getWordByText(wordText) {
    const word = this.words.find(w => 
      w.word.toLowerCase() === wordText.toLowerCase()
    );
    if (!word) {
      throw new Error(`Word "${wordText}" not found`);
    }
    return word;
  }

  // Get random words for practice
  async getRandomWords(count = 10, difficulty = null) {
    let availableWords = [...this.words];
    
    if (difficulty) {
      availableWords = availableWords.filter(word => 
        word.difficulty === difficulty
      );
    }

    // Shuffle array and take the first 'count' items
    const shuffled = availableWords.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  // Get words for quiz generation
  async getQuizWords(count = 5, difficulty = null, excludeWords = []) {
    let availableWords = this.words.filter(word => 
      !excludeWords.includes(word.id)
    );

    if (difficulty) {
      availableWords = availableWords.filter(word => 
        word.difficulty === difficulty
      );
    }

    // Prioritize words that haven't been studied much
    availableWords.sort((a, b) => a.timesStudied - b.timesStudied);
    
    return availableWords.slice(0, Math.min(count, availableWords.length));
  }

  // Get related words
  async getRelatedWords(wordId, maxCount = 5) {
    const word = await this.getWordById(wordId);
    const relatedWords = [];

    // Get explicitly related words
    for (const relatedId of word.relatedWords) {
      try {
        const relatedWord = await this.getWordById(relatedId);
        relatedWords.push(relatedWord);
      } catch (error) {
        // Word not found, skip
      }
    }

    // If we don't have enough related words, find similar ones
    if (relatedWords.length < maxCount) {
      const similar = this.words.filter(w => 
        w.id !== wordId &&
        !relatedWords.find(rw => rw.id === w.id) &&
        (w.categories.some(cat => word.categories.includes(cat)) ||
         w.difficulty === word.difficulty)
      );

      relatedWords.push(...similar.slice(0, maxCount - relatedWords.length));
    }

    return relatedWords.slice(0, maxCount);
  }

  // Get word statistics
  async getWordStats() {
    const stats = {
      totalWords: this.words.length,
      difficultyCounts: {},
      categoryCounts: {},
      averageFrequency: 0,
      recentSearches: this.searchHistory.slice(-10)
    };

    // Count by difficulty
    this.words.forEach(word => {
      stats.difficultyCounts[word.difficulty] = 
        (stats.difficultyCounts[word.difficulty] || 0) + 1;
    });

    // Count by category
    this.words.forEach(word => {
      word.categories.forEach(category => {
        stats.categoryCounts[category] = 
          (stats.categoryCounts[category] || 0) + 1;
      });
    });

    // Calculate average frequency
    const totalFrequency = this.words.reduce((sum, word) => sum + word.frequency, 0);
    stats.averageFrequency = totalFrequency / this.words.length;

    return stats;
  }

  // Update word learning progress
  async updateWordProgress(wordId, progressData) {
    const wordIndex = this.words.findIndex(w => w.id === wordId);
    if (wordIndex === -1) {
      throw new Error(`Word with ID ${wordId} not found`);
    }

    const word = this.words[wordIndex];
    
    // Update learning statistics
    if (progressData.studied) {
      word.timesStudied = (word.timesStudied || 0) + 1;
      word.lastStudied = new Date().toISOString();
    }

    if (progressData.correctRate !== undefined) {
      // Update running average of correct rate
      const currentCount = word.timesStudied || 1;
      const currentAvg = word.averageCorrectRate || 0;
      word.averageCorrectRate = 
        (currentAvg * (currentCount - 1) + progressData.correctRate) / currentCount;
    }

    word.lastUpdated = new Date().toISOString();
    
    // Clear relevant cache
    this.clearCache();
    
    return word;
  }

  // Search suggestions/autocomplete
  async getSearchSuggestions(query, maxSuggestions = 10) {
    const queryLower = query.toLowerCase();
    const suggestions = [];

    this.words.forEach(word => {
      if (word.word.toLowerCase().startsWith(queryLower)) {
        suggestions.push({
          word: word.word,
          type: 'word',
          definition: word.definitions[0]?.definition || ''
        });
      }
    });

    return suggestions.slice(0, maxSuggestions);
  }

  // Private helper methods
  addToSearchHistory(searchTerm) {
    this.searchHistory.push({
      term: searchTerm,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 searches
    if (this.searchHistory.length > 50) {
      this.searchHistory = this.searchHistory.slice(-50);
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // Get available categories
  getCategories() {
    return Object.keys(wordCategories);
  }

  // Get available difficulty levels
  getDifficultyLevels() {
    return Object.keys(difficultyLevels);
  }
}

// Create and export singleton instance
const vocabularyAPI = new VocabularyAPI();
export default vocabularyAPI;
