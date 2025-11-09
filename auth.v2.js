// auth.v2.js — versione minima/robusta
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc
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

// In auth.v2.js
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

export async function requireActiveUser(redirect="./login.html") {
  return new Promise(res => onAuthStateChanged(auth, async (u)=>{
    if(!u){
      const back = encodeURIComponent(location.pathname + location.search);
      location.href = `${redirect}?from=${back}`;
      return;
    }
    try{
      const db = getFirestore(app);
      const snap = await getDoc(doc(db,'users',u.uid));
      const data = snap.exists() ? snap.data() : {};
      if((data.status || 'active') !== 'active'){
        alert('Il tuo account è sospeso. Contatta il supporto.');
        await signOut(auth);
        location.href = './login.html';
        return;
      }
      res(u);
    }catch(e){
      // in caso di errore, meglio non dare accesso
      await signOut(auth);
      location.href = './login.html';
    }
  }));
}


export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ----------------- API base -----------------
export async function emailSignUp(email, pwd){ return createUserWithEmailAndPassword(auth, email, pwd); }
export async function emailSignIn(email, pwd){ return signInWithEmailAndPassword(auth, email, pwd); }
export async function sendReset(email){ return sendPasswordResetEmail(auth, email); }
export async function doSignOut(){ return signOut(auth); }
export function onUser(cb){ return onAuthStateChanged(auth, cb); }
export async function setDisplayName(user, fullName){
  if (user) try { await updateProfile(user, { displayName: fullName }); } catch {}
}

// ----------------- ensureUserDoc -----------------
// Crea/aggiorna SEMPRE /users/{uid} con campi minimi.
// NIENTE serverTimestamp per semplicità: usiamo Date.now().
export async function ensureUserDoc(u, extra = {}){
  if (!u) return null;
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);

  const baseName = (u.displayName || u.email || '').trim();
  const patchBase = {
    uid: u.uid,
    email: u.email || null,
    name: baseName,
    name_lc: baseName.toLowerCase(),
    role: 'customer',
    status: 'active',
    createdAt: Date.now()
  };

  if (!snap.exists()) {
    await setDoc(ref, { ...patchBase, ...extra }, { merge:true });
    return (await getDoc(ref)).data();
  }

  const cur = snap.data() || {};
  const patch = {...extra};
  if (!cur.createdAt) patch.createdAt = Date.now();
  if (cur.name && !cur.name_lc) patch.name_lc = String(cur.name).toLowerCase();
  if (Object.keys(patch).length) await setDoc(ref, patch, { merge:true });
  return (await getDoc(ref)).data();
}
