import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCAeH2-P1MQVHkLg8kPii16b0K5wo8Tnio",
  authDomain: "gen-lang-client-0358631232.firebaseapp.com",
  projectId: "gen-lang-client-0358631232",
  storageBucket: "gen-lang-client-0358631232.firebasestorage.app",
  messagingSenderId: "675189112756",
  appId: "1:675189112756:web:0348fe7bb1d0edf9e07ce1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export { signInWithPopup, signOut };
