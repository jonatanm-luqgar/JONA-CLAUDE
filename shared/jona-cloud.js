// JONA OS · Núcleo de nube compartido (Firebase)
// Un único punto de conexión para PMI, Agenda y RPG: misma configuración,
// mismo SDK, misma autenticación anónima persistente y misma estrategia de red.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  initializeAuth, getAuth, onAuthStateChanged, signInAnonymously,
  indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache,
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: "AIzaSyAuF2OvAs27Wu2pb-ymXmBkGe_5iUtHYOE",
  authDomain: "gggg-5dc02.firebaseapp.com",
  projectId: "gggg-5dc02",
  storageBucket: "gggg-5dc02.firebasestorage.app",
  messagingSenderId: "400115523734",
  appId: "1:400115523734:web:cfe1b053caed2f1a2162b7",
  measurementId: "G-66J2422Q5D"
};

// Rutas compartidas por todos los dispositivos (constantes: nada que configurar a mano).
export const PATHS = { pmiUser: 'shared', agendaKey: 'jona-os-shared', rpgDoc: 'shared' };

export const app = initializeApp(firebaseConfig);

// Auth: varias capas de persistencia para que Chrome iOS / Android / Safari no pierdan la sesión.
export let auth;
try {
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence] });
} catch (e) {
  auth = getAuth(app);
}

// Firestore: caché offline persistente (escribe sin conexión y sube al volver) +
// detección automática de long-polling (redes/navegadores que bloquean WebChannel).
export let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true
  });
} catch (e1) {
  try {
    db = initializeFirestore(app, { localCache: memoryLocalCache(), experimentalAutoDetectLongPolling: true });
  } catch (e2) {
    db = getFirestore(app);
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
const waitOnline = () => navigator.onLine ? Promise.resolve() : new Promise(r => window.addEventListener('online', r, { once: true }));
const firstAuthState = () => new Promise((resolve, reject) => {
  const un = onAuthStateChanged(auth, u => { un(); resolve(u); }, err => { un(); reject(err); });
});

// Conexión automática: restaura la sesión guardada o crea una anónima.
// Reintenta con espera creciente hasta lograrlo; nunca requiere acción del usuario.
async function connect() {
  let attempt = 0;
  for (;;) {
    try {
      const restored = await firstAuthState();
      if (restored) return restored;
      return (await signInAnonymously(auth)).user;
    } catch (err) {
      attempt++;
      console.warn('[JONA Cloud] reintentando conexión', attempt, err && (err.code || err.message));
      if (!navigator.onLine) await waitOnline();
      else await sleep(Math.min(1000 * 2 ** Math.min(attempt, 4), 15000));
    }
  }
}
export const ready = connect();

// Si la sesión se perdiera, se recrea sola.
onAuthStateChanged(auth, u => { if (!u) signInAnonymously(auth).catch(() => {}); });

export function onUser(cb) { return onAuthStateChanged(auth, cb); }

// Estado de red simple para mostrar en la interfaz.
export function watchOnline(cb) {
  const f = () => cb(navigator.onLine);
  window.addEventListener('online', f); window.addEventListener('offline', f); f();
}

export { collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp };
