import { UserProfile } from '../types';
import { saveUserProfile } from './userStatsService';

// Decode Google JWT ID token
export function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT token', e);
    return null;
  }
}

export interface GoogleProfileDraft {
  id: string;
  login: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  authProvider: 'google';
}

export function getGoogleProfileDraft(credential: string): GoogleProfileDraft | null {
  const payload = parseJwtPayload(credential);
  if (!payload || !payload.email) return null;

  const email = payload.email.toLowerCase();
  const cleanLogin = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
  const name = payload.name || cleanLogin;

  return {
    id: `google_${payload.sub || Date.now()}`,
    login: cleanLogin,
    fullName: name,
    email: email,
    avatarUrl: payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    authProvider: 'google',
  };
}

export function getQuickGoogleDraft(customEmail?: string, customName?: string): GoogleProfileDraft | null {
  const email = customEmail?.trim()?.toLowerCase();
  if (!email) return null;
  const cleanLogin = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
  const name = customName?.trim() || cleanLogin;
  const googleId = `google_${Math.abs(hashString(email))}`;

  return {
    id: googleId,
    login: cleanLogin,
    fullName: name,
    email: email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    authProvider: 'google',
  };
}

export function handleGoogleCredential(credential: string): UserProfile | null {
  const payload = parseJwtPayload(credential);
  if (!payload || !payload.email) return null;

  const profile: UserProfile = {
    id: `google_${payload.sub || Date.now()}`,
    login: payload.email.split('@')[0],
    name: payload.name || payload.email.split('@')[0],
    fullName: payload.name || payload.email.split('@')[0],
    email: payload.email,
    avatarUrl: payload.picture || '',
    authProvider: 'google',
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    fieldOfActivity: 'Користувач Google Навігатора',
  };

  return saveUserProfile({
    login: profile.login,
    name: profile.name,
    fieldOfActivity: profile.fieldOfActivity,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    authProvider: 'google',
    id: profile.id,
  });
}

// 1-Click Fast Google Sign-In with provided user Google account
export function quickGoogleSignIn(customEmail?: string, customName?: string): UserProfile | null {
  const email = customEmail?.trim()?.toLowerCase();
  if (!email) return null;
  const name = customName?.trim() || (email.split('@')[0].replace(/[._]/g, ' ') || 'Google Користувач');
  const googleId = `google_${Math.abs(hashString(email))}`;

  const profile: UserProfile = {
    id: googleId,
    login: email.split('@')[0],
    name: name,
    fullName: name,
    email: email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
    authProvider: 'google',
    registeredAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    fieldOfActivity: 'Користувач Google Навігатора',
  };

  return saveUserProfile({
    login: profile.login,
    name: profile.name,
    fieldOfActivity: profile.fieldOfActivity,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    authProvider: 'google',
    id: profile.id,
  });
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
