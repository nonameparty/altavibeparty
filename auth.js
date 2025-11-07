import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile,
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

// funzioni che signup.html importa (devono esistere!)
export async function emailSignUp(e,p){ return createUserWithEmailAndPassword(auth,e,p); }
export async function emailSignIn(e,p){ return signInWithEmailAndPassword(auth,e,p); }
export async function sendReset(e){ return sendPasswordResetEmail(auth,e); }
export async function doSignOut(){ return signOut(auth); }
export function onUser(cb){ return onAuthStateChanged(auth, cb); }
export async function setDisplayName(user, fullName){ try{ await updateProfile(user,{displayName:fullName}); }catch{} }
export function saveDOB(uid, dobISO){ if(uid && dobISO) localStorage.setItem(`trapperreo_profile_${uid}`, JSON.stringify({dob:dobISO})); }
export function calcAge(d){ const x=new Date(d), t=new Date(); let a=t.getFullYear()-x.getFullYear(); const m=t.getMonth()-x.getMonth(); if(m<0||(m===0&&t.getDate()<x.getDate())) a--; return a; }
import {
  getAuth, onAuthStateChanged, updateProfile,
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

// funzioni che signup.html importa (devono esistere!)
export async function emailSignUp(e,p){ return createUserWithEmailAndPassword(auth,e,p); }
export async function emailSignIn(e,p){ return signInWithEmailAndPassword(auth,e,p); }
export async function sendReset(e){ return sendPasswordResetEmail(auth,e); }
export async function doSignOut(){ return signOut(auth); }
export function onUser(cb){ return onAuthStateChanged(auth, cb); }
export async function setDisplayName(user, fullName){ try{ await updateProfile(user,{displayName:fullName}); }catch{} }
export function saveDOB(uid, dobISO){ if(uid && dobISO) localStorage.setItem(`trapperreo_profile_${uid}`, JSON.stringify({dob:dobISO})); }
export function calcAge(d){ const x=new Date(d), t=new Date(); let a=t.getFullYear()-x.getFullYear(); const m=t.getMonth()-x.getMonth(); if(m<0||(m===0&&t.getDate()<x.getDate())) a--; return a; }import {
  getAuth, onAuthStateChanged, updateProfile,
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
  // Salva displayName nell'utente (nome visibile)
export async function setDisplayName(user, fullName){
  if(!user) return;
  try{ await updateProfile(user, { displayName: fullName }); }catch(_){}
}

// Salva DOB localmente (per ora, senza Firestore)
export function saveDOB(uid, dobISO){
  if(!uid || !dobISO) return;
  localStorage.setItem(`trapperreo_profile_${uid}`, JSON.stringify({ dob: dobISO }));
}
export function loadProfile(uid){
  try{ return JSON.parse(localStorage.getItem(`trapperreo_profile_${uid}`) || "null"); }catch{return null}
}

// Utility per età
export function calcAge(dobISO){
  const d=new Date(dobISO); const t=new Date();
  let a=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth();
  if(m<0 || (m===0 && t.getDate()<d.getDate())) a--;
  return a;
}
}
