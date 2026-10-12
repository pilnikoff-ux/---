// Speech Synthesis (Text-to-Speech) and Audio Utilities with AI Studio High-Fidelity Ukrainian Voice

export interface SpeakOptions {
  lang?: 'ua' | 'ru' | 'en';
  rate?: number;
  pitch?: number;
  voiceName?: 'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir';
  useAiTts?: boolean;
  onLoading?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

// In-memory cache for synthesized audio to ensure instant replay
const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();

let keepAliveInterval: any = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAbortController: AbortController | null = null;
let isSpeakingActive = false;

// Cache browser voices once ready for fallback
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
    };
  } catch (e) {
    console.warn('Speech synthesis voice cache initialization warning:', e);
  }
}

export function stopSpeaking() {
  isSpeakingActive = false;

  // Cancel any in-flight AI TTS network request
  if (currentAbortController) {
    try {
      currentAbortController.abort();
    } catch (_) {}
    currentAbortController = null;
  }

  // Stop any currently playing HTML5 Audio element
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (_) {}
    currentAudio = null;
  }

  // Cancel browser Web Speech API synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      activeUtterance = null;
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error cancelling speech synthesis:', e);
    }
  }
}

export function isSpeechActive(): boolean {
  return isSpeakingActive;
}

export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('speechSynthesis' in window || typeof Audio !== 'undefined')
  );
}

/**
 * Fallback to browser Web Speech API synthesis with robust voice filtering.
 * Prevents German / foreign voice from being assigned to Ukrainian text.
 */
function speakWithBrowserSpeech(text: string, options: SpeakOptions): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLangCode =
      options.lang === 'ru' ? 'ru-RU' : options.lang === 'en' ? 'en-US' : 'uk-UA';

    utterance.lang = targetLangCode;
    utterance.rate = options.rate ?? 0.92;
    utterance.pitch = options.pitch ?? 1.0;

    activeUtterance = utterance;

    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const isUa = options.lang === 'ua' || !options.lang;
      let matchedVoice: SpeechSynthesisVoice | undefined;

      if (isUa) {
        // 1. Look for genuine Ukrainian voice
        matchedVoice = voices.find((v) => {
          const l = (v.lang || '').toLowerCase();
          const n = (v.name || '').toLowerCase();
          return (
            l.startsWith('uk') ||
            l.includes('ua') ||
            n.includes('ukrain') ||
            n.includes('україн') ||
            n.includes('lesya') ||
            n.includes('polina') ||
            n.includes('ostap') ||
            n.includes('taras')
          );
        });

        // 2. If no Ukrainian voice, look for Slavic Cyrillic voice (ru, pl)
        // to avoid German phonetics butchering Ukrainian words
        if (!matchedVoice) {
          matchedVoice = voices.find((v) => {
            const l = (v.lang || '').toLowerCase();
            return l.startsWith('ru') || l.startsWith('pl');
          });
        }

        // 3. If still not matched, reject German voices explicitly
        if (!matchedVoice) {
          matchedVoice = voices.find((v) => {
            const l = (v.lang || '').toLowerCase();
            const n = (v.name || '').toLowerCase();
            return (
              !l.startsWith('de') &&
              !n.includes('deutsch') &&
              !n.includes('german') &&
              !n.includes('hedda') &&
              !n.includes('stefan')
            );
          });
        }
      } else {
        const langPrefix = options.lang === 'ru' ? 'ru' : 'en';
        matchedVoice =
          voices.find((v) => (v.lang || '').toLowerCase().startsWith(langPrefix)) ||
          voices.find((v) => (v.lang || '').toLowerCase().includes(langPrefix));
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onstart = () => {
      isSpeakingActive = true;
      if (options.onStart) options.onStart();

      if (keepAliveInterval) clearInterval(keepAliveInterval);
      keepAliveInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        } else {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
    };

    utterance.onend = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      activeUtterance = null;
      isSpeakingActive = false;
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      activeUtterance = null;
      isSpeakingActive = false;
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('Speech synthesis utterance error:', event.error);
        if (options.onError) options.onError(event);
      } else if (options.onEnd) {
        options.onEnd();
      }
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Browser speech fallback failed:', err);
    isSpeakingActive = false;
    if (options.onError) options.onError(err);
    return false;
  }
}

/**
 * Primary Speech function:
 * 1. Uses Gemini High-Fidelity Studio Neural TTS (`/api/tts`) for 100% authentic,
 *    melodic Ukrainian speech without German or foreign accents.
 * 2. Caches audio in memory so repeat clicks are instant.
 * 3. Gracefully falls back to browser synthesis if offline or server unavailable.
 */
export function speakText(text: string, options: SpeakOptions = {}): boolean {
  if (!isSpeechSynthesisSupported()) {
    console.warn('Speech synthesis is not supported in this environment.');
    return false;
  }

  const cleanText = text.trim();
  if (!cleanText) return false;

  // Stop any active audio before starting new playback
  stopSpeaking();
  isSpeakingActive = true;

  // Notify UI immediately that speech is starting / preparing
  if (options.onStart) {
    options.onStart();
  }

  const useAi = options.useAiTts !== false;
  const lang = options.lang || 'ua';
  const voiceName = options.voiceName || 'Kore';
  const cacheKey = `${lang}_${voiceName}_${cleanText}`;

  // If AI TTS is disabled, run browser speech directly
  if (!useAi) {
    return speakWithBrowserSpeech(cleanText, options);
  }

  // 1. Check instant in-memory cache
  if (ttsAudioCache.has(cacheKey)) {
    const cached = ttsAudioCache.get(cacheKey)!;
    playBase64Audio(cached.audioBase64, cached.mimeType, options);
    return true;
  }

  // 2. Fetch AI Neural TTS from /api/tts
  const abortController = new AbortController();
  currentAbortController = abortController;

  fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: cleanText,
      lang,
      voice: voiceName,
    }),
    signal: abortController.signal,
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`TTS server returned status ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      // If user stopped speech while fetching, do not play
      if (abortController.signal.aborted || !isSpeakingActive) {
        return;
      }

      if (data && data.success && data.audioBase64) {
        // Cache audio for instant re-use
        ttsAudioCache.set(cacheKey, {
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
        });

        playBase64Audio(data.audioBase64, data.mimeType || 'audio/wav', options);
      } else {
        throw new Error(data?.error || 'Invalid TTS audio response');
      }
    })
    .catch((err) => {
      if (abortController.signal.aborted) {
        // User aborted, clean exit
        return;
      }
      console.warn('[TTS] AI TTS failed, falling back to browser synthesis:', err);
      // Fallback to browser speech engine
      const fallbackSuccess = speakWithBrowserSpeech(cleanText, options);
      if (!fallbackSuccess) {
        isSpeakingActive = false;
        if (options.onError) options.onError(err);
      }
    });

  return true;
}

/**
 * Plays base64 WAV/MP3 audio using HTMLAudioElement
 */
function playBase64Audio(
  audioBase64: string,
  mimeType: string,
  options: SpeakOptions
) {
  try {
    const audioSrc = `data:${mimeType};base64,${audioBase64}`;
    const audio = new Audio(audioSrc);
    currentAudio = audio;

    if (options.rate && options.rate > 0) {
      audio.playbackRate = options.rate;
    }

    audio.onended = () => {
      currentAudio = null;
      isSpeakingActive = false;
      if (options.onEnd) options.onEnd();
    };

    audio.onerror = (e) => {
      console.warn('Audio element error:', e);
      currentAudio = null;
      isSpeakingActive = false;
      if (options.onError) options.onError(e);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Autoplay policy or interruption
        if (err.name !== 'AbortError') {
          console.warn('Audio play was interrupted or blocked:', err);
          currentAudio = null;
          isSpeakingActive = false;
          if (options.onError) options.onError(err);
        }
      });
    }
  } catch (err) {
    console.error('Failed to create or play audio:', err);
    currentAudio = null;
    isSpeakingActive = false;
    if (options.onError) options.onError(err);
  }
}
