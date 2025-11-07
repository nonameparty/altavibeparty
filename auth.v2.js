// auth.v2.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

console.log("AUTH V2 LOADED", new Date().toISOString());

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

// --- API usata dagli HTML ---
export function onUser(cb){ return onAuthStateChanged(auth, cb); }
export async function emailSignUp(email, pwd){ return createUserWithEmailAndPassword(auth, email, pwd); }
export async function emailSignIn(email, pwd){ return signInWithEmailAndPassword(auth, email, pwd); }
export async function sendReset(email){ return sendPasswordResetEmail(auth, email); }
export async function doSignOut(){ return signOut(auth); }
export async function setDisplayName(user, fullName){
  if(!user) return;
  try{ await updateProfile(user, { displayName: fullName }); }catch{}
}
export function saveDOB(uid, dobISO){
  if(uid && dobISO) localStorage.setItem(`trapperreo_profile_${uid}`, JSON.stringify({ dob: dobISO }));
}
export function loadProfile(uid){
  try{ return JSON.parse(localStorage.getItem(`trapperreo_profile_${uid}`) || "null"); }catch{ return null; }
}
export function calcAge(dobISO){
  const d=new Date(dobISO), t=new Date();
  let a=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth();
  if(m<0 || (m===0 && t.getDate()<d.getDate())) a--;
  return a;
}
export function requireAuth(redirect="login.html"){
  return new Promise(res => onAuthStateChanged(auth, (u)=>{
    if(!u){
      const back = encodeURIComponent(location.pathname + location.search);
      location.href = `${redirect}?from=${back}`;
    } else {
      res(u);
    }
  }));
}
