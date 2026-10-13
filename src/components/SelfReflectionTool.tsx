import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  BookOpen,
  Calendar,
  Send,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  Smile,
  Zap,
  ShieldAlert,
  Compass,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Settings,
  Sun,
  Moon,
  ExternalLink,
  Clock,
  Edit3,
  X,
  MessageCircle,
} from 'lucide-react';
import {
  ReflectionMethod,
  SelfReflectionData,
  AiReflectionPrompt,
  TelegramReflectionSettings,
} from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  getUserProfile,
  getTelegramSettings,
  updateTelegramSettings,
} from '../services/userStatsService';
import { saveJournalEntry } from '../services/storageService';
import { requestSelfReflectionFeedback } from '../services/geminiService';
import {
  generateAiReflectionPrompt,
  sendTelegramMessage,
  checkAndSendAutoTelegramReflection,
} from '../services/telegramService';
import { speakText, stopSpeaking } from '../utils/speechUtils';
import { VoiceInputButton } from './VoiceInputButton';

interface SelfReflectionProps {
  onSavedToJournal?: () => void;
}

const METHODS_CONFIG: Record<
  ReflectionMethod,
  {
    titleUk: string;
    titleRu: string;
    titleEn: string;
    descUk: string;
    descRu: string;
    descEn: string;
    badge: string;
  }
> = {
  stoic_evening: {
    titleUk: 'Стоїчна вечірня рефлексія',
    titleRu: 'Стоическая вечерняя рефлексия',
    titleEn: 'Stoic Evening Reflection',
    descUk: 'Щоденна практика Марка Аврелія та Сенеки для кришталевої ясності розуму та спокою.',
    descRu: 'Ежедневная практика Марка Аврелия и Сенеки для кристальной ясности ума и покоя.',
    descEn: 'Marcus Aurelius & Seneca daily audit: what was noble, where was lapse, how to act tomorrow.',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  gibbs_cycle: {
    titleUk: 'Цикл рефлексії Гіббса',
    titleRu: 'Цикл рефлексии Гиббса',
    titleEn: 'Gibbs Reflective Cycle',
    descUk: 'Класична 6-етапна модель для глибокого аналізу емоційно насиченої або критичної ситуації.',
    descRu: 'Классическая 6-этапная модель для глубокого анализа эмоционально заряженной ситуации.',
    descEn: 'Structured 6-stage reflection: Description -> Feelings -> Evaluation -> Analysis -> Conclusion -> Action.',
    badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30',
  },
  what_so_what: {
    titleUk: 'Дрісколл: Що? Ну і що? Що тепер?',
    titleRu: 'Дрисколл: Что? Ну и что? Что теперь?',
    titleEn: 'Driscoll: What? So What? Now What?',
    descUk: 'Елегантна трьохетапна модель швидкого перетворення будь-якого досвіду на практичну мудрість.',
    descRu: 'Элегантная 3-этапная модель быстрого превращения опыта в практическую мудрость.',
    descEn: 'Fast and impactful 3-question loop for extracting actionable learning from any event.',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
  },
  kpt_retrospective: {
    titleUk: 'KPT: Keep / Problem / Try',
    titleRu: 'KPT: Keep / Problem / Try',
    titleEn: 'KPT Life Retrospective',
    descUk: 'Методика життєвого аудиту тижня або місяця: що зберігати, де затики, що спробувати.',
    descRu: 'Методика жизненного аудита недели или месяца: что сохранять, где затыки, что попробовать.',
    descEn: 'Agile-adapted life audit: Keep working habits, resolve Problems, Try new experiments.',
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
  },
  express_checkin: {
    titleUk: 'Експрес-чек-ін дня',
    titleRu: 'Экспресс-чек-ин дня',
    titleEn: 'Daily Express Check-in',
    descUk: '3 швидкі питання для фокусування на перемогах, уроках та вдячності (до 3 хвилин).',
    descRu: '3 быстрых вопроса для фиксации побед, уроков и благодарности (до 3 минут).',
    descEn: '3-minute check-in focusing on wins, learning, and gratitude.',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
};

const EMOTIONS_CONFIG = [
  { id: 'calm', uk: 'Спокій', ru: 'Спокойствие', en: 'Calm' },
  { id: 'gratitude', uk: 'Вдячність', ru: 'Благодарность', en: 'Gratitude' },
  { id: 'inspiration', uk: 'Натхнення', ru: 'Вдохновение', en: 'Inspiration' },
  { id: 'joy', uk: 'Радість', ru: 'Радость', en: 'Joy' },
  { id: 'pride', uk: 'Гордість', ru: 'Гордость', en: 'Pride' },
  { id: 'fatigue', uk: 'Втома', ru: 'Усталость', en: 'Fatigue' },
  { id: 'anxiety', uk: 'Тривога', ru: 'Тревога', en: 'Anxiety' },
  { id: 'irritation', uk: 'Роздратування', ru: 'Раздражение', en: 'Irritation' },
  { id: 'sadness', uk: 'Сум', ru: 'Грусть', en: 'Sadness' },
  { id: 'guilt', uk: 'Провина', ru: 'Вина', en: 'Guilt' },
  { id: 'confusion', uk: 'Розгубленість', ru: 'Растерянность', en: 'Confusion' },
  { id: 'hope', uk: 'Надія', ru: 'Надежда', en: 'Hope' },
  { id: 'acceptance', uk: 'Прийняття', ru: 'Принятие', en: 'Acceptance' },
];

export const SelfReflectionTool: React.FC<SelfReflectionProps> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();

  const [selectedMethod, setSelectedMethod] = useState<ReflectionMethod>('stoic_evening');
  const [energyScore, setEnergyScore] = useState<number>(7);
  const [moodScore, setMoodScore] = useState<number>(7);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(['Спокій', 'Вдячність']);
  const [showGuide, setShowGuide] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields per method
  // Stoic
  const [stoicDoneWell, setStoicDoneWell] = useState('');
  const [stoicFaltered, setStoicFaltered] = useState('');
  const [stoicTomorrowBetter, setStoicTomorrowBetter] = useState('');

  // Gibbs
  const [gibbsDescription, setGibbsDescription] = useState('');
  const [gibbsFeelings, setGibbsFeelings] = useState('');
  const [gibbsEvaluation, setGibbsEvaluation] = useState('');
  const [gibbsAnalysis, setGibbsAnalysis] = useState('');
  const [gibbsConclusion, setGibbsConclusion] = useState('');
  const [gibbsActionPlan, setGibbsActionPlan] = useState('');

  // Driscoll
  const [whatHappened, setWhatHappened] = useState('');
  const [soWhatMeaning, setSoWhatMeaning] = useState('');
  const [nowWhatNextStep, setNowWhatNextStep] = useState('');

  // KPT
  const [kptKeep, setKptKeep] = useState('');
  const [kptProblem, setKptProblem] = useState('');
  const [kptTry, setKptTry] = useState('');

  // Express
  const [expressWins, setExpressWins] = useState('');
  const [expressDifficulties, setExpressDifficulties] = useState('');
  const [expressGratitude, setExpressGratitude] = useState('');

  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<SelfReflectionData['aiSupervisorFeedback'] | null>(
    null
  );
  const [isSaved, setIsSaved] = useState(false);

  // AI Daily Reflection Prompt & Telegram state
  const [promptType, setPromptType] = useState<'morning' | 'evening'>(() => {
    const hour = new Date().getHours();
    return hour >= 16 ? 'evening' : 'morning';
  });
  const [dailyPrompt, setDailyPrompt] = useState<AiReflectionPrompt | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isSpeakingPrompt, setIsSpeakingPrompt] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Charon' | 'Zephyr'>('Kore');
  const [isPromptCopied, setIsPromptCopied] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Telegram Settings Modal
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const [telegramSettings, setTelegramSettings] = useState<TelegramReflectionSettings>(() =>
    getTelegramSettings()
  );
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [testTelegramResult, setTestTelegramResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [telegramSavedNotice, setTelegramSavedNotice] = useState(false);

  const loadPrompt = async (type: 'morning' | 'evening') => {
    setIsLoadingPrompt(true);
    setTelegramStatus(null);
    try {
      const prompt = await generateAiReflectionPrompt({ type, lang });
      setDailyPrompt(prompt);
    } catch (e) {
      console.error('Failed to load reflection prompt:', e);
    } finally {
      setIsLoadingPrompt(false);
    }
  };

  // Initialize Telegram settings, load prompt, and check auto-scheduled delivery
  useEffect(() => {
    const settings = getTelegramSettings();
    setTelegramSettings(settings);

    // Initial fetch of prompt
    loadPrompt(promptType);

    // Check if auto-scheduled Telegram reflection needs to be sent
    checkAndSendAutoTelegramReflection().then((res) => {
      if (res.sent) {
        console.log(`Auto reflection sent to Telegram: ${res.type}`);
      }
    });

    return () => {
      stopSpeaking();
    };
  }, []);

  const handleToggleSpeakPrompt = () => {
    if (isSpeakingPrompt) {
      stopSpeaking();
      setIsSpeakingPrompt(false);
      return;
    }

    if (!dailyPrompt) return;

    // Full text for speech synthesis
    const speechScript = `${dailyPrompt.greeting}. ${dailyPrompt.questionTitle}: ${dailyPrompt.question}. Маленьке завдання: ${dailyPrompt.microTask}. Нагадування дня: ${dailyPrompt.reminder}. ${dailyPrompt.wishes}`;

    setIsSpeakingPrompt(true);
    const success = speakText(speechScript, {
      lang,
      rate: 0.95,
      voiceName: selectedVoice,
      onStart: () => setIsSpeakingPrompt(true),
      onEnd: () => setIsSpeakingPrompt(false),
      onError: () => setIsSpeakingPrompt(false),
    });

    if (!success) {
      setIsSpeakingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    if (!dailyPrompt) return;
    navigator.clipboard.writeText(dailyPrompt.fullFormattedText);
    setIsPromptCopied(true);
    setTimeout(() => setIsPromptCopied(false), 2500);
  };

  const handleSendPromptToTelegram = async () => {
    if (!dailyPrompt) return;
    const targetChat = (
      telegramSettings.telegramChatId ||
      telegramSettings.telegramUsername ||
      ''
    ).trim();

    if (!targetChat) {
      setIsTelegramModalOpen(true);
      setTelegramStatus({
        type: 'error',
        message:
          lang === 'en'
            ? 'Please link your Telegram Chat ID in settings first.'
            : lang === 'ru'
            ? 'Пожалуйста, укажите ваш Telegram Chat ID в настройках.'
            : 'Будь ласка, спочатку вкажіть ваш Telegram Chat ID у налаштуваннях.',
      });
      return;
    }

    setIsSendingTelegram(true);
    setTelegramStatus(null);
    try {
      const res = await sendTelegramMessage(
        targetChat,
        dailyPrompt.fullFormattedText,
        telegramSettings.botToken
      );
      if (res.success) {
        setTelegramStatus({
          type: 'success',
          message:
            lang === 'en'
              ? '✓ Sent successfully to Telegram!'
              : lang === 'ru'
              ? '✓ Успешно отправлено в Telegram!'
              : '✓ Успішно надіслано в Telegram-бот!',
        });
        setTimeout(() => setTelegramStatus(null), 4000);
      } else {
        setTelegramStatus({
          type: 'error',
          message: res.error || 'Помилка надсилання.',
        });
      }
    } catch (err: any) {
      setTelegramStatus({
        type: 'error',
        message: err.message || 'Помилка під час відправки.',
      });
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleInsertPromptIntoReflection = () => {
    if (!dailyPrompt) return;
    const textToInsert = `[${dailyPrompt.questionTitle}]: ${dailyPrompt.question}\n[Завдання]: ${dailyPrompt.microTask}`;

    if (selectedMethod === 'express_checkin') {
      setExpressWins((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
    } else if (selectedMethod === 'stoic_evening') {
      setStoicDoneWell((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
    } else if (selectedMethod === 'what_so_what') {
      setWhatHappened((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
    } else if (selectedMethod === 'gibbs_cycle') {
      setGibbsDescription((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
    } else {
      setKptKeep((prev) => (prev ? `${prev}\n\n${textToInsert}` : textToInsert));
    }

    // Smooth scroll down to the form
    const formEl = document.getElementById('reflection-main-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveTelegramSettings = () => {
    const updated = updateTelegramSettings(telegramSettings);
    if (updated?.telegramSettings) {
      setTelegramSettings(updated.telegramSettings);
    }
    setTelegramSavedNotice(true);
    setTimeout(() => {
      setTelegramSavedNotice(false);
      setIsTelegramModalOpen(false);
    }, 1200);
  };

  const handleTestTelegramConnection = async () => {
    const targetChat = (
      telegramSettings.telegramChatId ||
      telegramSettings.telegramUsername ||
      ''
    ).trim();

    if (!targetChat) {
      setTestTelegramResult({
        type: 'error',
        message:
          lang === 'en'
            ? 'Please enter Telegram Chat ID first.'
            : lang === 'ru'
            ? 'Сначала укажите Telegram Chat ID.'
            : 'Спочатку вкажіть Telegram Chat ID.',
      });
      return;
    }

    setIsTestingTelegram(true);
    setTestTelegramResult(null);

    const testMsg = `🌿 <b>Навігатор Саморефлексії & Goal Makers</b>\n\n✓ Тестове повідомлення успішне!\nВаш зв'язок із Telegram-ботом налаштовано правильно. Тепер вам надходитимуть щоденні глибокі питання та мікро-завдання саморефлексії! ✨`;

    const res = await sendTelegramMessage(targetChat, testMsg, telegramSettings.botToken);
    setIsTestingTelegram(false);

    if (res.success) {
      setTestTelegramResult({
        type: 'success',
        message:
          lang === 'en'
            ? '✓ Test message delivered to your Telegram!'
            : lang === 'ru'
            ? '✓ Тестовое сообщение доставлено в ваш Telegram!'
            : '✓ Тестове повідомлення успішно доставлено у ваш Telegram!',
      });
    } else {
      setTestTelegramResult({
        type: 'error',
        message: res.error || 'Не вдалося надіслати тестове повідомлення.',
      });
    }
  };

  const toggleEmotion = (emo: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  const getActiveContentObject = () => {
    switch (selectedMethod) {
      case 'stoic_evening':
        return { stoicDoneWell, stoicFaltered, stoicTomorrowBetter };
      case 'gibbs_cycle':
        return {
          gibbsDescription,
          gibbsFeelings,
          gibbsEvaluation,
          gibbsAnalysis,
          gibbsConclusion,
          gibbsActionPlan,
        };
      case 'what_so_what':
        return { whatHappened, soWhatMeaning, nowWhatNextStep };
      case 'kpt_retrospective':
        return { kptKeep, kptProblem, kptTry };
      case 'express_checkin':
        return { expressWins, expressDifficulties, expressGratitude };
    }
  };

  const hasContentEntered = () => {
    const content = getActiveContentObject();
    return Object.values(content).some((val) => typeof val === 'string' && val.trim().length > 0);
  };

  const handleRequestAiFeedback = async () => {
    if (!hasContentEntered()) {
      setFormError(
        lang === 'en'
          ? 'Please fill in at least one reflection field before requesting feedback.'
          : lang === 'ru'
          ? 'Пожалуйста, заполните хотя бы одно поле рефлексии перед запуском анализа.'
          : 'Будь ласка, заповніть хоча б одне поле рефлексії перед запуском аналізу.'
      );
      return;
    }
    setFormError(null);

    setIsSubmittingAi(true);
    try {
      const feedback = await requestSelfReflectionFeedback({
        method: METHODS_CONFIG[selectedMethod].titleUk,
        energyScore,
        moodScore,
        primaryEmotions: selectedEmotions,
        content: getActiveContentObject(),
      });
      setAiFeedback(feedback);
    } catch (e) {
      console.error('Error fetching reflection feedback:', e);
    } finally {
      setIsSubmittingAi(false);
    }
  };

  const handleSaveToJournal = () => {
    const user = getUserProfile();
    const data: SelfReflectionData = {
      id: `reflection-${Date.now()}`,
      title: `${METHODS_CONFIG[selectedMethod].titleUk} (${new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uk-UA')})`,
      date: new Date().toISOString(),
      method: selectedMethod,
      energyScore,
      moodScore,
      primaryEmotions: selectedEmotions,
      content: getActiveContentObject(),
      aiSupervisorFeedback: aiFeedback || undefined,
    };

    saveJournalEntry({
      id: data.id,
      type: 'selfReflection',
      title: data.title,
      date: data.date,
      summary: `Метод: ${METHODS_CONFIG[selectedMethod].titleUk} | Енергія: ${energyScore}/10 | Настрій: ${moodScore}/10 | Емоції: ${selectedEmotions.join(', ')}`,
      data,
      userId: user?.id,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (onSavedToJournal) onSavedToJournal();
  };

  return (
    <div id="self-reflection-container" className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-linear-to-br from-stone-50 via-teal-50/20 to-indigo-50/20 dark:from-stone-900 dark:via-teal-950/20 dark:to-indigo-950/20 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Brain className="h-3.5 w-3.5" />
              {lang === 'ru'
                ? 'Осознанность, Стоицизм & Продуктивная Рефлексия'
                : lang === 'en'
                ? 'Mindfulness, Stoicism & Reflective Learning'
                : 'Усвідомленість, Стоїцизм & Продуктивна Рефлексія'}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {lang === 'ru' ? 'Саморефлексия' : lang === 'en' ? 'Self-Reflection Lab' : 'Саморефлексія'}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {lang === 'ru'
                ? 'Пространство безопасного диалога с собой. Переводите хаос пережитого в чёткие инсайты без токсичного самобичевания.'
                : lang === 'en'
                ? 'A safe harbor for self-dialogue. Transform daily emotional turbulence into wisdom and clarity without toxic self-judgment.'
                : 'Простір безпечного діалогу із собою. Перетворюйте хаос пережитого на кришталеві інсайти без токсичного самобичування та румінацій.'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              id="reflection-telegram-btn"
              type="button"
              onClick={() => setIsTelegramModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-50 dark:bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-800 dark:text-sky-300 transition hover:bg-sky-100 dark:hover:bg-sky-900/40 shadow-xs cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 text-sky-500" />
              <span>Telegram</span>
              {telegramSettings.enabled && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              id="reflection-guide-btn"
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 transition hover:bg-stone-100 dark:hover:bg-stone-700 shadow-xs cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>
                {lang === 'en'
                  ? 'Reflection Guidelines'
                  : lang === 'ru'
                  ? 'Рекомендации к заполнению'
                  : 'Рекомендації до заповнення'}
              </span>
              {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <button
              id="reflection-save-journal-btn"
              type="button"
              onClick={handleSaveToJournal}
              disabled={!hasContentEntered()}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white dark:text-stone-950 transition shadow-xs cursor-pointer active:scale-95"
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>
                {isSaved
                  ? lang === 'en'
                    ? 'Saved!'
                    : lang === 'ru'
                    ? 'Сохранено!'
                    : 'Збережено!'
                  : lang === 'en'
                  ? 'To Journal'
                  : lang === 'ru'
                  ? 'В Журнал'
                  : 'В Журнал'}
              </span>
            </button>
          </div>
        </div>

        {/* Detailed Coaching Guide Accordion */}
        {showGuide && (
          <div className="mt-5 rounded-xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/30 p-4 sm:p-5 text-stone-800 dark:text-stone-200 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300 text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>
                {lang === 'en'
                  ? 'How to Conduct Compassionate & High-Impact Self-Reflection'
                  : lang === 'ru'
                  ? 'Как проводить глубокую и целительную саморефлексию'
                  : 'Як проводити зрілу, глибоку та зцілюючу саморефлексію'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  1.{' '}
                  {lang === 'en'
                    ? '“Compassionate Witness” instead of “Harsh Prosecutor”'
                    : lang === 'ru'
                    ? '«Любящий свидетель» вместо «Сурового прокурора»'
                    : '«Добрий свідок» замість «Суворого прокурора»'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'en'
                    ? 'The primary enemy of reflection is rumination (guilt-tripping). View your missteps through the eyes of a wise friend who acknowledges your fatigue and genuinely believes in you.'
                    : lang === 'ru'
                    ? 'Главный враг рефлексии — руминация (токсичное пережевывание чувства вины). Смотрите на свои ошибки глазами мудрого друга, который видит вашу усталость и искренне верит в вас.'
                    : 'Головний ворог рефлексії — румінація (нескінченне самобичування «чому я такий/така»). Дивіться на власні промахи очима мудрого та турботливого наставника, який підтримує, а не карає.'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-amber-500" />
                  2.{' '}
                  {lang === 'en'
                    ? 'Separate Objective Facts from Dramatic Judgment'
                    : lang === 'ru'
                    ? 'Отделяйте факты от драматических оценок'
                    : 'Відокремлюйте факти від драматичних оцінок'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'en'
                    ? 'Fact: “I postponed the client call and opened social media”. Drama: “I lack willpower”. Record the bare fact first, identify emotional cause, then extract learning.'
                    : lang === 'ru'
                    ? 'Факт: «Я не успел отправить отчет до 18:00». Драма: «Я никчемный работник». Записывайте сначала сухой факт, затем эмоцию, и только потом ищите конструктивный урок.'
                    : 'Факт: «Я відклав дзвінок і зайшов у соцмережі». Драма: «У мене немає сили волі». Опишіть чистий факт, відчуйте емоційну причину (наприклад, страх відмови) та знайдіть опору.'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-500" />
                  3.{' '}
                  {lang === 'en'
                    ? 'Stoic Golden Rule: Circle of Control'
                    : lang === 'ru'
                    ? 'Золотое правило Стоиков: Круг контроля'
                    : 'Золоте правило стоїків: Коло контролю'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'en'
                    ? 'Do not exhaust energy on what lies outside your direct control (others’ moods, macro events). Anchor your attention on your own standards, presence, and next action.'
                    : lang === 'ru'
                    ? 'Не тратьте энергию на то, что вне вашей власти (поведение других, погода, мировые новости). Фокусируйтесь строго на своих реакциях, намерениях и следующем шаге.'
                    : 'Не картайте себе за те, що перебуває поза вашим прямим контролем (реакції інших людей, обставини). Зосередьте увагу на своїх виборах, цінностях та якості присутності.'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  4.{' '}
                  {lang === 'en'
                    ? 'One Realistic Micro-Step for Tomorrow'
                    : lang === 'ru'
                    ? 'Микро-действие на завтра'
                    : 'Один реалістичний мікрокрок на завтра'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'en'
                    ? 'Reflection without execution is armchair philosophy. Conclude every entry with one tiny commitment for tomorrow (e.g. have tea in silence, make 1 single outreach).'
                    : lang === 'ru'
                    ? 'Рефлексия без действия превращается в философию на диване. Завершайте каждый сеанс одним крошечным действием на завтра (выпить чашку чая в тишине, сделать 1 звонок).'
                    : 'Рефлексія завершується тоді, коли усвідомлення кристалізується в конкретну дію. Сформулюйте один простий крок на завтра, який не вимагає героїзму, але закріплює зміну.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Daily Reflection Prompt & Telegram Delivery Block */}
      <div className="rounded-2xl border border-teal-500/30 bg-linear-to-br from-emerald-50/40 via-white to-teal-50/30 dark:from-emerald-950/25 dark:via-stone-900 dark:to-teal-950/25 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/60 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-500/15 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-base">
              🌿
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>
                  {lang === 'en'
                    ? 'AI Reflection of the Day & Telegram'
                    : lang === 'ru'
                    ? 'ИИ-Вопрос дня & Telegram-Бот'
                    : 'ШІ-Питання дня & Telegram-Бот'}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  {promptType === 'morning' ? '☀️ Ранкова' : '🌙 Вечірня'}
                </span>
              </h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {lang === 'en'
                  ? 'Daily inspiration, focus questions, micro-tasks & automated bot delivery'
                  : lang === 'ru'
                  ? 'Глубокий вопрос, микро-задание и рассылка в Telegram'
                  : 'Глибоке коучингове питання, мікро-завдання та надсилання у Telegram'}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Morning / Evening Toggle */}
            <div className="inline-flex rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100/80 dark:bg-stone-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setPromptType('morning');
                  loadPrompt('morning');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  promptType === 'morning'
                    ? 'bg-white dark:bg-stone-900 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>{lang === 'en' ? 'Morning' : lang === 'ru' ? 'Утро' : 'Ранок'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPromptType('evening');
                  loadPrompt('evening');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  promptType === 'evening'
                    ? 'bg-white dark:bg-stone-900 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
                <span>{lang === 'en' ? 'Evening' : lang === 'ru' ? 'Вечер' : 'Вечір'}</span>
              </button>
            </div>

            {/* Telegram Link Status Badge & Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsTelegramModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                telegramSettings.enabled &&
                (telegramSettings.telegramChatId || telegramSettings.telegramUsername)
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              <Send className="h-3.5 w-3.5 text-sky-500" />
              <span>
                {telegramSettings.enabled &&
                (telegramSettings.telegramChatId || telegramSettings.telegramUsername)
                  ? `Telegram: ${telegramSettings.telegramUsername || telegramSettings.telegramChatId}`
                  : lang === 'en'
                  ? 'Link Telegram'
                  : lang === 'ru'
                  ? 'Привязать Telegram'
                  : 'Підвʼязати Telegram'}
              </span>
              <Settings className="h-3.5 w-3.5 text-stone-400 ml-0.5" />
            </button>
          </div>
        </div>

        {/* Prompt Content Card with the 5 Elements */}
        {isLoadingPrompt ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="h-6 w-6 text-teal-600 animate-spin" />
            <p className="text-xs text-stone-500">
              {lang === 'en'
                ? 'Generating thoughtful reflection question & micro-task...'
                : lang === 'ru'
                ? 'ИИ формулирует глубокий вопрос дня и микро-задание...'
                : 'ШІ формулює щире питання дня та мікро-завдання...'}
            </p>
          </div>
        ) : dailyPrompt ? (
          <div className="space-y-3.5 animate-fadeIn">
            {/* 1. Greeting */}
            <div className="font-medium text-stone-800 dark:text-stone-200 text-sm flex items-center gap-2">
              <span className="text-base">🌿</span>
              <span className="font-semibold">{dailyPrompt.greeting}</span>
            </div>

            {/* 2. Question of the day */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <span>💭</span>
                <span>{dailyPrompt.questionTitle}:</span>
              </div>
              <p className="text-sm font-serif font-bold text-stone-900 dark:text-stone-100 leading-relaxed">
                {dailyPrompt.question}
              </p>
            </div>

            {/* 3. Micro-Task */}
            <div className="rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 p-3.5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                <span>🎯</span>
                <span>
                  {lang === 'en'
                    ? 'Micro-task for joy & presence:'
                    : lang === 'ru'
                    ? 'Маленькое задание:'
                    : 'Маленьке завдання:'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {dailyPrompt.microTask}
              </p>
            </div>

            {/* 4. Daily Reminder */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <span>💚</span>
                <span>
                  {lang === 'en'
                    ? 'Daily reminder:'
                    : lang === 'ru'
                    ? 'Напоминание дня:'
                    : 'Нагадування дня:'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                {dailyPrompt.reminder}
              </p>
            </div>

            {/* 5. Wish from AI */}
            <div className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-medium flex items-center gap-2 pt-1">
              <span className="text-amber-500 text-base">☀️</span>
              <span>{dailyPrompt.wishes}</span>
            </div>

            {/* Notification / Delivery Status */}
            {telegramStatus && (
              <div
                className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                  telegramStatus.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                {telegramStatus.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{telegramStatus.message}</span>
              </div>
            )}

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
              <div className="flex flex-wrap items-center gap-2">
                {/* Regenerate */}
                <button
                  type="button"
                  onClick={() => loadPrompt(promptType)}
                  disabled={isLoadingPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-teal-600 ${isLoadingPrompt ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {lang === 'en'
                      ? 'New Question'
                      : lang === 'ru'
                      ? 'Новый вопрос'
                      : 'Нове питання'}
                  </span>
                </button>

                {/* Voice Selector & Speak / Stop TTS */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Voice Selector */}
                  <div className="flex items-center bg-stone-100 dark:bg-stone-800/90 p-0.5 rounded-xl border border-stone-250 dark:border-stone-700 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoice('Kore');
                        if (isSpeakingPrompt) {
                          stopSpeaking();
                          setIsSpeakingPrompt(false);
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-2xs font-medium transition cursor-pointer ${
                        selectedVoice === 'Kore'
                          ? 'bg-white dark:bg-stone-700 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                          : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
                      }`}
                      title={
                        lang === 'en'
                          ? 'Kore: Warm, gentle female voice'
                          : lang === 'ru'
                          ? 'Kore: Тёплый женский голос'
                          : 'Коре: Теплий, лагідний жіночий голос'
                      }
                    >
                      👩 Kore
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVoice('Charon');
                        if (isSpeakingPrompt) {
                          stopSpeaking();
                          setIsSpeakingPrompt(false);
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-2xs font-medium transition cursor-pointer ${
                        selectedVoice === 'Charon'
                          ? 'bg-white dark:bg-stone-700 text-teal-700 dark:text-teal-300 shadow-2xs font-bold'
                          : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
                      }`}
                      title={
                        lang === 'en'
                          ? 'Charon: Deep, calm male voice'
                          : lang === 'ru'
                          ? 'Charon: Спокойный мужской голос'
                          : 'Харон: Спокійний, впевнений чоловічий голос'
                      }
                    >
                      👨 Charon
                    </button>
                  </div>

                  {/* Speak / Stop Button */}
                  <button
                    type="button"
                    onClick={handleToggleSpeakPrompt}
                    title={
                      lang === 'en'
                        ? 'Listen with natural Ukrainian AI voice (no accent)'
                        : lang === 'ru'
                        ? 'Озвучить чистым голосом ШИ'
                        : 'Озвучити природним українським ШІ-голосом'
                    }
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs ${
                      isSpeakingPrompt
                        ? 'border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300 animate-pulse'
                        : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {isSpeakingPrompt ? (
                      <>
                        <VolumeX className="h-3.5 w-3.5 text-amber-600" />
                        <span>
                          {lang === 'en' ? 'Stop Audio' : lang === 'ru' ? 'Остановить' : 'Зупинити'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5 text-teal-600" />
                        <span>
                          {lang === 'en' ? 'Speak' : lang === 'ru' ? 'Озвучить' : 'Озвучити'}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* Copy */}
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 text-stone-700 dark:text-stone-200 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  {isPromptCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>
                        {lang === 'en' ? 'Copied!' : lang === 'ru' ? 'Скопировано!' : 'Скопійовано!'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-stone-500" />
                      <span>
                        {lang === 'en' ? 'Copy Text' : lang === 'ru' ? 'Копировать' : 'Скопіювати'}
                      </span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Send to Telegram Now */}
                <button
                  type="button"
                  onClick={handleSendPromptToTelegram}
                  disabled={isSendingTelegram}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                >
                  {isSendingTelegram ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isSendingTelegram
                      ? lang === 'en'
                        ? 'Sending...'
                        : lang === 'ru'
                        ? 'Отправка...'
                        : 'Надсилаю...'
                      : lang === 'en'
                      ? 'Send to Telegram'
                      : lang === 'ru'
                      ? 'Отправить в Telegram'
                      : 'Надіслати в Telegram'}
                  </span>
                </button>

                {/* Answer in reflection */}
                <button
                  type="button"
                  onClick={handleInsertPromptIntoReflection}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>
                    {lang === 'en'
                      ? 'Answer in Reflection'
                      : lang === 'ru'
                      ? 'Ответить в рефлексии'
                      : 'Відповісти у рефлексії'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Telegram Bot Settings Modal */}
      {isTelegramModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-sky-500/15 text-sky-600 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {lang === 'en'
                      ? 'Telegram Bot Notifications Setup'
                      : lang === 'ru'
                      ? 'Настройка Telegram-бота для саморефлексии'
                      : 'Налаштування Telegram-бота для саморефлексії'}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    {lang === 'en'
                      ? 'Morning & evening self-reflection prompts'
                      : lang === 'ru'
                      ? 'Утренняя и вечерняя саморефлексия'
                      : 'Ранкова та вечірня саморефлексія'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTelegramModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Enable Main Switch */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-teal-500/30 bg-teal-50/30 dark:bg-teal-950/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramSettings.enabled}
                  onChange={(e) =>
                    setTelegramSettings({ ...telegramSettings, enabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded-sm text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  {lang === 'en'
                    ? 'Enable automated Telegram delivery'
                    : lang === 'ru'
                    ? 'Включить автоматическую рассылку в Telegram'
                    : 'Увімкнути автоматичне надсилання у Telegram-бот'}
                </span>
              </label>

              {/* Schedule Checkboxes: Morning / Evening */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-3.5 space-y-3">
                <span className="font-bold text-stone-700 dark:text-stone-300 block text-[11px] uppercase tracking-wider">
                  {lang === 'en'
                    ? 'Schedule Selection (Choose Morning, Evening, or Both):'
                    : lang === 'ru'
                    ? 'Выбор времени (Утренняя, Вечерняя или обе):'
                    : 'Вибір розкладу (Ранкова, Вечірня або обидві):'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Morning Checkbox */}
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={telegramSettings.morningEnabled}
                        onChange={(e) =>
                          setTelegramSettings({
                            ...telegramSettings,
                            morningEnabled: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded-sm text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        ☀️{' '}
                        {lang === 'en'
                          ? 'Morning reflection'
                          : lang === 'ru'
                          ? 'Утренняя рефлексия'
                          : 'Ранкова саморефлексія'}
                      </span>
                    </label>
                    <div className="flex items-center gap-1.5 pl-6">
                      <Clock className="h-3 w-3 text-stone-400" />
                      <input
                        type="time"
                        value={telegramSettings.morningTime || '08:00'}
                        onChange={(e) =>
                          setTelegramSettings({
                            ...telegramSettings,
                            morningTime: e.target.value,
                          })
                        }
                        className="rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-0.5 text-xs text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>

                  {/* Evening Checkbox */}
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-stone-50 dark:bg-stone-950/50 border border-stone-200 dark:border-stone-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={telegramSettings.eveningEnabled}
                        onChange={(e) =>
                          setTelegramSettings({
                            ...telegramSettings,
                            eveningEnabled: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded-sm text-teal-600 focus:ring-teal-500 cursor-pointer"
                      />
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        🌙{' '}
                        {lang === 'en'
                          ? 'Evening reflection'
                          : lang === 'ru'
                          ? 'Вечерняя рефлексия'
                          : 'Вечірня саморефлексія'}
                      </span>
                    </label>
                    <div className="flex items-center gap-1.5 pl-6">
                      <Clock className="h-3 w-3 text-stone-400" />
                      <input
                        type="time"
                        value={telegramSettings.eveningTime || '21:00'}
                        onChange={(e) =>
                          setTelegramSettings({
                            ...telegramSettings,
                            eveningTime: e.target.value,
                          })
                        }
                        className="rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-0.5 text-xs text-stone-800 dark:text-stone-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Telegram Chat ID */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 dark:text-stone-200 block">
                    {lang === 'en'
                      ? 'Your Personal Telegram Chat ID'
                      : lang === 'ru'
                      ? 'Ваш личный Telegram Chat ID'
                      : 'Ваш особистий Telegram Chat ID (Отримувач)'}{' '}
                    *
                  </label>
                  <span className="text-[10px] text-teal-650 dark:text-teal-400 font-semibold">
                    {lang === 'en' ? 'Your account, NOT the bot' : 'ID вашого акаунту, НЕ бота'}
                  </span>
                </div>
                <input
                  type="text"
                  placeholder={
                    lang === 'en'
                      ? 'e.g. 123456789'
                      : 'наприклад: 123456789'
                  }
                  value={telegramSettings.telegramChatId || ''}
                  onChange={(e) =>
                    setTelegramSettings({ ...telegramSettings, telegramChatId: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-medium focus:border-teal-500 focus:outline-hidden"
                />
                <div className="rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-500/20 p-2.5 text-[11px] text-stone-600 dark:text-stone-300 space-y-1">
                  <p className="font-semibold text-teal-800 dark:text-teal-200">
                    💡{' '}
                    {lang === 'en'
                      ? 'How to get your personal Chat ID in 5 seconds:'
                      : lang === 'ru'
                      ? 'Как узнать свой личный Chat ID за 5 секунд:'
                      : 'Як дізнатися свій особистий Chat ID за 5 секунд:'}
                  </p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-stone-600 dark:text-stone-400">
                    <li>
                      {lang === 'en'
                        ? 'Open @userinfobot in Telegram and press /start'
                        : lang === 'ru'
                        ? 'Откройте бота @userinfobot в Telegram и нажмите /start'
                        : 'Відкрийте в Telegram бота @userinfobot і натисніть кнопку Start (/start)'}
                    </li>
                    <li>
                      {lang === 'en'
                        ? 'Copy the numeric "Id" (e.g. 123456789) and paste it into this field'
                        : lang === 'ru'
                        ? 'Скопируйте числовой "Id" (например 123456789) и вставьте в это поле'
                        : 'Скопіюйте числове поле "Id" (наприклад 123456789) та вставте сюди'}
                    </li>
                  </ol>
                </div>
              </div>

              {/* Bot Token */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800 dark:text-stone-200 block">
                    {lang === 'en'
                      ? 'Bot Token from @BotFather'
                      : lang === 'ru'
                      ? 'Токен бота от @BotFather (Отправитель)'
                      : 'Токен бота від @BotFather (Відправник)'}{' '}
                    *
                  </label>
                  <span className="text-[10px] text-stone-500">
                    {lang === 'en' ? 'Key from @BotFather' : 'Ключ бота'}
                  </span>
                </div>
                <input
                  type="password"
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
                  value={telegramSettings.botToken || ''}
                  onChange={(e) =>
                    setTelegramSettings({ ...telegramSettings, botToken: e.target.value })
                  }
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/25 p-2.5 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    ⚠️ {lang === 'en' ? 'Important step:' : 'Важливо після створення бота:'}
                  </p>
                  <p className="text-stone-600 dark:text-stone-300">
                    {lang === 'en'
                      ? 'After creating a bot in @BotFather, be sure to open your new bot in Telegram and press "Start" (/start), otherwise Telegram will not allow it to message you.'
                      : lang === 'ru'
                      ? 'После создания бота в @BotFather обязательно найдите своего бота в Telegram и нажмите «Старт» (/start), иначе Telegram запретит боту писать вам.'
                      : 'Після створення бота в @BotFather обов’язково знайдіть свого створеного бота в Telegram і натисніть «Розпочати» (/start), інакше Telegram забороняє ботам писати першими.'}
                  </p>
                </div>
              </div>

              {/* Test Message Result */}
              {testTelegramResult && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold flex items-center gap-2 ${
                    testTelegramResult.type === 'success'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {testTelegramResult.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{testTelegramResult.message}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={handleTestTelegramConnection}
                disabled={isTestingTelegram}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer disabled:opacity-50"
              >
                {isTestingTelegram ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageCircle className="h-3.5 w-3.5 text-sky-500" />
                )}
                <span>
                  {isTestingTelegram
                    ? lang === 'en'
                      ? 'Testing...'
                      : lang === 'ru'
                      ? 'Проверка...'
                      : 'Тестую...'
                    : lang === 'en'
                    ? 'Test Connection'
                    : lang === 'ru'
                    ? 'Проверить связь'
                    : 'Тестове повідомлення'}
                </span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTelegramModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-stone-600 dark:text-stone-400 text-xs font-medium hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel' : lang === 'ru' ? 'Отмена' : 'Скасувати'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveTelegramSettings}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                >
                  {telegramSavedNotice ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <BookmarkCheck className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {telegramSavedNotice
                      ? lang === 'en'
                        ? 'Saved!'
                        : lang === 'ru'
                        ? 'Сохранено!'
                        : 'Збережено!'
                      : lang === 'en'
                      ? 'Save Settings'
                      : lang === 'ru'
                      ? 'Сохранить настройки'
                      : 'Зберегти налаштування'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Method Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {(Object.keys(METHODS_CONFIG) as ReflectionMethod[]).map((m) => {
          const cfg = METHODS_CONFIG[m];
          const isSelected = selectedMethod === m;
          const title = lang === 'en' ? cfg.titleEn : lang === 'ru' ? cfg.titleRu : cfg.titleUk;
          const desc = lang === 'en' ? cfg.descEn : lang === 'ru' ? cfg.descRu : cfg.descUk;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMethod(m)}
              className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer ${
                isSelected
                  ? 'border-teal-500 bg-teal-500/15 dark:bg-teal-500/20 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-teal-500/40 text-stone-700 dark:text-stone-300'
              }`}
            >
              <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-teal-700 dark:text-teal-300' : ''}`}>
                {title}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                {desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* Emotional Thermometer & State Gauges */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-500" />
          {lang === 'en'
            ? 'Psycho-Emotional State Thermometer:'
            : lang === 'ru'
            ? 'Психоэмоциональный термометр состояния:'
            : 'Психоемоційний термометр стану перед записом:'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Energy Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                {lang === 'en'
                  ? 'Vital Energy Level'
                  : lang === 'ru'
                  ? 'Уровень жизненной энергии'
                  : 'Рівень життєвої енергії'}
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">{energyScore} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyScore}
              onChange={(e) => setEnergyScore(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>1: {lang === 'en' ? 'Drained' : lang === 'ru' ? 'Истощение' : 'Виснаження'}</span>
              <span>5: {lang === 'en' ? 'Normal' : lang === 'ru' ? 'Норма' : 'Норма'}</span>
              <span>10: {lang === 'en' ? 'Peak Flow' : lang === 'ru' ? 'Пик драйва' : 'Пік драйву'}</span>
            </div>
          </div>

          {/* Mood Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Smile className="h-3.5 w-3.5 text-teal-500" />
                {lang === 'en'
                  ? 'Mood Baseline'
                  : lang === 'ru'
                  ? 'Фон настроения'
                  : 'Фон настрою'}
              </span>
              <span className="text-teal-600 dark:text-teal-400 font-mono text-sm">{moodScore} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>1: {lang === 'en' ? 'Heavy / Gloomy' : lang === 'ru' ? 'Тяжесть / Мрак' : 'Тяжкість / Темінь'}</span>
              <span>5: {lang === 'en' ? 'Balanced' : lang === 'ru' ? 'Ровно' : 'Рівно'}</span>
              <span>10: {lang === 'en' ? 'Radiant / Inspired' : lang === 'ru' ? 'Свет / Вдохновение' : 'Світло / Радість'}</span>
            </div>
          </div>
        </div>

        {/* Emotions Chips */}
        <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
            {lang === 'en'
              ? 'Dominant feeling tones today (choose key ones):'
              : lang === 'ru'
              ? 'Доминирующие оттенки чувств сегодня:'
              : 'Домінуючі відтінки почуттів сьогодні (оберіть важливі):'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS_CONFIG.map((emo) => {
              const label = lang === 'en' ? emo.en : lang === 'ru' ? emo.ru : emo.uk;
              const isSelected = selectedEmotions.includes(label) || selectedEmotions.includes(emo.uk) || selectedEmotions.includes(emo.en) || selectedEmotions.includes(emo.ru);
              return (
                <button
                  key={emo.id}
                  type="button"
                  onClick={() => toggleEmotion(label)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-stone-950 border-teal-600 font-bold shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Fields depending on selectedMethod */}
      <div id="reflection-main-form" className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Method 1: Stoic Evening */}
        {selectedMethod === 'stoic_evening' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '1. What was done with dignity, honor, and virtue today?'
                    : lang === 'ru'
                    ? '1. Что сегодня сделано достойно, правильно и честно?'
                    : '1. Що сьогодні зроблено гідно, правильно і чесно?'}
                </span>
                <VoiceInputButton
                  id="voice-input-stoic-well"
                  currentValue={stoicDoneWell}
                  onTranscript={(text) => setStoicDoneWell(text)}
                  fieldLabel="Гідні вчинки"
                />
              </label>
              <p className="text-[11px] text-stone-500">
                {lang === 'en'
                  ? 'Your wins, preserved composure, acts of kindness, manifested virtues (courage, temperance, wisdom, justice).'
                  : lang === 'ru'
                  ? 'Ваши победы, сохраненный самоконтроль, добрые поступки, проявленные добродетели (мужество, умеренность, мудрость, справедливость).'
                  : 'Ваші перемоги, збережений самоконтроль, добрі вчинки, проявлені чесноти (мужність, помірність, мудрість, справедливість).'}
              </p>
              <textarea
                value={stoicDoneWell}
                onChange={(e) => setStoicDoneWell(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'Today I found the strength to listen calmly to a colleague, resisted an impulsive purchase...'
                    : lang === 'ru'
                    ? 'Сегодня я нашел(ла) в себе силы спокойно выслушать коллегу, не поддался(лась) импульсивной покупке...'
                    : 'Сьогодні я знайшов(ла) у собі сили спокійно вислухати колегу, не піддався(лася) імпульсивній покупці...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '2. Where did I lapse into weakness, autopilot, or excessive emotion?'
                    : lang === 'ru'
                    ? '2. Где я поддался(лась) слабости, автоматизму или лишним эмоциям?'
                    : '2. Де я піддався(лася) слабкості, автоматизму або зайвим емоціям?'}
                </span>
                <VoiceInputButton
                  id="voice-input-stoic-faltered"
                  currentValue={stoicFaltered}
                  onTranscript={(text) => setStoicFaltered(text)}
                  fieldLabel="Слабкості та автоматизми"
                />
              </label>
              <p className="text-[11px] text-stone-500">
                {lang === 'en'
                  ? 'Without self-flagellation: where did you lose presence, react out of fear or irritation, or compromise your standards?'
                  : lang === 'ru'
                  ? 'Без самоедства: где вы потеряли фокус, испугались, раздражились или отступили от своих стандартов?'
                  : 'Без самобичування: де ви втратили фокус, злякалися, роздратувалися або відступили від своїх стандартів?'}
              </p>
              <textarea
                value={stoicFaltered}
                onChange={(e) => setStoicFaltered(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'Felt anxious reading news and scrolled social media for 40 minutes instead of taking a walk...'
                    : lang === 'ru'
                    ? 'Почувствовал(а) приступ тревоги из-за новостей и просидел(а) 40 минут в соцсетях вместо прогулки...'
                    : 'Відчув(ла) напад тривоги через новини та просидів(ла) 40 хвилин у соцмережах замість прогулянки...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '3. How will I act wiser, calmer, and better tomorrow?'
                    : lang === 'ru'
                    ? '3. Что завтра я сделаю мудрее, спокойнее и лучше?'
                    : '3. Що завтра я зроблю мудріше, спокійніше та краще?'}
                </span>
                <VoiceInputButton
                  id="voice-input-stoic-tomorrow"
                  currentValue={stoicTomorrowBetter}
                  onTranscript={(text) => setStoicTomorrowBetter(text)}
                  fieldLabel="Мудрі дії завтра"
                />
              </label>
              <p className="text-[11px] text-stone-500">
                {lang === 'en'
                  ? 'A concrete Stoic commitment and compass for the upcoming day.'
                  : lang === 'ru'
                  ? 'Конкретное стоическое напутствие себе на предстоящий день.'
                  : 'Конкретна стоїчна настанова собі на прийдешній день.'}
              </p>
              <textarea
                value={stoicTomorrowBetter}
                onChange={(e) => setStoicTomorrowBetter(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'In the morning I will leave my phone in another room, take 15 mins for breathing, and tackle the hardest task first...'
                    : lang === 'ru'
                    ? 'Утром оставлю телефон в другой комнате, уделю 15 минут дыханию и сделаю главную задачу первой...'
                    : 'Вранці залишу телефон в іншій кімнаті, приділю 15 хвилин диханню і зроблю найважливіше завдання першим...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Method 2: Gibbs Reflective Cycle */}
        {selectedMethod === 'gibbs_cycle' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '1. Description: What happened objectively?'
                    : lang === 'ru'
                    ? '1. Описание события (Description): Что конкретно произошло?'
                    : '1. Опис події (Description): Що конкретно сталося?'}
                </span>
                <VoiceInputButton
                  id="voice-input-gibbs-desc"
                  currentValue={gibbsDescription}
                  onTranscript={(text) => setGibbsDescription(text)}
                  fieldLabel="Опис події"
                />
              </label>
              <textarea
                value={gibbsDescription}
                onChange={(e) => setGibbsDescription(e.target.value)}
                rows={2}
                placeholder={
                  lang === 'en'
                    ? 'The raw facts: who was present, sequence of actions, context...'
                    : lang === 'ru'
                    ? 'Факты ситуации: кто был рядом, что произошло, каковы были действия...'
                    : 'Факти ситуації: хто був поруч, що відбулося, які були дії...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '2. Feelings & Thoughts: What was I experiencing?'
                    : lang === 'ru'
                    ? '2. Чувства и мысли (Feelings): Что я переживал(а)?'
                    : '2. Почуття та думки (Feelings): Що я переживав(ла)?'}
                </span>
                <VoiceInputButton
                  id="voice-input-gibbs-feelings"
                  currentValue={gibbsFeelings}
                  onTranscript={(text) => setGibbsFeelings(text)}
                  fieldLabel="Почуття та думки"
                />
              </label>
              <textarea
                value={gibbsFeelings}
                onChange={(e) => setGibbsFeelings(e.target.value)}
                rows={2}
                placeholder={
                  lang === 'en'
                    ? 'What emotions arose during and after? What sensations in the body?'
                    : lang === 'ru'
                    ? 'Какие эмоции возникли в момент события и после него? Что происходило в теле?'
                    : 'Які емоції виникли в момент події і після неї? Що відбувалося в тілі?'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>
                    {lang === 'en'
                      ? '3. Evaluation: What went well / poorly?'
                      : lang === 'ru'
                      ? '3. Оценка (Evaluation): Что было хорошо / плохо?'
                      : '3. Оцінка (Evaluation): Що було добре/погано?'}
                  </span>
                  <VoiceInputButton
                    id="voice-input-gibbs-eval"
                    currentValue={gibbsEvaluation}
                    onTranscript={(text) => setGibbsEvaluation(text)}
                    fieldLabel="Оцінка"
                  />
                </label>
                <textarea
                  value={gibbsEvaluation}
                  onChange={(e) => setGibbsEvaluation(e.target.value)}
                  rows={2}
                  placeholder={
                    lang === 'en'
                      ? 'What worked out and what fell short?'
                      : lang === 'ru'
                      ? 'Что сработало на пользу, а что пошло не так?'
                      : 'Що спрацювало на користь, а що пішло не так?'
                  }
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>
                    {lang === 'en'
                      ? '4. Analysis: Why did this happen?'
                      : lang === 'ru'
                      ? '4. Анализ (Analysis): Почему это произошло?'
                      : '4. Аналіз (Analysis): Чому це сталося?'}
                  </span>
                  <VoiceInputButton
                    id="voice-input-gibbs-analysis"
                    currentValue={gibbsAnalysis}
                    onTranscript={(text) => setGibbsAnalysis(text)}
                    fieldLabel="Аналіз"
                  />
                </label>
                <textarea
                  value={gibbsAnalysis}
                  onChange={(e) => setGibbsAnalysis(e.target.value)}
                  rows={2}
                  placeholder={
                    lang === 'en'
                      ? 'What underlying factors or unspoken needs shaped the outcome?'
                      : lang === 'ru'
                      ? 'Какие скрытые факторы или потребности повлияли на развитие событий?'
                      : 'Які приховані фактори або потреби вплинули на розвиток подій?'
                  }
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
                  <span>
                    {lang === 'en'
                      ? '5. Conclusion: What did I learn?'
                      : lang === 'ru'
                      ? '5. Вывод (Conclusion): Чему это меня научило?'
                      : '5. Висновок (Conclusion): Чого це мене навчило?'}
                  </span>
                  <VoiceInputButton
                    id="voice-input-gibbs-conclusion"
                    currentValue={gibbsConclusion}
                    onTranscript={(text) => setGibbsConclusion(text)}
                    fieldLabel="Висновок"
                  />
                </label>
                <textarea
                  value={gibbsConclusion}
                  onChange={(e) => setGibbsConclusion(e.target.value)}
                  rows={2}
                  placeholder={
                    lang === 'en'
                      ? 'What new insight did I gain about myself, boundaries, and reactions?'
                      : lang === 'ru'
                      ? 'Что нового я узнал(а) о себе, своих границах и реакциях?'
                      : 'Що нового я дізнався(лася) про себе, свої межі та реакції?'
                  }
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center justify-between">
                  <span>
                    {lang === 'en'
                      ? '6. Action Plan: What will I do next time?'
                      : lang === 'ru'
                      ? '6. План действий (Action Plan): Что сделаю в следующий раз?'
                      : '6. План дій (Action Plan): Що зроблю наступного разу?'}
                  </span>
                  <VoiceInputButton
                    id="voice-input-gibbs-action"
                    currentValue={gibbsActionPlan}
                    onTranscript={(text) => setGibbsActionPlan(text)}
                    fieldLabel="План дій"
                  />
                </label>
                <textarea
                  value={gibbsActionPlan}
                  onChange={(e) => setGibbsActionPlan(e.target.value)}
                  rows={2}
                  placeholder={
                    lang === 'en'
                      ? 'If this situation repeats, my precise response playbook...'
                      : lang === 'ru'
                      ? 'Если ситуация повторится, мой конкретный алгоритм действий...'
                      : 'Якщо ситуація повториться, мій конкретний алгоритм дій...'
                  }
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Method 3: Driscoll (What? So What? Now What?) */}
        {selectedMethod === 'what_so_what' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '1. What? (What happened?)'
                    : lang === 'ru'
                    ? '1. Что произошло? (What?)'
                    : '1. Що сталося? (What?)'}
                </span>
                <VoiceInputButton
                  id="voice-input-what"
                  currentValue={whatHappened}
                  onTranscript={(text) => setWhatHappened(text)}
                  fieldLabel="Що сталося"
                />
              </label>
              <textarea
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'Describe the pivotal event, conversation, or internal state...'
                    : lang === 'ru'
                    ? 'Опишите главное событие, разговор или внутреннее состояние...'
                    : 'Опишіть головну подію, розмову чи внутрішній стан...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '2. So What? (What does it mean for me?)'
                    : lang === 'ru'
                    ? '2. Ну и что? Какое значение это имеет для меня? (So What?)'
                    : '2. Ну і що? Яке це має значення для мене? (So What?)'}
                </span>
                <VoiceInputButton
                  id="voice-input-so-what"
                  currentValue={soWhatMeaning}
                  onTranscript={(text) => setSoWhatMeaning(text)}
                  fieldLabel="Ну і що"
                />
              </label>
              <textarea
                value={soWhatMeaning}
                onChange={(e) => setSoWhatMeaning(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'Why did this trigger me? Which values were touched? What are the implications?'
                    : lang === 'ru'
                    ? 'Почему это меня задело? Какие мои ценности здесь задействованы? Каковы последствия?'
                    : 'Чому це мене зачепило? Які мої цінності тут задіяні? Які наслідки?'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '3. Now What? (What will I do with this?)'
                    : lang === 'ru'
                    ? '3. Что теперь? Что я с этим сделаю? (Now What?)'
                    : '3. Що тепер? Що я з цим робитиму? (Now What?)'}
                </span>
                <VoiceInputButton
                  id="voice-input-now-what"
                  currentValue={nowWhatNextStep}
                  onTranscript={(text) => setNowWhatNextStep(text)}
                  fieldLabel="Що тепер"
                />
              </label>
              <textarea
                value={nowWhatNextStep}
                onChange={(e) => setNowWhatNextStep(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'My next concrete micro-step or deliberate mindset shift...'
                    : lang === 'ru'
                    ? 'Мой следующий конкретный шаг или изменение отношения...'
                    : 'Мій наступний конкретний крок або зміна ставлення...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Method 4: KPT Retrospective */}
        {selectedMethod === 'kpt_retrospective' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? 'KEEP: What worked wonderfully and should be continued?'
                    : lang === 'ru'
                    ? 'KEEP (Сохранить): Что работает отлично и стоит продолжать?'
                    : 'KEEP (Зберегти): Що працює класно і що варто продовжувати?'}
                </span>
                <VoiceInputButton
                  id="voice-input-kpt-keep"
                  currentValue={kptKeep}
                  onTranscript={(text) => setKptKeep(text)}
                  fieldLabel="Keep Зберегти"
                />
              </label>
              <textarea
                value={kptKeep}
                onChange={(e) => setKptKeep(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'My productive habits, supportive choices, and replenishing moments...'
                    : lang === 'ru'
                    ? 'Мои удачные привычки, полезные решения и приятные моменты, дающие силу...'
                    : 'Мої вдалі звички, корисні рішення та приємні моменти, які дають силу...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? 'PROBLEM: Where did friction, setbacks, or energy drains arise?'
                    : lang === 'ru'
                    ? 'PROBLEM (Проблема): Где возникли трудности, срывы или слив ресурса?'
                    : 'PROBLEM (Проблема): Де виникли труднощі, зриви або злив ресурсу?'}
                </span>
                <VoiceInputButton
                  id="voice-input-kpt-problem"
                  currentValue={kptProblem}
                  onTranscript={(text) => setKptProblem(text)}
                  fieldLabel="Problem Проблема"
                />
              </label>
              <textarea
                value={kptProblem}
                onChange={(e) => setKptProblem(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'What was an obstacle, caused discomfort, or slowed my momentum?'
                    : lang === 'ru'
                    ? 'Что мешало, вызывало дискомфорт или тормозило мое движение?'
                    : 'Що заважало, викликало дискомфорт або гальмувало мій рух?'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? 'TRY: What new experiment or adjustment will I test?'
                    : lang === 'ru'
                    ? 'TRY (Попробовать): Какой новый эксперимент или действие я протестирую?'
                    : 'TRY (Спробувати): Який новий експеримент чи дію я протестую?'}
                </span>
                <VoiceInputButton
                  id="voice-input-kpt-try"
                  currentValue={kptTry}
                  onTranscript={(text) => setKptTry(text)}
                  fieldLabel="Try Спробувати"
                />
              </label>
              <textarea
                value={kptTry}
                onChange={(e) => setKptTry(e.target.value)}
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'One new experimental approach I will implement over the next 7 days...'
                    : lang === 'ru'
                    ? 'Одно новое решение, которое я попробую внедрить в ближайшие 7 дней...'
                    : 'Одне нове рішення, яке я спробую впровадити протягом наступних 7 днів...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Method 5: Express Check-in */}
        {selectedMethod === 'express_checkin' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '1. Daily Wins (at least one micro-victory):'
                    : lang === 'ru'
                    ? '1. Победы дня (хотя бы одна мелочь):'
                    : '1. Перемоги дня (хоча б одна дрібниця):'}
                </span>
                <VoiceInputButton
                  id="voice-input-express-wins"
                  currentValue={expressWins}
                  onTranscript={(text) => setExpressWins(text)}
                  fieldLabel="Перемоги дня"
                />
              </label>
              <textarea
                value={expressWins}
                onChange={(e) => setExpressWins(e.target.value)}
                rows={2}
                placeholder={
                  lang === 'en'
                    ? 'Today I celebrate myself because...'
                    : lang === 'ru'
                    ? 'Сегодня я молодец потому, что...'
                    : 'Сьогодні я молодець тому, що...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '2. Difficulties & How I Handled Them:'
                    : lang === 'ru'
                    ? '2. Трудности и преодоление:'
                    : '2. Труднощі та подолання:'}
                </span>
                <VoiceInputButton
                  id="voice-input-express-diff"
                  currentValue={expressDifficulties}
                  onTranscript={(text) => setExpressDifficulties(text)}
                  fieldLabel="Труднощі дня"
                />
              </label>
              <textarea
                value={expressDifficulties}
                onChange={(e) => setExpressDifficulties(e.target.value)}
                rows={2}
                placeholder={
                  lang === 'en'
                    ? 'What was challenging, but I navigated through it...'
                    : lang === 'ru'
                    ? 'Что было непросто, но я с этим справился(лась)...'
                    : 'Що було непросто, але я з цим впорався(лася)...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                <span>
                  {lang === 'en'
                    ? '3. Gratitude to Self & the Day:'
                    : lang === 'ru'
                    ? '3. Благодарность себе и дню:'
                    : '3. Вдячність собі та дню:'}
                </span>
                <VoiceInputButton
                  id="voice-input-express-grat"
                  currentValue={expressGratitude}
                  onTranscript={(text) => setExpressGratitude(text)}
                  fieldLabel="Вдячність"
                />
              </label>
              <textarea
                value={expressGratitude}
                onChange={(e) => setExpressGratitude(e.target.value)}
                rows={2}
                placeholder={
                  lang === 'en'
                    ? 'I am genuinely grateful for...'
                    : lang === 'ru'
                    ? 'Я искренне благодарен(на) за...'
                    : 'Я щиро вдячний(на) за...'
                }
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {formError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-400">
            {formError}
          </div>
        )}

        {/* Action Button: AI Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {lang === 'en'
              ? 'AI supervisor spots cognitive traps and provides compassionate reframing'
              : lang === 'ru'
              ? 'ИИ-супервизор поможет отследить когнитивные ловушки и предложит поддерживающий рефрейминг'
              : 'ШІ-супервізор допоможе відстежити румінації та запропонує мʼякий підтримуючий рефреймінг'}
          </span>

          <button
            type="button"
            onClick={handleRequestAiFeedback}
            disabled={isSubmittingAi || !hasContentEntered()}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            {isSubmittingAi ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>
              {isSubmittingAi
                ? lang === 'en'
                  ? 'Supervisor is listening...'
                  : lang === 'ru'
                  ? 'Супервизор слушает...'
                  : 'Супервізор аналізує...'
                : lang === 'en'
                ? 'Get AI Supervision'
                : lang === 'ru'
                ? 'Получить ИИ-Супервизию'
                : 'Отримати ШІ-Супервізію'}
            </span>
          </button>
        </div>
      </div>

      {/* AI Supervisor Response Block */}
      {aiFeedback && (
        <div className="rounded-2xl border border-teal-500/40 bg-linear-to-br from-teal-50/50 via-white to-indigo-50/40 dark:from-teal-950/40 dark:via-stone-900 dark:to-indigo-950/40 p-5 sm:p-7 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {lang === 'en'
                  ? 'Psychological Supervisor Response'
                  : lang === 'ru'
                  ? 'Отклик Психологического Супервизора'
                  : 'Відгук Психологічного Супервізора'}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300">
              Compassionate Reflection
            </span>
          </div>

          <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">
            {aiFeedback.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Validation */}
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 space-y-1.5 shadow-xs">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                {lang === 'en' ? 'Emotional Validation:' : lang === 'ru' ? 'Валидация чувств:' : 'Емпатична валідація почуттів:'}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {aiFeedback.supportiveValidation}
              </p>
            </div>

            {/* Cognitive Trap Detector */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 p-4 space-y-1.5 shadow-xs">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {lang === 'en' ? 'Cognitive Trap Protection:' : lang === 'ru' ? 'Защита от руминаций:' : 'Захист від когнітивних пасток:'}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {aiFeedback.cognitiveTrapDetector ||
                  (lang === 'en'
                    ? 'No ruminative patterns detected. Healthy focus on constructive next steps.'
                    : lang === 'ru'
                    ? 'Паттернов руминации не обнаружено. Здоровый фокус на конструктивных действиях.'
                    : 'Паттернів румінації не виявлено. Ви зберігаєте здоровий фокус на конструктивних діях.')}
              </p>
            </div>
          </div>

          {/* Reframe & Action for tomorrow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-teal-500/30 bg-teal-50/30 dark:bg-teal-950/20 p-4 space-y-1.5">
              <h4 className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-teal-600" />
                {lang === 'en' ? 'Resource Reframe:' : lang === 'ru' ? 'Ресурсный рефрейминг:' : 'Ресурсний рефреймінг:'}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {aiFeedback.resourceReframe}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 space-y-1.5">
              <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                {lang === 'en' ? 'Micro-Step for Tomorrow:' : lang === 'ru' ? 'Микро-шаг на завтра:' : 'Підтримуючий мікрокрок на завтра:'}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {aiFeedback.actionStepForTomorrow}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
