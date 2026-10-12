import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface VoiceInputButtonProps {
  id?: string;
  onTranscript?: (text: string) => void;
  onVoiceInput?: (text: string) => void;
  currentValue?: string;
  fieldLabel?: string;
  className?: string;
  compact?: boolean;
}

// Window declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  id = 'voice-input-btn',
  onTranscript,
  onVoiceInput,
  currentValue = '',
  fieldLabel,
  className = '',
  compact = false,
}) => {
  const { lang } = useThemeLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseValueRef = useRef<string>('');

  const handleTranscript = (text: string) => {
    if (onTranscript) onTranscript(text);
    if (onVoiceInput) onVoiceInput(text);
  };

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const startListening = () => {
    setErrorMessage(null);
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(
        lang === 'ru'
          ? 'Голосовое распознавание не поддерживается в этом браузере. Рекомендуем Google Chrome, Safari или Edge.'
          : lang === 'en'
          ? 'Speech recognition is not supported in this browser. Please use Chrome, Safari or Edge.'
          : 'Голосове розпізнавання не підтримується цим браузером. Рекомендуємо Google Chrome, Safari або Edge.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uk-UA';

      // Capture the base text at the exact moment recording begins
      baseValueRef.current = (currentValue || '').trim();

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Iterate cleanly through all results of this session from 0 to length - 1.
        // This avoids event.resultIndex discrepancies across browser engines (WebKit vs Chromium)
        // and guarantees we never repeat or duplicate words 10 times.
        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result && result[0]) {
            const chunk = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += chunk + ' ';
            } else {
              interimTranscript += chunk;
            }
          }
        }

        const sessionSpoken = (finalTranscript + interimTranscript).trim();
        if (sessionSpoken) {
          const base = baseValueRef.current;
          const combined = base ? `${base} ${sessionSpoken}` : sessionSpoken;
          handleTranscript(combined);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage(
            lang === 'ru'
              ? 'Доступ к микрофону заблокирован. Разрешите доступ в браузере.'
              : lang === 'en'
              ? 'Microphone access denied. Please allow microphone permissions.'
              : 'Доступ до мікрофону заблоковано. Будь ласка, надайте дозвіл у браузері.'
          );
        } else if (event.error === 'no-speech') {
          // Normal timeout if user was silent, ignore
        } else if (event.error === 'network') {
          setErrorMessage(
            lang === 'ru'
              ? 'Ошибка сети голосового ввода.'
              : lang === 'en'
              ? 'Voice recognition network error.'
              : 'Помилка мережі розпізнавання голосу.'
          );
        } else {
          setErrorMessage(
            lang === 'ru'
              ? `Статус распознавания: ${event.error}`
              : lang === 'en'
              ? `Recognition note: ${event.error}`
              : `Статус розпізнавання: ${event.error}`
          );
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setErrorMessage(
        lang === 'ru'
          ? 'Не удалось активировать микрофон.'
          : lang === 'en'
          ? 'Could not start microphone.'
          : 'Не вдалося активувати мікрофон.'
      );
      setIsListening(false);
    }
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const buttonTitle = isListening
    ? lang === 'ru'
      ? 'Остановить запись голоса'
      : lang === 'en'
      ? 'Stop voice recording'
      : 'Зупинити запис голосу'
    : lang === 'ru'
    ? `Голосовой ввод (продиктуйте текст) ${fieldLabel ? `для: ${fieldLabel}` : ''}`
    : lang === 'en'
    ? `Voice input with speech-to-text ${fieldLabel ? `for ${fieldLabel}` : ''}`
    : `Голосове введення (надиктуйте текст) ${fieldLabel ? `для: ${fieldLabel}` : ''}`;

  return (
    <div className={`relative inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      <button
        id={id}
        type="button"
        onClick={toggleListening}
        className={`group flex items-center justify-center gap-1.5 rounded-lg transition-all duration-150 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
          compact
            ? 'h-8 w-8 min-w-[32px] p-1.5'
            : 'px-2.5 py-1.5 text-xs'
        } ${
          isListening
            ? 'bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400/50 animate-pulse'
            : 'border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-teal-500/50 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-700 dark:hover:text-teal-300'
        }`}
        title={buttonTitle}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Mic className="h-3.5 w-3.5 text-white shrink-0" />
            {!compact && (
              <span className="hidden sm:inline text-[11px] font-medium tracking-tight">
                {lang === 'ru' ? 'Слушаю...' : lang === 'en' ? 'Listening...' : 'Слухаю...'}
              </span>
            )}
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform shrink-0" />
            {!compact && (
              <span className="hidden sm:inline text-[11px] font-medium tracking-tight">
                {lang === 'ru' ? 'Голосовой ввод' : lang === 'en' ? 'Voice dictation' : 'Голосове введення'}
              </span>
            )}
          </>
        )}
      </button>

      {/* Temporary error toast or inline warning */}
      {errorMessage && (
        <div className="absolute top-full right-0 mt-1 z-30 flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-50 dark:bg-rose-950 px-2.5 py-1.5 text-[11px] text-rose-700 dark:text-rose-200 shadow-md whitespace-nowrap">
          <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 font-bold ml-1 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceInputButton;
