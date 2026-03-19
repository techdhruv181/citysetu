import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDddsNtq-D8bjH7EEaZzM03FIxWipGlXqM",
  authDomain: "citysetu-de92b.firebaseapp.com",
  projectId: "citysetu-de92b",
  storageBucket: "citysetu-de92b.firebasestorage.app",
  messagingSenderId: "636490275147",
  appId: "1:636490275147:web:2e741b9f2579634ad030ce"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
console.log("🔥 Firebase File Loaded");