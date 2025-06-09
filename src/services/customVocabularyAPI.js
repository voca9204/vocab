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
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Custom Vocabulary API for managing user-owned vocabulary collections
 * 
 * Database Schema:
 * 
 * 1. custom_collections:
 *    - id: string
 *    - userId: string (owner)
 *    - name: string
 *    - description: string
 *    - source: string (file_upload, manual, imported)
 *    - originalFileName?: string
 *    - fileUrl?: string (Firebase Storage URL)
 *    - wordCount: number
 *    - studiedCount: number
 *    - masteredCount: number
 *    - createdAt: timestamp
 *    - updatedAt: timestamp
 *    - isPublic: boolean
 *    - tags: string[]
 *    - metadata: object (file info, import settings, etc.)
 *    - isFavorite: boolean
 *    - lastAccessed: timestamp
 * 
 * 2. custom_vocabularies:
 *    - id: string
 *    - collectionId: string
 *    - userId: string
 *    - word: string
 *    - pronunciation?: string
 *    - partOfSpeech?: string
 *    - definitions: array
 *    - koreanTranslation?: string
 *    - examples: array (AI generated or user provided)
 *    - difficulty?: string (easy, medium, hard)
 *    - categories?: string[]
 *    - customFields?: object (for flexible user-defined fields)
 *    - timesStudied: number
 *    - averageCorrectRate: number
 *    - masteryLevel: number (0-100)
 *    - lastStudied?: timestamp
 *    - aiGenerated: boolean (true if examples were AI generated)
 *    - createdAt: timestamp
 *    - updatedAt: timestamp
 * 
 * 3. custom_progress:
 *    - id: string (composite: userId_collectionId_wordId)
 *    - userId: string
 *    - collectionId: string
 *    - wordId: string
 *    - correctAnswers: number
 *    - totalAttempts: number
 *    - lastStudied: timestamp
 *    - currentDifficulty: string
 *    - masteryLevel: number (0-100)
 *    - reviewDue: timestamp (for spaced repetition)
 *    - timesReviewed: number
 */

class CustomVocabularyAPI {
  constructor() {
    this.cache = new Map();
    
    // Collection references
    this.collectionsRef = collection(db, 'custom_collections');
    this.vocabulariesRef = collection(db, 'custom_vocabularies');
    this.progressRef = collection(db, 'custom_progress');
  }

  // ======================= COLLECTION MANAGEMENT =======================

  /**
   * Create a new custom vocabulary collection
   */
  async createCollection(userId, collectionData) {
    try {
      const newCollection = {
        userId,
        name: collectionData.name,
        description: collectionData.description || '',
        source: collectionData.source || 'manual',
        originalFileName: collectionData.originalFileName || null,
        fileUrl: collectionData.fileUrl || null,
        wordCount: 0,
        studiedCount: 0,
        masteredCount: 0,
        isPublic: collectionData.isPublic || false,
        tags: collectionData.tags || [],
        metadata: collectionData.metadata || {},
        isFavorite: false,
        lastAccessed: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.collectionsRef, newCollection);
      console.log('Collection created with ID:', docRef.id);
      
      this.clearCache();
      return { id: docRef.id, ...newCollection };
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Get all collections for a user with optional filtering
   */
  async getUserCollections(userId, options = {}) {
    try {
      const {
        includeFavorites = false,
        tags = [],
        sortBy = 'updatedAt',
        sortOrder = 'desc',
        limit: queryLimit = 50
      } = options;

      let q = query(
        this.collectionsRef,
        where('userId', '==', userId)
      );

      // Filter by tags if specified
      if (tags.length > 0) {
        tags.forEach(tag => {
          q = query(q, where('tags', 'array-contains', tag));
        });
      }

      // Filter favorites if specified
      if (includeFavorites) {
        q = query(q, where('isFavorite', '==', true));
      }

      // Apply sorting
      const orderDirection = sortOrder === 'desc' ? 'desc' : 'asc';
      q = query(q, orderBy(sortBy, orderDirection));

      // Apply limit
      q = query(q, limit(queryLimit));

      const querySnapshot = await getDocs(q);
      const collections = [];

      querySnapshot.forEach((doc) => {
        collections.push({ id: doc.id, ...doc.data() });
      });

      return collections;
    } catch (error) {
      console.error('Error getting user collections:', error);
      throw error;
    }
  }

  /**
   * Get a specific collection by ID
   */
  async getCollection(collectionId, userId) {
    try {
      const docRef = doc(this.collectionsRef, collectionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`Collection with ID ${collectionId} not found`);
      }
      
      const collectionData = { id: docSnap.id, ...docSnap.data() };
      
      // Verify ownership
      if (collectionData.userId !== userId && !collectionData.isPublic) {
        throw new Error('Access denied to this collection');
      }

      // Update last accessed time
      await this.updateCollectionAccess(collectionId);
      
      return collectionData;
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }

  /**
   * Update collection metadata
   */
  async updateCollection(collectionId, userId, updateData) {
    try {
      const docRef = doc(this.collectionsRef, collectionId);
      
      // Verify ownership
      const existingDoc = await getDoc(docRef);
      if (!existingDoc.exists() || existingDoc.data().userId !== userId) {
        throw new Error('Collection not found or access denied');
      }

      const updates = {
        ...updateData,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, updates);
      this.clearCache();
      
      return await this.getCollection(collectionId, userId);
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Delete a collection and all its vocabularies
   */
  async deleteCollection(collectionId, userId) {
    try {
      const batch = writeBatch(db);
      
      // Verify ownership
      const collectionRef = doc(this.collectionsRef, collectionId);
      const collectionDoc = await getDoc(collectionRef);
      
      if (!collectionDoc.exists() || collectionDoc.data().userId !== userId) {
        throw new Error('Collection not found or access denied');
      }

      // Delete all vocabularies in this collection
      const vocabQuery = query(
        this.vocabulariesRef,
        where('collectionId', '==', collectionId)
      );
      const vocabSnapshot = await getDocs(vocabQuery);
      
      vocabSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all progress records for this collection
      const progressQuery = query(
        this.progressRef,
        where('collectionId', '==', collectionId)
      );
      const progressSnapshot = await getDocs(progressQuery);
      
      progressSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete the collection itself
      batch.delete(collectionRef);

      // Delete associated file from storage if exists
      const collectionData = collectionDoc.data();
      if (collectionData.fileUrl) {
        try {
          const fileRef = ref(storage, collectionData.fileUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn('Could not delete associated file:', storageError);
        }
      }

      await batch.commit();
      this.clearCache();
      
      console.log('Collection and all associated data deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status of a collection
   */
  async toggleFavorite(collectionId, userId) {
    try {
      const docRef = doc(this.collectionsRef, collectionId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists() || docSnap.data().userId !== userId) {
        throw new Error('Collection not found or access denied');
      }

      const currentFavorite = docSnap.data().isFavorite || false;
      
      await updateDoc(docRef, {
        isFavorite: !currentFavorite,
        updatedAt: serverTimestamp()
      });

      this.clearCache();
      return !currentFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Update collection access time
   */
  async updateCollectionAccess(collectionId) {
    try {
      const docRef = doc(this.collectionsRef, collectionId);
      await updateDoc(docRef, {
        lastAccessed: serverTimestamp()
      });
    } catch (error) {
      console.warn('Could not update access time:', error);
    }
  }

  // ======================= VOCABULARY MANAGEMENT =======================

  /**
   * Add a single vocabulary item to a collection
   */
  async addVocabulary(collectionId, userId, vocabularyData) {
    try {
      const newVocabulary = {
        collectionId,
        userId,
        word: vocabularyData.word.toLowerCase().trim(),
        pronunciation: vocabularyData.pronunciation || '',
        partOfSpeech: vocabularyData.partOfSpeech || '',
        definitions: vocabularyData.definitions || [],
        koreanTranslation: vocabularyData.koreanTranslation || '',
        examples: vocabularyData.examples || [],
        difficulty: vocabularyData.difficulty || 'medium',
        categories: vocabularyData.categories || [],
        customFields: vocabularyData.customFields || {},
        timesStudied: 0,
        averageCorrectRate: 0,
        masteryLevel: 0,
        lastStudied: null,
        aiGenerated: vocabularyData.aiGenerated || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.vocabulariesRef, newVocabulary);
      
      // Update collection word count
      await this.updateCollectionStats(collectionId);
      
      this.clearCache();
      return { id: docRef.id, ...newVocabulary };
    } catch (error) {
      console.error('Error adding vocabulary:', error);
      throw error;
    }
  }

  /**
   * Add multiple vocabulary items in batch
   */
  async addVocabulariesBatch(collectionId, userId, vocabulariesData) {
    try {
      const batch = writeBatch(db);
      const results = [];

      vocabulariesData.forEach((vocabData) => {
        const docRef = doc(this.vocabulariesRef);
        const newVocabulary = {
          collectionId,
          userId,
          word: vocabData.word.toLowerCase().trim(),
          pronunciation: vocabData.pronunciation || '',
          partOfSpeech: vocabData.partOfSpeech || '',
          definitions: vocabData.definitions || [],
          koreanTranslation: vocabData.koreanTranslation || '',
          examples: vocabData.examples || [],
          difficulty: vocabData.difficulty || 'medium',
          categories: vocabData.categories || [],
          customFields: vocabData.customFields || {},
          timesStudied: 0,
          averageCorrectRate: 0,
          masteryLevel: 0,
          lastStudied: null,
          aiGenerated: vocabData.aiGenerated || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        batch.set(docRef, newVocabulary);
        results.push({ id: docRef.id, ...newVocabulary });
      });

      await batch.commit();
      
      // Update collection word count
      await this.updateCollectionStats(collectionId);
      
      this.clearCache();
      console.log(`Added ${vocabulariesData.length} vocabulary items in batch`);
      return results;
    } catch (error) {
      console.error('Error adding vocabularies in batch:', error);
      throw error;
    }
  }

  /**
   * Get vocabularies from a collection with pagination and filtering
   */
  async getCollectionVocabularies(collectionId, userId, options = {}) {
    try {
      const {
        page = 1,
        limit: pageLimit = 20,
        search = null,
        difficulty = null,
        category = null,
        sortBy = 'word',
        sortOrder = 'asc',
        lastDoc = null,
        onlyUnstudied = false,
        masteryLevel = null
      } = options;

      let q = query(
        this.vocabulariesRef,
        where('collectionId', '==', collectionId),
        where('userId', '==', userId)
      );

      // Apply filters
      if (difficulty) {
        q = query(q, where('difficulty', '==', difficulty));
      }

      if (category) {
        q = query(q, where('categories', 'array-contains', category));
      }

      if (onlyUnstudied) {
        q = query(q, where('timesStudied', '==', 0));
      }

      if (masteryLevel !== null) {
        q = query(q, where('masteryLevel', '>=', masteryLevel));
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
      let vocabularies = [];
      let lastDocument = null;

      querySnapshot.forEach((doc) => {
        const vocabData = { id: doc.id, ...doc.data() };
        
        // Apply search filter (client-side)
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesSearch = 
            vocabData.word.toLowerCase().includes(searchLower) ||
            vocabData.definitions?.some(def => 
              def.definition?.toLowerCase().includes(searchLower)
            ) ||
            vocabData.koreanTranslation?.toLowerCase().includes(searchLower);
          
          if (matchesSearch) {
            vocabularies.push(vocabData);
          }
        } else {
          vocabularies.push(vocabData);
        }
        
        lastDocument = doc;
      });

      return {
        vocabularies,
        lastDoc: lastDocument,
        hasMore: vocabularies.length === pageLimit,
        currentPage: page,
        searchTerm: search
      };
    } catch (error) {
      console.error('Error getting collection vocabularies:', error);
      throw error;
    }
  }

  /**
   * Update collection statistics (word count, studied count, etc.)
   */
  async updateCollectionStats(collectionId) {
    try {
      const vocabQuery = query(
        this.vocabulariesRef,
        where('collectionId', '==', collectionId)
      );
      const vocabSnapshot = await getDocs(vocabQuery);
      
      let wordCount = 0;
      let studiedCount = 0;
      let masteredCount = 0;

      vocabSnapshot.forEach((doc) => {
        const data = doc.data();
        wordCount++;
        if (data.timesStudied > 0) studiedCount++;
        if (data.masteryLevel >= 80) masteredCount++;
      });

      const collectionRef = doc(this.collectionsRef, collectionId);
      await updateDoc(collectionRef, {
        wordCount,
        studiedCount,
        masteredCount,
        updatedAt: serverTimestamp()
      });

    } catch (error) {
      console.error('Error updating collection stats:', error);
    }
  }

  // ======================= UTILITY METHODS =======================

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get collection preview data for database selector
   */
  async getCollectionPreview(collectionId, userId) {
    try {
      const collection = await this.getCollection(collectionId, userId);
      
      // Get a few sample vocabularies
      const sampleQuery = query(
        collection(this.db, 'custom_vocabularies'),
        where('collectionId', '==', collectionId),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      
      const sampleSnapshot = await getDocs(sampleQuery);
      const sampleWords = sampleSnapshot.docs.map(doc => doc.data().word);

      // Get categories from all vocabularies
      const vocabQuery = query(
        collection(this.db, 'custom_vocabularies'),
        where('collectionId', '==', collectionId),
        where('userId', '==', userId)
      );
      
      const vocabSnapshot = await getDocs(vocabQuery);
      const categoriesSet = new Set();
      
      vocabSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.categories) {
          data.categories.forEach(cat => categoriesSet.add(cat));
        }
      });

      return {
        wordCount: collection.wordCount || 0,
        studiedCount: collection.studiedCount || 0,
        masteredCount: collection.masteredCount || 0,
        categories: Array.from(categoriesSet).slice(0, 5), // Show up to 5 categories
        sampleWords: sampleWords.slice(0, 4), // Show 4 sample words
        lastModified: collection.updatedAt?.toDate() || collection.createdAt?.toDate(),
        difficulty: collection.difficulty || 'Mixed'
      };
    } catch (error) {
      console.error('Error getting collection preview:', error);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStatistics(collectionId, userId) {
    try {
      const collection = await this.getCollection(collectionId, userId);
      const vocabularies = await this.getCollectionVocabularies(collectionId, userId, { limit: 1000 });
      
      const stats = {
        totalWords: collection.wordCount,
        studiedWords: collection.studiedCount,
        masteredWords: collection.masteredCount,
        averageMastery: 0,
        difficultyCounts: {},
        categoryCounts: {},
        recentActivity: []
      };

      let totalMastery = 0;
      vocabularies.vocabularies.forEach((vocab) => {
        // Count by difficulty
        stats.difficultyCounts[vocab.difficulty] = 
          (stats.difficultyCounts[vocab.difficulty] || 0) + 1;
        
        // Count by categories
        if (vocab.categories) {
          vocab.categories.forEach(category => {
            stats.categoryCounts[category] = 
              (stats.categoryCounts[category] || 0) + 1;
          });
        }
        
        totalMastery += vocab.masteryLevel || 0;
      });

      stats.averageMastery = vocabularies.vocabularies.length > 0 
        ? totalMastery / vocabularies.vocabularies.length 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error getting collection statistics:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const customVocabularyAPI = new CustomVocabularyAPI();

export default customVocabularyAPI;
