import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAxbS2SBj0uqDTuSQBg_9ciFmxBcxu3VeE",
  authDomain: "bolaocopa2026-2880d.firebaseapp.com",
  projectId: "bolaocopa2026-2880d",
  storageBucket: "bolaocopa2026-2880d.firebasestorage.app",
  messagingSenderId: "842355163421",
  appId: "1:842355163421:web:1107836d356fdd199aa1f4"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { auth, db };