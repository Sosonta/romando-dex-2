// Replace with your own config values from Firebase Console
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyAftZI2JkFM6GBkANoECCS1V7hapgx3q5w",

  authDomain: "romando-dex-2.firebaseapp.com",

  projectId: "romando-dex-2",

  storageBucket: "romando-dex-2.firebasestorage.app",

  messagingSenderId: "229132141413",

  appId: "1:229132141413:web:d62d5b7654debd5553978c"

};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
