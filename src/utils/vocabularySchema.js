// Vocabulary Word Data Schema
export const VocabularyWordSchema = {
  id: 'string', // Unique identifier
  word: 'string', // The vocabulary word
  pronunciation: 'string', // Phonetic pronunciation
  partOfSpeech: 'string', // noun, verb, adjective, etc.
  difficulty: 'string', // easy, medium, hard, expert
  frequency: 'number', // How common the word is (1-10)
  satLevel: 'boolean', // Is this an SAT-level word
  definitions: [
    {
      id: 'string',
      definition: 'string',
      context: 'string', // formal, informal, academic, etc.
      synonyms: ['string'],
      antonyms: ['string']
    }
  ],
  examples: [
    {
      id: 'string',
      sentence: 'string',
      context: 'string', // literature, academic, news, etc.
      highlightWord: 'boolean' // Whether to highlight the word in UI
    }
  ],
  etymology: {
    origin: 'string', // Latin, Greek, French, etc.
    rootWords: ['string'],
    evolution: 'string'
  },
  mnemonics: ['string'], // Memory aids
  relatedWords: ['string'], // Word IDs of related vocabulary
  categories: ['string'], // academic, science, literature, etc.
  tags: ['string'], // Additional categorization
  learningTips: 'string',
  commonMistakes: 'string',
  
  // Learning metadata
  averageCorrectRate: 'number', // 0-1
  timesStudied: 'number',
  lastStudied: 'date',
  
  // Audio data
  audioUrl: 'string', // URL to pronunciation audio
  audioProvider: 'string', // TTS, recorded, etc.
  
  // Source information
  sources: ['string'], // Where the word/definition came from
  verified: 'boolean',
  dateAdded: 'date',
  lastUpdated: 'date'
};

// Helper function to generate unique IDs
const generateId = () => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Example usage and validation
export const createVocabularyWord = (wordData) => {
  // Validation and creation logic
  const requiredFields = ['word', 'definitions', 'partOfSpeech', 'difficulty'];
  
  for (const field of requiredFields) {
    if (!wordData[field]) {
      throw new Error(`Required field '${field}' is missing`);
    }
  }
  
  return {
    id: wordData.id || generateId(),
    word: wordData.word.toLowerCase(),
    pronunciation: wordData.pronunciation || '',
    partOfSpeech: wordData.partOfSpeech,
    difficulty: wordData.difficulty,
    frequency: wordData.frequency || 5,
    satLevel: wordData.satLevel !== undefined ? wordData.satLevel : true,
    definitions: wordData.definitions.map(def => ({
      id: def.id || generateId(),
      definition: def.definition,
      context: def.context || 'general',
      synonyms: def.synonyms || [],
      antonyms: def.antonyms || []
    })),
    examples: (wordData.examples || []).map(ex => ({
      id: ex.id || generateId(),
      sentence: ex.sentence,
      context: ex.context || 'general',
      highlightWord: ex.highlightWord !== undefined ? ex.highlightWord : true
    })),
    etymology: wordData.etymology || {},
    mnemonics: wordData.mnemonics || [],
    relatedWords: wordData.relatedWords || [],
    categories: wordData.categories || [],
    tags: wordData.tags || [],
    learningTips: wordData.learningTips || '',
    commonMistakes: wordData.commonMistakes || '',
    averageCorrectRate: wordData.averageCorrectRate || 0,
    timesStudied: wordData.timesStudied || 0,
    lastStudied: wordData.lastStudied || null,
    audioUrl: wordData.audioUrl || '',
    audioProvider: wordData.audioProvider || 'tts',
    sources: wordData.sources || [],
    verified: wordData.verified !== undefined ? wordData.verified : false,
    dateAdded: wordData.dateAdded || new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
};

export default VocabularyWordSchema;
