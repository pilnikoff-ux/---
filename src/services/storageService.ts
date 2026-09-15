import { JournalEntry } from '../types';
import { getUserProfile } from './userStatsService';

const LEGACY_STORAGE_KEY = 'psych_navigator_journal_v1';

export function getUserStorageKey(overrideUserId?: string): string {
  const profile = getUserProfile();
  const userId = overrideUserId || profile?.id;
  if (!userId) {
    return LEGACY_STORAGE_KEY;
  }
  return `psych_navigator_journal_${userId}`;
}

export function getJournalEntries(userId?: string): JournalEntry[] {
  try {
    const key = getUserStorageKey(userId);
    let raw = localStorage.getItem(key);

    // Migration / fallback: if user-scoped key is empty, check legacy key
    if (!raw && key !== LEGACY_STORAGE_KEY) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        // Copy to user-scoped key so they keep their initial entries
        localStorage.setItem(key, legacyRaw);
        raw = legacyRaw;
      }
    }

    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load journal entries from storage', e);
    return [];
  }
}

export function saveJournalEntry(
  entry: Omit<JournalEntry, 'id' | 'date'> & { id?: string; date?: string; userId?: string }
): JournalEntry {
  const key = getUserStorageKey(entry.userId);
  const entries = getJournalEntries(entry.userId);
  const newEntry: JournalEntry = {
    id: entry.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: entry.date || new Date().toISOString(),
    type: entry.type,
    title: entry.title,
    summary: entry.summary,
    data: entry.data,
  };

  const existingIndex = entries.findIndex((e) => e.id === newEntry.id);
  if (existingIndex >= 0) {
    entries[existingIndex] = newEntry;
  } else {
    entries.unshift(newEntry);
  }

  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save journal entry', e);
  }

  return newEntry;
}

export function deleteJournalEntry(id: string, userId?: string): void {
  const key = getUserStorageKey(userId);
  const entries = getJournalEntries(userId).filter((e) => e.id !== id);
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to delete journal entry', e);
  }
}

export function exportJournalData(userId?: string): void {
  const entries = getJournalEntries(userId);
  const profile = getUserProfile();
  const userName = profile?.login || 'journal';
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(entries, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `psychological_journal_${userName}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importJournalData(jsonString: string, userId?: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      const key = getUserStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(parsed));
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to import JSON', e);
    return false;
  }
}

