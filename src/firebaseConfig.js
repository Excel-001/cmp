/* eslint-disable no-undef */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDPWKMDffw5iAMaYcWIaoifWOIx3n4Pd1s",
    authDomain: "campusmarketplace-52a0e.firebaseapp.com",
    projectId: "campusmarketplace-52a0e",
    storageBucket: "campusmarketplace-52a0e.appspot.com",
    messagingSenderId: "476944649881",
    appId: "1:476944649881:web:26ec6861ad22bc8e89f208",
    measurementId: "G-PQ6M6VHD8P"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export { auth, db, appId };

