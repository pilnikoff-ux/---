export interface PracticeReminderConfig {
  enabled: boolean;
  time: string; // HH:MM (e.g. '09:00')
  practiceType:
    | 'affirmations'
    | 'grounding'
    | 'cbt'
    | 'consilium'
    | 'goalMakers'
    | 'wheelOfBalance';
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  customMessage?: string;
}

const STORAGE_KEY = 'psy_practice_reminder_config';

export const DEFAULT_REMINDER_CONFIG: PracticeReminderConfig = {
  enabled: true,
  time: '09:00',
  practiceType: 'affirmations',
  soundEnabled: true,
  browserNotificationsEnabled: true,
  customMessage: 'Час для усвідомленої паузи та психологічного заземлення.',
};

export const getReminderConfig = (): PracticeReminderConfig => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_REMINDER_CONFIG;
    return { ...DEFAULT_REMINDER_CONFIG, ...JSON.parse(data) };
  } catch (e) {
    console.warn('Failed to load reminder config:', e);
    return DEFAULT_REMINDER_CONFIG;
  }
};

export const saveReminderConfig = (config: PracticeReminderConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save reminder config:', e);
  }
};

// Play a gentle serene crystalline chime tone using Web Audio API
export const playSereneChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // 528 Hz (Love & Transformation Solfeggio frequency) and harmonics
    const notes = [528, 660, 792, 1056];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 2.6);
    });
  } catch (e) {
    console.warn('Audio play failed:', e);
  }
};

// Send browser notification if permitted
export const sendBrowserNotification = async (title: string, body: string): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icon.png',
      badge: '/icon.png',
    });
    return true;
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
      });
      return true;
    }
  }
  return false;
};
