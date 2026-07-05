/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Environment variables template for Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if variables are valid and present
export const isFirebaseReady = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app;
let auth: any = null;
let db: any = null;
const googleProvider = new GoogleAuthProvider();

if (isFirebaseReady) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[Firebase Connection] Connected successfully to Cloud project:', firebaseConfig.projectId);
  } catch (err) {
    console.error('[Firebase Connection] Failed to initialize SDK:', err);
  }
} else {
  console.warn(
    '[Firebase Connection] Environment variables missing. Running in Sandbox Fallback (SQLite/FastAPI) mode.'
  );
}

export { app, auth, db, googleProvider };
