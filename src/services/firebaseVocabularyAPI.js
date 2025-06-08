import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirebaseVocabularyAPI {
  constructor() {
    this.cache = new Map();
    this.searchHistory = [];
    
    // Collection references
    this.vocabulariesRef = collection(db, 'vocabularies');
    this.usersRef = collection(db, 'users');
    this.progressRef = collection(db, 'user_progress');
    this.sessionsRef = collection(db, 'study_sessions');
  }

  // Initialize sample data (run once to populate Firestore)
  async initializeSampleData() {
    try {
      const sampleWords = [
        {
          word: "eloquent",
          pronunciation: "ˈɛləkwənt",
          partOfSpeech: "adjective",
          definitions: [
            {
              definition: "fluent or persuasive in speaking or writing",
              examples: ["an eloquent speaker", "eloquent testimony"]
            }
          ],
          difficulty: "medium",
          frequency: 3.2,
          categories: ["communication", "speaking"],
          koreanTranslation: "웅변의, 설득력 있는",
          examples: [
            {
              sentence: "Her eloquent speech moved the entire audience to tears.",
              translation: "그녀의 웅변적인 연설은 청중 모두를 감동시켜 눈물을 흘리게 했다."
            }
          ],
          timesStudied: 0,
          averageCorrectRate: 0,
          lastStudied: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          word: "ubiquitous",
          pronunciation: "yuˈbɪkwɪtəs",
          partOfSpeech: "adjective", 
          definitions: [
            {
              definition: "present, appearing, or found everywhere",
              examples: ["ubiquitous smartphones", "ubiquitous surveillance"]
            }
          ],
          difficulty: "hard",
          frequency: 2.1,
          categories: ["descriptive", "technology"],
          koreanTranslation: "어디에나 있는, 편재하는",
          examples: [
            {
              sentence: "Smartphones have become ubiquitous in modern society.",
              translation: "스마트폰은 현대 사회에서 어디에나 있게 되었다."
            }
          ],
          timesStudied: 0,
          averageCorrectRate: 0,
          lastStudied: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        {
          word: "meticulous",
          pronunciation: "məˈtɪkyələs",
          partOfSpeech: "adjective",
          definitions: [
            {
              definition: "showing great attention to detail; very careful and precise",
              examples: ["meticulous research", "a meticulous worker"]
            }
          ],
          difficulty: "medium",
          frequency: 2.8,
          categories: ["personality", "work"],
          koreanTranslation: "세심한, 꼼꼼한",
          examples: [
            {
              sentence: "She was meticulous in her preparation for the exam.",
              translation: "그녀는 시험 준비를 매우 꼼꼼히 했다."
            }
          ],
          timesStudied: 0,
          averageCorrectRate: 0,
          lastStudied: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      ];

      const batch = writeBatch(db);
      
      sampleWords.forEach((word) => {
        const docRef = doc(this.vocabulariesRef);
        batch.set(docRef, word);
      });

      await batch.commit();
      console.log('Sample vocabulary data initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  }

  // Get all words with optional filtering and pagination
  async getWords(options = {}) {
    const {
      page = 1,
      limit: pageLimit = 20,
      difficulty = null,
      category = null,
      search = null,
      sortBy = 'word',
      sortOrder = 'asc',
      lastDoc = null
    } = options;

    try {
      let q = query(this.vocabulariesRef);

      // Apply filters
      if (difficulty) {
        q = query(q, where('difficulty', '==', difficulty));
      }

      if (category) {
        q = query(q, where('categories', 'array-contains', category));
      }

      // Apply sorting
      const orderDirection = sortOrder === 'desc' ? 'desc' : 'asc';
      q = query(q, orderBy(sortBy, orderDirection));

      // Apply pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      q = query(q, limit(pageLimit));

      const querySnapshot = await getDocs(q);
      let words = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        const wordData = { id: doc.id, ...doc.data() };
        
        // Apply search filter (client-side for now, could be optimized with search index)
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch = 
            wordData.word.toLowerCase().includes(searchLower) ||
            wordData.definitions?.some(def => 
              def.definition.toLowerCase().includes(searchLower)
            ) ||
            wordData.koreanTranslation?.toLowerCase().includes(searchLower);
          
          if (matchesSearch) {
            words.push(wordData);
          }
        } else {
          words.push(wordData);
        }
        
        lastDocument = doc;
      });

      // Add to search history if search was performed
      if (search) {
        this.addToSearchHistory(search);
      }

      return {
        words,
        lastDoc: lastDocument,
        hasMore: words.length === pageLimit,
        currentPage: page,
        searchTerm: search
      };
    } catch (error) {
      console.error('Error getting words:', error);
      throw error;
    }
  }

  // Get a specific word by ID
  async getWordById(wordId) {
    try {
      const docRef = doc(this.vocabulariesRef, wordId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Word with ID ${wordId} not found`);
      }
      
      return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
      console.error('Error getting word by ID:', error);
      throw error;
    }
  }

  // Get a specific word by the word text
  async getWordByText(wordText) {
    try {
      const q = query(
        this.vocabulariesRef, 
        where('word', '==', wordText.toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error(`Word "${wordText}" not found`);
      }
      
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error getting word by text:', error);
      throw error;
    }
  }

  // Get random words for practice
  async getRandomWords(count = 10, difficulty = null) {
    try {
      let q = query(this.vocabulariesRef);
      
      if (difficulty) {
        q = query(q, where('difficulty', '==', difficulty));
      }
      
      // Get more than needed and randomly select
      q = query(q, limit(count * 3));
      
      const querySnapshot = await getDocs(q);
      const allWords = [];
      
      querySnapshot.forEach((doc) => {
        allWords.push({ id: doc.id, ...doc.data() });
      });
      
      // Shuffle and return requested count
      const shuffled = allWords.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.min(count, shuffled.length));
    } catch (error) {
      console.error('Error getting random words:', error);
      throw error;
    }
  }

  // Get words for quiz generation
  async getQuizWords(count = 5, difficulty = null, excludeWords = []) {
    try {
      let q = query(this.vocabulariesRef);
      
      if (difficulty) {
        q = query(q, where('difficulty', '==', difficulty));
      }
      
      // Order by times studied (ascending) to prioritize less-studied words
      q = query(q, orderBy('timesStudied', 'asc'), limit(count * 2));
      
      const querySnapshot = await getDocs(q);
      const words = [];
      
      querySnapshot.forEach((doc) => {
        const wordData = { id: doc.id, ...doc.data() };
        if (!excludeWords.includes(doc.id)) {
          words.push(wordData);
        }
      });
      
      return words.slice(0, Math.min(count, words.length));
    } catch (error) {
      console.error('Error getting quiz words:', error);
      throw error;
    }
  }

  // Add a new word
  async addWord(wordData) {
    try {
      const newWordData = {
        ...wordData,
        timesStudied: 0,
        averageCorrectRate: 0,
        lastStudied: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(this.vocabulariesRef, newWordData);
      console.log('Word added with ID:', docRef.id);
      
      this.clearCache();
      return { id: docRef.id, ...newWordData };
    } catch (error) {
      console.error('Error adding word:', error);
      throw error;
    }
  }

  // Update word learning progress
  async updateWordProgress(wordId, progressData) {
    try {
      const wordRef = doc(this.vocabulariesRef, wordId);
      const updateData = {
        updatedAt: serverTimestamp()
      };

      if (progressData.studied) {
        updateData.timesStudied = increment(1);
        updateData.lastStudied = serverTimestamp();
      }

      if (progressData.correctRate !== undefined) {
        // Get current word data to calculate new average
        const wordDoc = await getDoc(wordRef);
        if (wordDoc.exists()) {
          const currentData = wordDoc.data();
          const currentCount = (currentData.timesStudied || 0) + 1;
          const currentAvg = currentData.averageCorrectRate || 0;
          const newAvg = (currentAvg * (currentCount - 1) + progressData.correctRate) / currentCount;
          updateData.averageCorrectRate = newAvg;
        }
      }

      await updateDoc(wordRef, updateData);
      
      this.clearCache();
      return await this.getWordById(wordId);
    } catch (error) {
      console.error('Error updating word progress:', error);
      throw error;
    }
  }

  // Save study session
  async saveStudySession(sessionData) {
    try {
      const sessionDoc = {
        ...sessionData,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(this.sessionsRef, sessionDoc);
      return { id: docRef.id, ...sessionDoc };
    } catch (error) {
      console.error('Error saving study session:', error);
      throw error;
    }
  }

  // Get user study sessions
  async getUserStudySessions(userId, limitCount = 10) {
    try {
      const q = query(
        this.sessionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const sessions = [];
      
      querySnapshot.forEach((doc) => {
        sessions.push({ id: doc.id, ...doc.data() });
      });
      
      return sessions;
    } catch (error) {
      console.error('Error getting user study sessions:', error);
      throw error;
    }
  }

  // Get vocabulary statistics
  async getVocabularyStats() {
    try {
      const cacheKey = 'vocab_stats';
      
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      const querySnapshot = await getDocs(this.vocabulariesRef);
      const stats = {
        totalWords: querySnapshot.size,
        difficultyCounts: {},
        categoryCounts: {},
        averageFrequency: 0,
        recentSearches: this.searchHistory.slice(-10)
      };

      let totalFrequency = 0;
      const categories = new Set();

      querySnapshot.forEach((doc) => {
        const word = doc.data();
        
        // Count by difficulty
        stats.difficultyCounts[word.difficulty] = 
          (stats.difficultyCounts[word.difficulty] || 0) + 1;
        
        // Count by categories
        if (word.categories) {
          word.categories.forEach(category => {
            stats.categoryCounts[category] = 
              (stats.categoryCounts[category] || 0) + 1;
            categories.add(category);
          });
        }
        
        // Sum frequency
        totalFrequency += word.frequency || 0;
      });

      stats.averageFrequency = totalFrequency / stats.totalWords;
      
      // Cache for 5 minutes
      this.cache.set(cacheKey, stats);
      setTimeout(() => this.cache.delete(cacheKey), 5 * 60 * 1000);
      
      return stats;
    } catch (error) {
      console.error('Error getting vocabulary stats:', error);
      throw error;
    }
  }

  // Search suggestions/autocomplete
  async getSearchSuggestions(query, maxSuggestions = 10) {
    try {
      const queryLower = query.toLowerCase();
      
      // For now, get all words and filter client-side
      // In production, consider using Algolia or similar for better search
      const q = query(this.vocabulariesRef, limit(100));
      const querySnapshot = await getDocs(q);
      const suggestions = [];

      querySnapshot.forEach((doc) => {
        const word = doc.data();
        if (word.word.toLowerCase().startsWith(queryLower)) {
          suggestions.push({
            id: doc.id,
            word: word.word,
            type: 'word',
            definition: word.definitions?.[0]?.definition || '',
            koreanTranslation: word.koreanTranslation || ''
          });
        }
      });

      return suggestions.slice(0, maxSuggestions);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      throw error;
    }
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

  // Get available categories (from cached stats or database)
  async getCategories() {
    try {
      const stats = await this.getVocabularyStats();
      return Object.keys(stats.categoryCounts);
    } catch (error) {
      console.error('Error getting categories:', error);
      return ['general', 'academic', 'business', 'science', 'arts'];
    }
  }

  // Get available difficulty levels
  getDifficultyLevels() {
    return ['easy', 'medium', 'hard'];
  }
}

// Create and export singleton instance
const firebaseVocabularyAPI = new FirebaseVocabularyAPI();

// Initialize sample data on first load (comment out after first run)
// firebaseVocabularyAPI.initializeSampleData().catch(console.error);

export default firebaseVocabularyAPI;
