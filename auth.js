// ======= Firebase SDK (modular CDN v12.5.0) =======
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

// === Configurazione del tuo progetto Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyDF6BiYXreDirGnT3RPkGwDNlwj5ploUyo",
  authDomain: "trappereo.firebaseapp.com",
  projectId: "trappereo",
  storageBucket: "trappereo.firebasestorage.app",
  messagingSenderId: "767231932063",
  appId: "1:767231932063:web:b1431de1c04bbe5dc0d4aa",
  measurementId: "G-BDBRZQ6J8S"
};
// ===============================================

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// --- Funzioni di autenticazione ---
export async function emailSignUp(email, password) {
  return await createUserWithEmailAndPassword(auth, email, password);
}
export async function emailSignIn(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}
export async function sendReset(email) {
  return await sendPasswordResetEmail(auth, email);
}
export async function doSignOut() {
  return await signOut(auth);
}
export function onUser(cb) {
  return onAuthStateChanged(auth, cb);
}

// --- Protezione per pagine private ---
export function requireAuth(redirectTo = "login.html") {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        const back = encodeURIComponent(location.pathname + location.search);
        location.href = `${redirectTo}?from=${back}`;
      } else resolve(user);
    });
  });
}
