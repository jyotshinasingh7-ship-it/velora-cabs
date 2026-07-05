import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Added GoogleAuthProvider
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdzZNZrgIZetLJaHtgggfm2cCzs5niT-w",
  authDomain: "velora-cabs.firebaseapp.com",
  projectId: "velora-cabs",
  storageBucket: "velora-cabs.firebasestorage.app",
  messagingSenderId: "754037888454",
  appId: "1:754037888454:web:02ee2dc635b1869854cec7",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider(); // Added this line

export default app;