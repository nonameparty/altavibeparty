import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDF6BiYXreDirGnT3RPkGwDNlwj5ploUyo",
  authDomain: "trappereo.firebaseapp.com",
  projectId: "trappereo",
  storageBucket: "trappereo.firebasestorage.app",
  messagingSenderId: "767231932063",
  appId: "1:767231932063:web:b1431de1c04bbe5dc0d4aa",
  measurementId: "G-BDBRZQ6J8S"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// exports usati nei tuoi HTML
export async function emailSignUp(e,p){ return createUserWithEmailAndPassword(auth,e,p); }
export async function emailSignIn(e,p){ return signInWithEmailAndPassword(auth,e,p); }
export async function sendReset(e){ return sendPasswordResetEmail(auth,e); }
export async function doSignOut(){ return signOut(auth); }
export function onUser(cb){ return onAuthStateChanged(auth, cb); }
export function requireAuth(redirect="login.html"){
  return new Promise(res=>onAuthStateChanged(auth,u=>{
    if(!u){ const back=encodeURIComponent(location.pathname+location.search);
            location.href=`${redirect}?from=${back}`; }
    else res(u);
  }));
}
