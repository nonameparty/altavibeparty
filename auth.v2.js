// auth.v2.js (esteso, compatibile con le tue API)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDF6BiYXreDirGnT3RPkGwDNlwj5ploUyo",
  authDomain: "trappereo.firebaseapp.com",
  projectId: "trappereo",
  storageBucket: "trappereo.firebasestorage.app",
  messagingSenderId: "767231932063",
  appId: "1:767231932063:web:b1431de1c04bbe5dc0d4aa",
  measurementId: "G-BDBRZQ6J8S"
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ---------- API esistenti ----------
export async function emailSignUp(email, pwd){ return createUserWithEmailAndPassword(auth, email, pwd); }
export async function emailSignIn(email, pwd){ return signInWithEmailAndPassword(auth, email, pwd); }
export async function sendReset(email){ return sendPasswordResetEmail(auth, email); }
export async function doSignOut(){ return signOut(auth); }
export function onUser(cb){ return onAuthStateChanged(auth, cb); }
export async function setDisplayName(user, fullName){ if(user) try{ await updateProfile(user,{displayName:fullName}); }catch{} }

// Local-only DOB (resta per retrocompatibilità)
export function saveDOB(uid, dobISO){
  if(!uid || !dobISO) return;
  localStorage.setItem(`trapperreo_profile_${uid}`, JSON.stringify({ dob: dobISO }));
}
export function loadProfile(uid){
  try { return JSON.parse(localStorage.getItem(`trapperreo_profile_${uid}`) || "null"); }
  catch { return null; }
}
export function calcAge(dobISO){
  const d=new Date(dobISO), t=new Date();
  let a=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth();
  if(m<0 || (m===0 && t.getDate()<d.getDate())) a--;
  return a;
}
export function requireAuth(redirect="./login.html"){
  return new Promise(res => onAuthStateChanged(auth, u=>{
    if(!u){
      const back = encodeURIComponent(location.pathname + location.search);
      location.href = `${redirect}?from=${back}`;
    } else { res(u); }
  }));
}

// ---------- NUOVI helper Firestore (opzionali) ----------
export async function ensureUserDoc(u){
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref, {
      uid: u.uid,
      name: (u.displayName || u.email || '').trim(),
      email: u.email || null,
      dob: null,
      role: 'customer',
      createdAt: Date.now()
    });
    return (await getDoc(ref)).data();
  }
  return snap.data();
}

export async function getUserDoc(uid){
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function listMyTickets(uid){
  const q = query(collection(db, 'orders'), where('uid','==',uid), where('status','==','active'));
  const qs = await getDocs(q);
  const out = [];
  for(const d of qs.docs){
    const orderId = d.id;
    const tSnap = await getDocs(collection(db, `orders/${orderId}/tickets`));
    tSnap.forEach(t=> out.push({ orderId, ticketId: t.id, ...t.data() }));
  }
  return out;
}
