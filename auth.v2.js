// auth.v2.js (CDN Firebase v12, ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// --- CONFIG (tua) ---
const firebaseConfig = {
  apiKey: "AIzaSyDF6BiYXreDirGnT3RPkGwDNlwj5ploUyo",
  authDomain: "trappereo.firebaseapp.com",
  projectId: "trappereo",
  storageBucket: "trappereo.firebasestorage.app",
  messagingSenderId: "767231932063",
  appId: "1:767231932063:web:b1431de1c04bbe5dc0d4aa",
  measurementId: "G-BDBRZQ6J8S"
};

// --- APP BASE ---
export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// --- AUTH API ---
export async function emailSignUp(email, pwd) {
  return createUserWithEmailAndPassword(auth, email, pwd);
}
export async function emailSignIn(email, pwd) {
  return signInWithEmailAndPassword(auth, email, pwd);
}
export async function sendReset(email) {
  return sendPasswordResetEmail(auth, email);
}
export async function doSignOut() {
  return signOut(auth);
}
export function onUser(cb) {
  return onAuthStateChanged(auth, cb);
}
export async function setDisplayName(user, fullName){
  if (user && fullName) try { await updateProfile(user, { displayName: fullName }); } catch {}
}

// --- Ensure user doc ---
// Crea/aggiorna /users/{uid} con campi base. Idempotente.
export async function ensureUserDoc(u) {
  if (!u) return null;
  const ref = doc(db, "users", u.uid);
  const snap = await getDoc(ref);

  const base = {
    uid: u.uid,
    email: (u.email || "").toLowerCase(),
    name: (u.displayName || u.email || "").trim(),
    name_lc: (u.displayName || u.email || "").trim().toLowerCase(),
    role: "customer",
    status: "active"
  };

  if (!snap.exists()) {
    await setDoc(ref, { ...base, createdAt: Date.now(), updatedAt: Date.now() });
  } else {
    const cur = snap.data() || {};
    await setDoc(ref, {
      email: base.email || cur.email || "",
      name:  base.name  || cur.name  || "",
      name_lc: base.name_lc || cur.name_lc || "",
      updatedAt: Date.now()
    }, { merge: true });
  }
  const latest = await getDoc(ref);
  return latest.exists() ? latest.data() : null;
}

// --- Gate: deve essere loggato e con status === 'active'
export async function requireActiveUser(redirect = "./login.html") {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (u) => {
      if (!u) {
        const back = encodeURIComponent(location.pathname + location.search);
        location.href = `${redirect}?from=${back}`;
        return;
      }
      try {
        await ensureUserDoc(u);
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : {};
        if ((data.status || "active") !== "active") {
          alert("Il tuo account è sospeso. Contatta il supporto.");
          await signOut(auth);
          location.href = "./login.html";
          return;
        }
        resolve(u);
      } catch (e) {
        console.error(e);
        signOut(auth).finally(() => location.href = "./login.html");
      }
    });
  });
}
