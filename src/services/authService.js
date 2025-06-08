import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
  }

  // Initialize auth state listener
  initializeAuthListener(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get additional user data from Firestore
        const userDoc = await this.getUserProfile(user.uid);
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified,
          ...userDoc
        };
      } else {
        this.currentUser = null;
      }
      callback(this.currentUser);
    });
  }

  // User Registration with Email/Password
  async registerWithEmail(email, password, userData = {}) {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      if (userData.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName
        });
      }

      // Create user document in Firestore
      await this.createUserProfile(user.uid, {
        email: user.email,
        displayName: userData.displayName || '',
        createdAt: new Date().toISOString(),
        learningPreferences: {
          dailyGoal: 10,
          difficulty: 'medium',
          soundEnabled: true,
          theme: 'light',
          language: 'en'
        },
        progress: {
          totalWordsLearned: 0,
          currentLevel: 1,
          streakDays: 0,
          lastActiveDate: new Date().toISOString()
        },
        ...userData
      });

      // Send email verification
      await this.sendEmailVerification();

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // User Login with Email/Password
  async loginWithEmail(email, password, rememberMe = false) {
    try {
      // Set persistence based on remember me option
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last active date
      await this.updateUserProfile(user.uid, {
        lastActiveDate: new Date().toISOString()
      });

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Google Sign In
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists, create if not
      const userProfile = await this.getUserProfile(user.uid);
      if (!userProfile) {
        await this.createUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          provider: 'google',
          learningPreferences: {
            dailyGoal: 10,
            difficulty: 'medium',
            soundEnabled: true,
            theme: 'light',
            language: 'en'
          },
          progress: {
            totalWordsLearned: 0,
            currentLevel: 1,
            streakDays: 0,
            lastActiveDate: new Date().toISOString()
          }
        });
      } else {
        // Update last active date
        await this.updateUserProfile(user.uid, {
          lastActiveDate: new Date().toISOString()
        });
      }

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // User Logout
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Send Email Verification
  async sendEmailVerification() {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { success: true };
      }
      throw new Error('No user signed in');
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  // Create user profile in Firestore
  async createUserProfile(uid, userData) {
    try {
      await setDoc(doc(db, 'users', uid), userData);
      return { success: true };
    } catch (error) {
      console.error('Error creating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user profile from Firestore
  async getUserProfile(uid) {
    if (!uid) {
      console.warn('No UID provided to getUserProfile');
      return null;
    }

    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      // Silently handle permission errors during development
      if (error.code === 'permission-denied') {
        console.warn('Firestore permissions not configured for development. Using default user data.');
        return {
          preferences: {
            theme: 'light',
            soundEnabled: true,
            difficulty: 'medium'
          },
          learningStats: {
            currentLevel: 1,
            totalWordsLearned: 0,
            streakDays: 0
          }
        };
      }
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Update user profile in Firestore
  async updateUserProfile(uid, updateData) {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, updateData);
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Error handling
  handleAuthError(error) {
    const errorMessages = {
      'auth/user-not-found': 'No user found with this email address.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
      'auth/cancelled-popup-request': 'Sign-in was cancelled.',
      'auth/popup-blocked': 'Sign-in popup was blocked by the browser.'
    };

    return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password) {
    const errors = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new AuthService();
