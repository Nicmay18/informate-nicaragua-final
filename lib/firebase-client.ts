import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDVsqRGr7dtdi5ecO14THIdbnEzZKOJxcA',
  authDomain: 'informate-instant-nicaragua.firebaseapp.com',
  projectId: 'informate-instant-nicaragua',
  storageBucket: 'informate-instant-nicaragua.firebasestorage.app',
  messagingSenderId: '24988088146',
  appId: '1:24988088146:web:d26a207508da055668ec8b',
  measurementId: 'G-W1B5J61WEP',
};

export function getFirebaseApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

export const db = getFirestore(getFirebaseApp());

let _db: Firestore | null = null;
export function getClientDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}
