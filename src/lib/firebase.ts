
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "sheetsifter",
  "appId": "1:194173945157:web:731144ab2f9edae32faa2c",
  "storageBucket": "sheetsifter.firebasestorage.app",
  "apiKey": "AIzaSyCQq4OfautpslqSxt7x2d7wPsZ3wglA2CE",
  "authDomain": "sheetsifter.firebaseapp.com",
  "messagingSenderId": "194173945157"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
