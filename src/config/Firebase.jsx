// Importing necessary Firebase modules and functions
import { initializeApp } from "firebase/app"; // Importing initializeApp function from firebase/app
import {
  getFirestore, // Importing getFirestore function from firebase/firestore
} from "firebase/firestore";
import {
  getAuth, // Importing getAuth function from firebase/auth
} from "firebase/auth";
import { getStorage } from "firebase/storage"; // Importing getStorage function from firebase/storage
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_REACT_APP_apiKey, // API key from environment variables
  authDomain: import.meta.env.VITE_REACT_APP_authDomain, // Auth domain from environment variables
  projectId: import.meta.env.VITE_REACT_APP_projectId, // Project ID from environment variables
  storageBucket: import.meta.env.VITE_REACT_APP_storageBucket, // Storage bucket from environment variables
  messagingSenderId: import.meta.env.VITE_REACT_APP_messagingSenderId, // Messaging sender ID from environment variables
  appId: import.meta.env.VITE_REACT_APP_appId, // App ID from environment variables
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();
const storage = getStorage(app);
const functions = getFunctions();

// connectFunctionsEmulator(functions, "127.0.0.1", 5001);

export {
  app, // Exporting initialized Firebase app
  db, // Exporting initialized Firestore database
  auth, // Exporting initialized Firebase authentication
  storage, // Exporting initialized Firebase storage
  functions,
};
