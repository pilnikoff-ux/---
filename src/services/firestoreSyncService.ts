import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  db,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  FirebaseUser,
} from './firebase';
import { JournalEntry, UserProfile } from '../types';
import { getUserProfile, saveUserProfile } from './userStatsService';
import { getJournalEntries, saveJournalEntriesDirectly } from './storageService';

export interface FirestoreSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  currentUser: FirebaseUser | null;
  lastSyncedAt: string | null;
  error: string | null;
}

let syncStatusListeners: ((status: FirestoreSyncStatus) => void)[] = [];
let currentStatus: FirestoreSyncStatus = {
  isConnected: false,
  isSyncing: false,
  currentUser: auth.currentUser,
  lastSyncedAt: localStorage.getItem('psych_nav_firestore_last_sync'),
  error: null,
};

function notifyStatus() {
  syncStatusListeners.forEach((l) => l({ ...currentStatus }));
}

export function subscribeToFirestoreSync(listener: (status: FirestoreSyncStatus) => void) {
  syncStatusListeners.push(listener);
  listener({ ...currentStatus });
  return () => {
    syncStatusListeners = syncStatusListeners.filter((l) => l !== listener);
  };
}

export function getFirestoreSyncStatus(): FirestoreSyncStatus {
  return { ...currentStatus };
}

/**
 * Initializes Firebase Auth state listener and auto-syncs on login
 */
export function initFirebaseAuth(onUserChange?: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    currentStatus.currentUser = firebaseUser;
    currentStatus.isConnected = !!firebaseUser;
    notifyStatus();

    if (firebaseUser) {
      // Sync or create user profile in Firestore
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const existingProfile = getUserProfile();

        const profileData: UserProfile = {
          id: firebaseUser.uid,
          login: existingProfile?.login || firebaseUser.email?.split('@')[0] || 'user',
          fullName: firebaseUser.displayName || existingProfile?.fullName || existingProfile?.name || 'Користувач',
          name: firebaseUser.displayName || existingProfile?.name || 'Користувач',
          email: firebaseUser.email || existingProfile?.email || '',
          avatarUrl: firebaseUser.photoURL || existingProfile?.avatarUrl || '',
          authProvider: 'google',
          dateOfBirth: existingProfile?.dateOfBirth || '',
          fieldOfActivity: existingProfile?.fieldOfActivity || '',
          registeredAt: existingProfile?.registeredAt || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, profileData, { merge: true });
        saveUserProfile(profileData);

        // Perform initial sync of journal entries
        await syncFirestoreJournal(firebaseUser.uid);
      } catch (err) {
        console.warn('Firestore initial user sync note:', err);
      }
    }

    if (onUserChange) {
      onUserChange(firebaseUser);
    }
  });
}

/**
 * Sign in with Google using Firebase Authentication Popup
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  currentStatus.isSyncing = true;
  currentStatus.error = null;
  notifyStatus();

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    currentStatus.currentUser = user;
    currentStatus.isConnected = true;
    currentStatus.isSyncing = false;
    notifyStatus();

    // Sync journal entries after successful login
    await syncFirestoreJournal(user.uid);

    return { success: true, user };
  } catch (err: any) {
    console.error('Google Sign-In error:', err);
    currentStatus.isSyncing = false;
    currentStatus.error = err.message || 'Помилка авторизації Google';
    notifyStatus();
    return { success: false, error: err.message };
  }
}

/**
 * Sign out from Firebase
 */
export async function signOutFromGoogle(): Promise<void> {
  await signOut(auth);
  currentStatus.currentUser = null;
  currentStatus.isConnected = false;
  notifyStatus();
}

/**
 * Full bidirectional synchronization of journal entries with Firestore
 */
export async function syncFirestoreJournal(userId: string): Promise<{
  success: boolean;
  count: number;
  error?: string;
}> {
  if (!userId) {
    return { success: false, count: 0, error: 'User ID is missing' };
  }

  currentStatus.isSyncing = true;
  currentStatus.error = null;
  notifyStatus();

  try {
    const entriesColRef = collection(db, 'users', userId, 'journal_entries');
    const localEntries = getJournalEntries(userId);

    // 1. Fetch remote entries from Firestore
    const querySnapshot = await getDocs(entriesColRef);
    const remoteEntries: JournalEntry[] = [];
    querySnapshot.forEach((docSnap) => {
      remoteEntries.push(docSnap.data() as JournalEntry);
    });

    // 2. Merge local and remote entries by ID
    const mergedMap = new Map<string, JournalEntry>();

    // Add remote entries
    remoteEntries.forEach((entry) => {
      if (entry && entry.id) {
        mergedMap.set(entry.id, entry);
      }
    });

    // Merge local entries (uploading any missing locally created entries)
    const uploadsToFirestore: Promise<void>[] = [];

    localEntries.forEach((entry) => {
      if (entry && entry.id) {
        const existing = mergedMap.get(entry.id);
        if (!existing) {
          // Local entry doesn't exist remotely - push to Firestore
          mergedMap.set(entry.id, entry);
          const docRef = doc(db, 'users', userId, 'journal_entries', entry.id);
          uploadsToFirestore.push(setDoc(docRef, { ...entry, userId }, { merge: true }));
        } else {
          // Both exist - compare timestamps
          const localTime = new Date(entry.date || 0).getTime();
          const remoteTime = new Date(existing.date || 0).getTime();
          if (localTime > remoteTime) {
            mergedMap.set(entry.id, entry);
            const docRef = doc(db, 'users', userId, 'journal_entries', entry.id);
            uploadsToFirestore.push(setDoc(docRef, { ...entry, userId }, { merge: true }));
          }
        }
      }
    });

    // Wait for any uploads to complete
    if (uploadsToFirestore.length > 0) {
      await Promise.all(uploadsToFirestore);
    }

    const mergedList = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Save locally
    saveJournalEntriesDirectly(mergedList, userId);

    const nowIso = new Date().toISOString();
    currentStatus.lastSyncedAt = nowIso;
    currentStatus.isSyncing = false;
    localStorage.setItem('psych_nav_firestore_last_sync', nowIso);
    notifyStatus();

    // Broadcast update to window
    window.dispatchEvent(new CustomEvent('journal_cloud_synced'));

    return { success: true, count: mergedList.length };
  } catch (err: any) {
    console.error('Firestore sync error:', err);
    currentStatus.isSyncing = false;
    currentStatus.error = err.message || 'Помилка синхронізації з Firestore';
    notifyStatus();
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Save a single journal entry directly to Firestore
 */
export async function saveEntryToFirestore(entry: JournalEntry): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !entry.id) return;

  try {
    const docRef = doc(db, 'users', currentUser.uid, 'journal_entries', entry.id);
    await setDoc(docRef, { ...entry, userId: currentUser.uid }, { merge: true });
    const nowIso = new Date().toISOString();
    currentStatus.lastSyncedAt = nowIso;
    localStorage.setItem('psych_nav_firestore_last_sync', nowIso);
    notifyStatus();
  } catch (err) {
    console.warn('Firestore save error:', err);
  }
}

/**
 * Delete a single journal entry directly from Firestore
 */
export async function deleteEntryFromFirestore(entryId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !entryId) return;

  try {
    const docRef = doc(db, 'users', currentUser.uid, 'journal_entries', entryId);
    await deleteDoc(docRef);
    const nowIso = new Date().toISOString();
    currentStatus.lastSyncedAt = nowIso;
    localStorage.setItem('psych_nav_firestore_last_sync', nowIso);
    notifyStatus();
  } catch (err) {
    console.warn('Firestore delete error:', err);
  }
}
