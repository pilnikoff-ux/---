import { JournalEntry, UserProfile } from '../types';
import { getUserProfile, saveUserProfile } from './userStatsService';
import { getJournalEntries, getUserStorageKey } from './storageService';

export interface CloudSyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
  syncedCount: number;
}

let syncListeners: ((state: CloudSyncState) => void)[] = [];
let currentState: CloudSyncState = {
  isSyncing: false,
  lastSyncedAt: localStorage.getItem('psych_nav_last_cloud_sync'),
  error: null,
  syncedCount: 0,
};

function notifyListeners() {
  syncListeners.forEach((l) => l({ ...currentState }));
}

export function subscribeToSyncState(listener: (state: CloudSyncState) => void) {
  syncListeners.push(listener);
  listener({ ...currentState });
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
}

export function getSyncState(): CloudSyncState {
  return { ...currentState };
}

/**
 * Main bidirectional sync routine:
 * 1. Pulls records from server using user's email, login, or Google ID.
 * 2. Merges with local device records (no loss of data).
 * 3. Saves merged set to local storage.
 * 4. Pushes back to server so all other devices receive updates.
 */
export async function syncCloudData(force = false): Promise<{ success: boolean; count: number; error?: string }> {
  const profile = getUserProfile();
  const syncKey = (profile?.email || profile?.login || profile?.id || '').trim();

  if (!syncKey || profile?.id === 'guest_user' || profile?.login === 'guest') {
    return { success: false, count: 0, error: 'User is not logged in' };
  }

  currentState.isSyncing = true;
  currentState.error = null;
  notifyListeners();

  try {
    const localKey = getUserStorageKey(profile?.id);
    const localEntries: JournalEntry[] = getJournalEntries(profile?.id);

    // 1. Pull from cloud
    const pullRes = await fetch('/api/sync/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: profile?.email,
        login: profile?.login,
        userId: profile?.id,
      }),
    });

    let cloudEntries: JournalEntry[] = [];
    let cloudProfile: UserProfile | null = null;

    if (pullRes.ok) {
      const pullData = await pullRes.json();
      if (pullData.success && Array.isArray(pullData.journalEntries)) {
        cloudEntries = pullData.journalEntries;
        cloudProfile = pullData.profile;
      }
    }

    // 2. Merge local and cloud entries by id
    const map = new Map<string, JournalEntry>();

    // Add cloud entries
    cloudEntries.forEach((e) => {
      if (e && e.id) map.set(e.id, e);
    });

    // Merge local entries (keep newest if exists)
    localEntries.forEach((e) => {
      if (e && e.id) {
        const existing = map.get(e.id);
        if (!existing) {
          map.set(e.id, e);
        } else {
          // Compare dates
          const localTime = new Date(e.date || 0).getTime();
          const cloudTime = new Date(existing.date || 0).getTime();
          if (localTime >= cloudTime) {
            map.set(e.id, e);
          }
        }
      }
    });

    const mergedEntries = Array.from(map.values()).sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );

    // 3. Save to local storage
    localStorage.setItem(localKey, JSON.stringify(mergedEntries));

    // If cloud has profile updates, merge
    if (cloudProfile && !profile.email && cloudProfile.email) {
      saveUserProfile({
        login: cloudProfile.login || profile.login,
        name: cloudProfile.name || profile.name,
        email: cloudProfile.email,
        fullName: cloudProfile.fullName || profile.fullName,
        birthDate: cloudProfile.birthDate || profile.birthDate,
        fieldOfActivity: cloudProfile.fieldOfActivity || profile.fieldOfActivity,
        authProvider: cloudProfile.authProvider || profile.authProvider,
        avatarUrl: cloudProfile.avatarUrl || profile.avatarUrl,
      });
    }

    // 4. Push merged state back to cloud server
    const pushRes = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: profile?.email,
        login: profile?.login,
        userId: profile?.id,
        profile: profile,
        journalEntries: mergedEntries,
        clientTimestamp: new Date().toISOString(),
      }),
    });

    let finalCount = mergedEntries.length;
    if (pushRes.ok) {
      const pushData = await pushRes.json();
      if (pushData.count !== undefined) {
        finalCount = pushData.count;
      }
    }

    const nowIso = new Date().toISOString();
    localStorage.setItem('psych_nav_last_cloud_sync', nowIso);

    currentState.isSyncing = false;
    currentState.lastSyncedAt = nowIso;
    currentState.syncedCount = finalCount;
    currentState.error = null;
    notifyListeners();

    // Trigger local storage window event so open tabs/components re-render
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('journal_cloud_synced', { detail: { count: finalCount } }));

    return { success: true, count: finalCount };
  } catch (err: any) {
    console.warn('Cloud sync offline or error:', err);
    currentState.isSyncing = false;
    currentState.error = err?.message || 'Sync error';
    notifyListeners();
    return { success: false, count: 0, error: err?.message };
  }
}
