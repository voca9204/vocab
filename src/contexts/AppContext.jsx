import React, { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';
import vocabularyAPI from '../services/vocabularyAPI';
import authService from '../services/authService';

// Initial state
const initialState = {
  user: {
    isAuthenticated: false,
    profile: null,
    isLoading: false,
    error: null,
    preferences: {
      theme: 'light',
      soundEnabled: true,
      difficulty: 'medium'
    }
  },
  learning: {
    currentLevel: 1,
    totalWordsLearned: 150,
    streakDays: 5,
    dailyGoal: 10,
    todayProgress: 3
  },
  vocabulary: {
    words: [],
    currentWord: null,
    wordHistory: [],
    knownWords: ['eloquent', 'gregarious'],
    unknownWords: ['ubiquitous'],
    searchQuery: '',
    searchResults: [],
    isLoading: false,
    error: null,
    totalWords: 0,
    currentPage: 1,
    filters: {
      difficulty: null,
      category: null
    }
  },
  ui: {
    isLoading: false,
    error: null,
    notification: null
  }
};

// Action types
export const ACTION_TYPES = {
  // User/Auth actions
  SET_USER: 'SET_USER',
  LOGOUT_USER: 'LOGOUT_USER',
  UPDATE_PREFERENCES: 'UPDATE_PREFERENCES',
  SET_AUTH_LOADING: 'SET_AUTH_LOADING',
  SET_AUTH_ERROR: 'SET_AUTH_ERROR',
  CLEAR_AUTH_ERROR: 'CLEAR_AUTH_ERROR',
  
  // Learning actions
  UPDATE_PROGRESS: 'UPDATE_PROGRESS',
  INCREMENT_STREAK: 'INCREMENT_STREAK',
  RESET_STREAK: 'RESET_STREAK',
  
  // Vocabulary actions
  SET_VOCABULARY_LOADING: 'SET_VOCABULARY_LOADING',
  SET_VOCABULARY_ERROR: 'SET_VOCABULARY_ERROR',
  LOAD_WORDS_SUCCESS: 'LOAD_WORDS_SUCCESS',
  SET_CURRENT_WORD: 'SET_CURRENT_WORD',
  MARK_WORD_KNOWN: 'MARK_WORD_KNOWN',
  MARK_WORD_UNKNOWN: 'MARK_WORD_UNKNOWN',
  ADD_TO_HISTORY: 'ADD_TO_HISTORY',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  SET_VOCABULARY_FILTERS: 'SET_VOCABULARY_FILTERS',
  
  // UI actions
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTIFICATION: 'SET_NOTIFICATION',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_NOTIFICATION: 'CLEAR_NOTIFICATION'
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_USER:
      return {
        ...state,
        user: {
          ...state.user,
          isAuthenticated: true,
          profile: action.payload
        }
      };
    
    case ACTION_TYPES.LOGOUT_USER:
      return {
        ...state,
        user: {
          ...initialState.user
        }
      };
    
    case ACTION_TYPES.UPDATE_PREFERENCES:
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload
          }
        }
      };
    
    case ACTION_TYPES.SET_AUTH_LOADING:
      return {
        ...state,
        user: {
          ...state.user,
          isLoading: action.payload
        }
      };
    
    case ACTION_TYPES.SET_AUTH_ERROR:
      return {
        ...state,
        user: {
          ...state.user,
          error: action.payload,
          isLoading: false
        }
      };
    
    case ACTION_TYPES.CLEAR_AUTH_ERROR:
      return {
        ...state,
        user: {
          ...state.user,
          error: null
        }
      };
    
    case ACTION_TYPES.UPDATE_PROGRESS:
      return {
        ...state,
        learning: {
          ...state.learning,
          ...action.payload
        }
      };
    
    case ACTION_TYPES.SET_VOCABULARY_LOADING:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          isLoading: action.payload
        }
      };
    
    case ACTION_TYPES.SET_VOCABULARY_ERROR:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          error: action.payload,
          isLoading: false
        }
      };
    
    case ACTION_TYPES.LOAD_WORDS_SUCCESS:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          words: action.payload.words,
          totalWords: action.payload.totalWords,
          currentPage: action.payload.currentPage,
          isLoading: false,
          error: null
        }
      };
    
    case ACTION_TYPES.MARK_WORD_KNOWN:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          knownWords: [...state.vocabulary.knownWords, action.payload],
          unknownWords: state.vocabulary.unknownWords.filter(word => word !== action.payload)
        },
        learning: {
          ...state.learning,
          totalWordsLearned: state.learning.totalWordsLearned + 1,
          todayProgress: state.learning.todayProgress + 1
        }
      };
    
    case ACTION_TYPES.MARK_WORD_UNKNOWN:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          unknownWords: [...state.vocabulary.unknownWords, action.payload],
          knownWords: state.vocabulary.knownWords.filter(word => word !== action.payload)
        }
      };
    
    case ACTION_TYPES.SET_CURRENT_WORD:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          currentWord: action.payload
        }
      };
    
    case ACTION_TYPES.SET_SEARCH_QUERY:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          searchQuery: action.payload
        }
      };
    
    case ACTION_TYPES.SET_VOCABULARY_FILTERS:
      return {
        ...state,
        vocabulary: {
          ...state.vocabulary,
          filters: {
            ...state.vocabulary.filters,
            ...action.payload
          }
        }
      };
    
    case ACTION_TYPES.SET_LOADING:
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: action.payload
        }
      };
    
    case ACTION_TYPES.SET_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload,
          isLoading: false
        }
      };
    
    case ACTION_TYPES.CLEAR_ERROR:
      return {
        ...state,
        ui: {
          ...state.ui,
          error: null
        }
      };
    
    case ACTION_TYPES.SET_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notification: action.payload
        }
      };
    
    case ACTION_TYPES.CLEAR_NOTIFICATION:
      return {
        ...state,
        ui: {
          ...state.ui,
          notification: null
        }
      };
    
    default:
      return state;
  }
};

// Create contexts
const AppStateContext = createContext();
const AppDispatchContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize authentication state listener
  useEffect(() => {
    const unsubscribe = authService.initializeAuthListener((user) => {
      if (user) {
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: user
        });
      } else {
        dispatch({ type: ACTION_TYPES.LOGOUT_USER });
      }
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  // Load initial vocabulary data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        dispatch({ type: ACTION_TYPES.SET_VOCABULARY_LOADING, payload: true });
        
        const result = await vocabularyAPI.getWords({
          page: 1,
          limit: 20,
          difficulty: state.vocabulary.filters.difficulty,
          category: state.vocabulary.filters.category
        });
        
        dispatch({
          type: ACTION_TYPES.LOAD_WORDS_SUCCESS,
          payload: result
        });
      } catch (error) {
        dispatch({
          type: ACTION_TYPES.SET_VOCABULARY_ERROR,
          payload: error.message
        });
      }
    };

    loadInitialData();
  }, []);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hooks for using context
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};

export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (context === undefined) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};

// Enhanced action creators with async operations
export const actions = {
  // Basic actions
  setUser: (user) => ({ type: ACTION_TYPES.SET_USER, payload: user }),
  logoutUser: () => ({ type: ACTION_TYPES.LOGOUT_USER }),
  updatePreferences: (preferences) => ({ type: ACTION_TYPES.UPDATE_PREFERENCES, payload: preferences }),
  updateProgress: (progress) => ({ type: ACTION_TYPES.UPDATE_PROGRESS, payload: progress }),
  markWordKnown: (word) => ({ type: ACTION_TYPES.MARK_WORD_KNOWN, payload: word }),
  markWordUnknown: (word) => ({ type: ACTION_TYPES.MARK_WORD_UNKNOWN, payload: word }),
  setCurrentWord: (word) => ({ type: ACTION_TYPES.SET_CURRENT_WORD, payload: word }),
  setLoading: (loading) => ({ type: ACTION_TYPES.SET_LOADING, payload: loading }),
  setError: (error) => ({ type: ACTION_TYPES.SET_ERROR, payload: error }),
  clearError: () => ({ type: ACTION_TYPES.CLEAR_ERROR }),
  setNotification: (notification) => ({ type: ACTION_TYPES.SET_NOTIFICATION, payload: notification }),
  clearNotification: () => ({ type: ACTION_TYPES.CLEAR_NOTIFICATION }),

  // Async vocabulary actions
  loadWords: (options = {}) => async (dispatch) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_VOCABULARY_LOADING, payload: true });
      
      const result = await vocabularyAPI.getWords(options);
      
      dispatch({
        type: ACTION_TYPES.LOAD_WORDS_SUCCESS,
        payload: result
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_VOCABULARY_ERROR,
        payload: error.message
      });
    }
  },

  searchWords: (query) => async (dispatch) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_VOCABULARY_LOADING, payload: true });
      dispatch({ type: ACTION_TYPES.SET_SEARCH_QUERY, payload: query });
      
      const result = await vocabularyAPI.getWords({ search: query });
      
      dispatch({
        type: ACTION_TYPES.LOAD_WORDS_SUCCESS,
        payload: result
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_VOCABULARY_ERROR,
        payload: error.message
      });
    }
  },

  getRandomWord: () => async (dispatch) => {
    try {
      const randomWords = await vocabularyAPI.getRandomWords(1);
      if (randomWords.length > 0) {
        dispatch({
          type: ACTION_TYPES.SET_CURRENT_WORD,
          payload: randomWords[0]
        });
      }
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: error.message
      });
    }
  },

  // Authentication actions
  registerUser: async (dispatch, email, password, userData) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: true });
      
      const result = await authService.registerWithEmail(email, password, userData);
      
      if (result.success) {
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: result.user
        });
        dispatch({
          type: ACTION_TYPES.SET_NOTIFICATION,
          payload: {
            type: 'success',
            message: 'Account created successfully! Please check your email to verify your account.'
          }
        });
      } else {
        dispatch({
          type: ACTION_TYPES.SET_AUTH_ERROR,
          payload: result.error
        });
      }
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_AUTH_ERROR,
        payload: error.message
      });
    }
  },

  loginUser: async (dispatch, email, password, rememberMe = false) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: true });
      
      const result = await authService.loginWithEmail(email, password, rememberMe);
      
      if (result.success) {
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: result.user
        });
        dispatch({
          type: ACTION_TYPES.SET_NOTIFICATION,
          payload: {
            type: 'success',
            message: 'Login successful!'
          }
        });
      } else {
        dispatch({
          type: ACTION_TYPES.SET_AUTH_ERROR,
          payload: result.error
        });
      }
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_AUTH_ERROR,
        payload: error.message
      });
    }
  },

  loginWithGoogle: async (dispatch) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: true });
      
      const result = await authService.signInWithGoogle();
      
      if (result.success) {
        dispatch({
          type: ACTION_TYPES.SET_USER,
          payload: result.user
        });
        dispatch({
          type: ACTION_TYPES.SET_NOTIFICATION,
          payload: {
            type: 'success',
            message: 'Login successful!'
          }
        });
      } else {
        dispatch({
          type: ACTION_TYPES.SET_AUTH_ERROR,
          payload: result.error
        });
      }
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_AUTH_ERROR,
        payload: error.message
      });
    }
  },

  logoutUser: async (dispatch) => {
    try {
      await authService.logout();
      dispatch({ type: ACTION_TYPES.LOGOUT_USER });
      dispatch({
        type: ACTION_TYPES.SET_NOTIFICATION,
        payload: {
          type: 'success',
          message: 'Logged out successfully!'
        }
      });
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: error.message
      });
    }
  },

  resetPassword: async (dispatch, email) => {
    try {
      dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: true });
      
      const result = await authService.resetPassword(email);
      
      if (result.success) {
        dispatch({ type: ACTION_TYPES.SET_AUTH_LOADING, payload: false });
        dispatch({
          type: ACTION_TYPES.SET_NOTIFICATION,
          payload: {
            type: 'success',
            message: 'Password reset email sent! Please check your inbox.'
          }
        });
      } else {
        dispatch({
          type: ACTION_TYPES.SET_AUTH_ERROR,
          payload: result.error
        });
      }
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_AUTH_ERROR,
        payload: error.message
      });
    }
  },

  sendEmailVerification: async (dispatch) => {
    try {
      const result = await authService.sendEmailVerification();
      
      if (result.success) {
        dispatch({
          type: ACTION_TYPES.SET_NOTIFICATION,
          payload: {
            type: 'success',
            message: 'Verification email sent!'
          }
        });
      } else {
        dispatch({
          type: ACTION_TYPES.SET_ERROR,
          payload: result.error
        });
      }
    } catch (error) {
      dispatch({
        type: ACTION_TYPES.SET_ERROR,
        payload: error.message
      });
    }
  },

  clearAuthError: () => ({ type: ACTION_TYPES.CLEAR_AUTH_ERROR })
};
