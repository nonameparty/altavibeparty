// auth.v2.js  (JS puro, nessun <script>!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp
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

// API base
export const emailSignUp  = (email, pwd) => createUserWithEmailAndPassword(auth, email, pwd);
export const emailSignIn  = (email, pwd) => signInWithEmailAndPassword(auth, email, pwd);
export const sendReset    = (email)      => sendPasswordResetEmail(auth, email);
export const doSignOut    = ()           => signOut(auth);
export const onUser       = (cb)         => onAuthStateChanged(auth, cb);
export async function setDisplayName(user, fullName){ if(user) try{ await updateProfile(user,{displayName:fullName}); }catch{} }

// Helpers opzionali
export function calcAge(dobISO){
  const d=new Date(dobISO), t=new Date();
  let a=t.getFullYear()-d.getFullYear();
  const m=t.getMonth()-d.getMonth();
  if(m<0 || (m===0 && t.getDate()<d.getDate())) a--;
  return a;
}

// Firestore: garantisce /users/{uid}
export async function ensureUserDoc(u, extras = {}){
  if(!u) return null;
  const ref = doc(db, 'users', u.uid);
  const snap = await getDoc(ref);

  const baseName = (u.displayName || u.email || '').trim();
  const payload = {
    uid: u.uid,
    email: (u.email || '').toLowerCase(),
    name: baseName,
    name_lc: baseName.toLowerCase(),
    role: 'customer',
    status: 'active',
    updatedAt: serverTimestamp(),
    ...extras
  };

  if(!snap.exists()){
    await setDoc(ref, { ...payload, createdAt: serverTimestamp() }, { merge: true });
  } else {
    const cur = snap.data() || {};
    await setDoc(ref, {
      email: payload.email || cur.email || '',
      name:  payload.name  || cur.name  || '',
      name_lc: payload.name_lc || cur.name_lc || '',
      role: cur.role || 'customer',
      status: cur.status || 'active',
      updatedAt: serverTimestamp(),
      ...extras
    }, { merge: true });
  }
  return (await getDoc(ref)).data();
}

// Richiede login + status attivo
export function requireActiveUser(redirect = "./login.html"){
  return new Promise(res => onAuthStateChanged(auth, async (u)=>{
    if(!u){
      const back = encodeURIComponent(location.pathname + location.search);
      location.href = `${redirect}?from=${back}`;
      return;
    }
    try{
      await ensureUserDoc(u);
      const snap = await getDoc(doc(db,'users',u.uid));
      const data = snap.exists() ? snap.data() : {};
      if((data.status||'active') !== 'active'){
        alert('Il tuo account è sospeso. Contatta il supporto.');
        await signOut(auth);
        location.href = './login.html';
        return;
      }
      res(u);
    }catch(e){
      console.error(e);
      await signOut(auth);
      location.href = './login.html';
    }
  }));
}

// debug visivo: puoi toglierlo
console.log("AUTH LOADED OK");
