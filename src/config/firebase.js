import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connect to emulators in development (optional)
if (import.meta.env.DEV && !import.meta.env.VITE_USE_FIREBASE_PROD) {
  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firestore emulator');
    
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://localhost:9099');
    console.log('Connected to Auth emulator');
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Storage emulator');
  } catch (error) {
    console.log('Firebase emulators not available, using production');
  }
}

export default app;
