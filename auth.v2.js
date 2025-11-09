// auth.v2.js  (JS puro, nessun <script>!)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, updateProfile,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp,
  collection, getDocs, addDoc, updateDoc
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

// === Founder helper (client) ===
export async function isFounderClient(email, uid){
  try{
    const cfg = await getDoc(doc(db,'config','admins'));
    const founders = cfg.exists() ? (cfg.data().founders || {}) : {};
    if (founders[(email||'').toLowerCase()] === true) return true;
  }catch(_){}
  try{
    const me = await getDoc(doc(db,'users', uid));
    return me.exists() && (me.data().role === 'founder');
  }catch(_){}
  return false;
}

// === CSV lato client ===
export function toCSV(rows){
  if(!rows?.length) return "";
  const headers = Array.from(new Set(rows.flatMap(r=>Object.keys(r))));
  const esc = v => {
    const s = (v ?? "").toString().replace(/"/g,'""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.map(esc).join(","), ...rows.map(r=>headers.map(h=>esc(r[h])).join(","))].join("\n");
}
export function downloadCSV(filename, rows){
  const blob = new Blob([toCSV(rows)], { type:"text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href:url, download:filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

// === SHA-256 per codici sconto sicuri ===
export async function sha256Hex(s){
  const enc = new TextEncoder().encode(s);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join("");
}

// === Codici sconto (create/list/toggle) ===
export async function createDiscountCode({ plainCode, label, type, amount, appliesTo, userId }){
  const u = auth.currentUser;
  if(!u) throw new Error("not-signed-in");
  if(!(await isFounderClient(u.email, u.uid))) throw new Error("forbidden");
  const hash = await sha256Hex(plainCode);
  await setDoc(doc(db,"discountCodes",hash), {
    label,
    type,              // "percent" | "fixed"
    amount,            // numero
    appliesTo,         // "all" | "user"
    userId: appliesTo==="user" ? (userId || u.uid) : null,
    maxRedemptions: appliesTo==="user" ? 1 : 999999,
    redeemedCount: 0,
    active: true,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge:true });
  return hash; // NON salviamo il codice in chiaro
}

export async function listDiscountCodes(){
  const u = auth.currentUser;
  if(!u) throw new Error("not-signed-in");
  if(!(await isFounderClient(u.email, u.uid))) throw new Error("forbidden");
  const snap = await getDocs(collection(db,"discountCodes"));
  const out = [];
  snap.forEach(d => out.push({ id:d.id, ...(d.data()||{}) }));
  // ordina attivi prima, poi per updatedAt desc
  out.sort((a,b)=>{
    const act = (b.active===true) - (a.active===true);
    const ta  = (a.updatedAt?.seconds||a.createdAt?.seconds||0);
    const tb  = (b.updatedAt?.seconds||b.createdAt?.seconds||0);
    return act || (tb - ta);
  });
  return out;
}

export async function setDiscountActive(hash, active){
  const u = auth.currentUser;
  if(!u) throw new Error("not-signed-in");
  if(!(await isFounderClient(u.email, u.uid))) throw new Error("forbidden");
  await updateDoc(doc(db,"discountCodes",hash), {
    active: !!active,
    updatedAt: serverTimestamp()
  });
  return true;
}

// === Omaggi ===
export async function createGiftTicket(targetUid, { eventId, note } = {}){
  const u = auth.currentUser;
  if(!u) throw new Error("not-signed-in");
  if(!(await isFounderClient(u.email, u.uid))) throw new Error("forbidden");
  await addDoc(collection(db, "users", targetUid, "tickets"), {
    type: "omaggio",
    status: "active",
    eventId: eventId || "event-001",
    note: note || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return true;
}

// === Ordini (client-only) ===
// items: [{ sku:"EB|STD|FAST|VIP", qty:number, price:number }]
export async function createOrder({ items, total, enteredCode, eventId }){
  const u = auth.currentUser;
  if(!u) throw new Error("not-signed-in");

  const payload = {
    items,
    total,
    createdAt: serverTimestamp()
  };
  if(enteredCode){
    payload.discountHash = await sha256Hex(enteredCode); // validato dalle rules
  }
  const orderRef = await addDoc(collection(db,"users",u.uid,"orders"), payload);

  const mapType = sku => ({ EB:"early_bird", STD:"standard", FAST:"fast_entry", VIP:"vip_entry" }[sku] || "standard");
  const ts = serverTimestamp();
  for(const it of items){
    const t = mapType(it.sku);
    for(let i=0;i<Number(it.qty||0);i++){
      await addDoc(collection(db,"users",u.uid,"tickets"), {
        type: t,
        status: "active",
        eventId: eventId || "event-001",
        orderId: orderRef.id,
        createdAt: ts,
        updatedAt: ts
      });
    }
  }
  return orderRef.id;
}

// === Export CSV (founder) ===
export async function exportUsersCSV(){
  const u = auth.currentUser; if(!u) throw new Error("not-signed-in");
  if(!(await isFounderClient(u.email,u.uid))) throw new Error("forbidden");
  const snap = await getDocs(collection(db,"users"));
  const rows = [];
  snap.forEach(d=>{
    const v = d.data()||{};
    rows.push({ uid:d.id, name:v.name||"", email:v.email||"", role:v.role||"", status:v.status||"" });
  });
  downloadCSV("users.csv", rows);
  return rows.length;
}

console.log("AUTH LOADED OK");
