
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "sheetsifter",
  "appId": "1:194173945157:web:731144ab2f9edae32faa2c",
  "storageBucket": "sheetsifter.firebasestorage.app",
  "apiKey": "AIzaSyCQq4OfautpslqSxt7x2d7wPsZ3wglA2CE",
  "authDomain": "sheetsifter.firebaseapp.com",
  "messagingSenderId": "194173945157"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
