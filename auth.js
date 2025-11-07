// /auth.js  (modulo ES puro — nessun <script> qui dentro!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, updateProfile
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

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
await setPersistence(auth, browserLocalPersistence);

// API che usano le tue pagine
export const emailSignUp   = (e,p) => createUserWithEmailAndPassword(auth,e,p);
export const emailSignIn   = (e,p) => signInWithEmailAndPassword(auth,e,p);
export const sendReset     = (e)   => sendPasswordResetEmail(auth,e);
export const doSignOut     = ()    => signOut(auth);
export const onUser        = (cb)  => onAuthStateChanged(auth, cb);
export const setDisplayName= (u,n) => updateProfile(u, { displayName: n });

export function saveDOB(uid, dobISO){
  if(uid && dobISO) localStorage.setItem(`trapperreo_profile_${uid}`, JSON.stringify({ dob: dobISO }));
}
export function loadProfile(uid){
  try{ return JSON.parse(localStorage.getItem(`trapperreo_profile_${uid}`) || "null"); }catch{ return null }
}
export function calcAge(dobISO){
  const d=new Date(dobISO), t=new Date();
  let a=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth();
  if(m<0||(m===0&&t.getDate()<d.getDate())) a--;
  return a;
}
export function requireAuth(redirect="/login.html"){
  return new Promise(res=>onAuthStateChanged(auth,(u)=>{
    if(!u){
      const back=encodeURIComponent(location.pathname+location.search);
      location.href=`${redirect}?from=${back}`;
    } else res(u);
  }));
}
