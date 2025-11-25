import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore"; // Import Firestore persistence functions
import { getStorage } from "firebase/storage"; // Import Firebase Storage

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyADkPx2syGdRD08m4nE5SnLbNfDnW58jOs",
  authDomain: "campuspark-ru.firebaseapp.com",
  projectId: "campuspark-ru",
  storageBucket: "campuspark-ru.appspot.com",
  messagingSenderId: "791070736327",
  appId: "1:791070736327:web:2371d7406a55f6ffbea3e2",
  measurementId: "G-6FJWF2J8D9"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firestore with persistent local cache
// This enables offline capabilities by storing data in IndexedDB
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Initialize Firebase Storage
const storage = getStorage(app); // Add Firebase Storage initialization

console.log("Firebase initialized with Authentication, Firestore, and Storage.");

// Export Firebase services (auth, db, storage) for use in other files
export { auth, db, storage }; // Now exporting storage
