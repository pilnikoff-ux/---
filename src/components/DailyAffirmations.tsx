import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Wind,
  Brain,
  ShieldAlert,
  ArrowRight,
  Heart,
  HelpCircle,
  Zap,
  Flame,
  Send,
  Loader2,
  Share2,
} from 'lucide-react';
import { DailyAffirmationItem } from '../types';
import {
  MOOD_CATEGORIES,
  MoodCategory,
  getDailyQuoteForDate,
  getRandomQuoteForCategory,
  CURATED_AFFIRMATIONS,
} from '../data/affirmationsData';
import { requestPersonalizedAffirmation } from '../services/geminiService';
import { saveJournalEntry, getJournalEntries } from '../services/storageService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { VoiceInputButton } from './VoiceInputButton';

interface DailyAffirmationsProps {
  onSavedToJournal?: () => void;
}

export const DailyAffirmations: React.FC<DailyAffirmationsProps> = ({ onSavedToJournal }) => {
  const { lang } = useThemeLanguage();

  const [selectedMood, setSelectedMood] = useState<DailyAffirmationItem['category']>('anxiety_overwhelm');
  const [currentAffirmation, setCurrentAffirmation] = useState<DailyAffirmationItem>(() =>
    getDailyQuoteForDate('anxiety_overwhelm')
  );
  const [copied, setCopied] = useState(false);
  const [savedJournal, setSavedJournal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('affirmation_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Breathing Box Mode
  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [breathTimer, setBreathTimer] = useState(4);

  // AI Custom Generator
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [customContext, setCustomContext] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Load quote on category change
  useEffect(() => {
    const daily = getDailyQuoteForDate(selectedMood);
    setCurrentAffirmation(daily);
    setSavedJournal(false);
  }, [selectedMood]);

  // Breathing loop timer
  useEffect(() => {
    if (!isBreathingOpen) return;

    let count = 4;
    setBreathPhase('inhale');
    setBreathTimer(4);

    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        setBreathPhase((prev) => {
          if (prev === 'inhale') {
            count = 4;
            return 'hold';
          }
          if (prev === 'hold') {
            count = 4;
            return 'exhale';
          }
          if (prev === 'exhale') {
            count = 4;
            return 'rest';
          }
          count = 4;
          return 'inhale';
        });
      }
      setBreathTimer(count);
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingOpen]);

  // Handle Speech
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert(
        lang === 'en'
          ? 'Speech synthesis is not supported in this browser.'
          : lang === 'ru'
          ? 'Озвучивание не поддерживается в вашем браузере.'
          : 'Озвучення не підтримується у вашому браузері.'
      );
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak =
      lang === 'ru'
        ? `${currentAffirmation.quoteRu || currentAffirmation.quoteUk}. ${currentAffirmation.authorOrSchoolRu || currentAffirmation.authorOrSchoolUk}.`
        : lang === 'en'
        ? `${currentAffirmation.quoteEn}. ${currentAffirmation.authorOrSchoolEn}.`
        : `${currentAffirmation.quoteUk}. ${currentAffirmation.authorOrSchoolUk}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uk-UA';
    utterance.rate = 0.88; // Calm, meditative pace
    utterance.pitch = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    const text =
      lang === 'ru'
        ? `«${currentAffirmation.quoteRu || currentAffirmation.quoteUk}» — ${currentAffirmation.authorOrSchoolRu || currentAffirmation.authorOrSchoolUk}`
        : lang === 'en'
        ? `«${currentAffirmation.quoteEn}» — ${currentAffirmation.authorOrSchoolEn}`
        : `«${currentAffirmation.quoteUk}» — ${currentAffirmation.authorOrSchoolUk}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('affirmation_favorites', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleSaveToJournal = () => {
    const title =
      lang === 'ru'
        ? `Ежедневная аффирмация: ${currentAffirmation.categoryTitleRu || currentAffirmation.categoryTitleUk}`
        : lang === 'en'
        ? `Daily Affirmation: ${currentAffirmation.categoryTitleEn}`
        : `Щоденна афірмація: ${currentAffirmation.categoryTitleUk}`;

    const summary =
      lang === 'ru'
        ? currentAffirmation.quoteRu || currentAffirmation.quoteUk
        : lang === 'en'
        ? currentAffirmation.quoteEn
        : currentAffirmation.quoteUk;

    saveJournalEntry({
      type: 'affirmations',
      title,
      summary,
      data: {
        affirmation: currentAffirmation,
        savedAt: new Date().toISOString(),
      },
    });
    setSavedJournal(true);
    if (onSavedToJournal) {
      onSavedToJournal();
    }
  };

  const handleShuffle = () => {
    const random = getRandomQuoteForCategory(selectedMood);
    setCurrentAffirmation(random);
    setSavedJournal(false);
  };

  const handleGenerateAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGeneratingAi) return;

    setIsGeneratingAi(true);
    setAiError(null);

    const activeCat = MOOD_CATEGORIES.find((c) => c.id === selectedMood);

    try {
      const result = await requestPersonalizedAffirmation({
        category: activeCat ? activeCat.titleUk : selectedMood,
        userContext: customContext,
        lang: lang === 'en' ? 'en' : 'uk',
      });

      const newAffirmation: DailyAffirmationItem = {
        id: `ai-aff-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        category: selectedMood,
        categoryTitleUk: activeCat ? activeCat.titleUk : 'Індивідуальна опора',
        categoryTitleEn: activeCat ? activeCat.titleEn : 'Personalized Anchor',
        quoteUk: result.quote,
        quoteEn: result.quote,
        authorOrSchoolUk: result.authorOrSchool,
        authorOrSchoolEn: result.authorOrSchool,
        psychologicalMechanismUk: result.psychologicalMechanism,
        psychologicalMechanismEn: result.psychologicalMechanism,
        somaticAnchorUk: result.somaticAnchor,
        somaticAnchorEn: result.somaticAnchor,
        reflectionQuestionUk: result.reflectionQuestion,
        reflectionQuestionEn: result.reflectionQuestion,
        microActionUk: result.microAction,
        microActionEn: result.microAction,
        isAiGenerated: true,
      };

      setCurrentAffirmation(newAffirmation);
      setSavedJournal(false);
      setIsAiPanelOpen(false);
      setCustomContext('');
    } catch (err: any) {
      setAiError(err.message || (lang === 'en' ? 'Failed to generate affirmation.' : 'Не вдалося створити афірмацію. Спробуйте ще раз.'));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const activeCategory = MOOD_CATEGORIES.find((c) => c.id === selectedMood) || MOOD_CATEGORIES[0];
  const isFav = favorites.includes(currentAffirmation.id);

  const todayFormatted = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'uk-UA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-3xl border border-amber-500/30 bg-linear-to-r from-amber-500/10 via-amber-400/5 to-teal-500/10 p-6 md:p-8 backdrop-blur-md shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                {lang === 'ru'
                  ? 'Ежедневная психологическая опора'
                  : lang === 'en'
                  ? 'Daily Psychological Grounding'
                  : 'Щоденна психологічна опора'}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 capitalize">
                {todayFormatted}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
              {lang === 'ru'
                ? 'Ежедневные аффирмации и нейро-опоры'
                : lang === 'en'
                ? 'Daily Affirmations & Neuro-Anchors'
                : 'Щоденні афірмації та нейро-опори'}
            </h1>
            <p className="text-xs md:text-sm text-stone-600 dark:text-stone-300 max-w-2xl">
              {lang === 'ru'
                ? 'Научно обоснованные когнитивные переформулирования, стоическая мудрость и телесные якоря, адаптированные под ваше актуальное психоэмоциональное состояние.'
                : lang === 'en'
                ? 'Scientifically backed cognitive reframings, stoic wisdom, and somatic practices tailored to your exact emotional state. No toxic positivity — only grounding strength.'
                : 'Науково обґрунтовані когнітивні переформулювання, стоїчна мудрість та тілесні якорі, адаптовані під ваш актуальний психоемоційний стан.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBreathingOpen(!isBreathingOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isBreathingOpen
                  ? 'bg-teal-600 text-white shadow-teal-500/30'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-700'
              }`}
            >
              <Wind className="w-4 h-4 text-teal-500" />
              <span>
                {isBreathingOpen
                  ? lang === 'ru'
                    ? 'Закрыть дыхание'
                    : lang === 'en'
                    ? 'Close Breathing'
                    : 'Закрити дихання'
                  : lang === 'ru'
                  ? 'Дышать с цитатой'
                  : lang === 'en'
                  ? 'Breathe with Quote'
                  : 'Дихати з цитатою'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {lang === 'ru'
                  ? 'ИИ-Персонализация'
                  : lang === 'en'
                  ? 'AI Personalize'
                  : 'ШІ-Персоналізація'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Bespoke Generation Modal / Drawer */}
      {isAiPanelOpen && (
        <div className="rounded-2xl border-2 border-violet-500/40 bg-violet-50/50 dark:bg-violet-950/20 p-5 md:p-6 space-y-4 shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-violet-600 text-white">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {lang === 'ru'
                    ? 'ИИ-Генератор персонализированной аффирмации'
                    : lang === 'en'
                    ? 'AI Custom Psychological Reframe'
                    : 'ШІ-Генератор персоналізованої афірмації'}
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Опишите ситуацию, сомнение или усталость — ИИ создаст терапевтическую формулу специально для вас.'
                    : lang === 'en'
                    ? 'Describe your exact worry, dilemma, or fatigue, and AI will synthesize a precise neuro-affirmation.'
                    : 'Опишіть ситуацію, сумнів чи втому — ШІ створить терапевтичну формулу саме для вас.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAiPanelOpen(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs px-2 py-1"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleGenerateAi} className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  {lang === 'ru'
                    ? 'Ваш контекст / запрос:'
                    : lang === 'en'
                    ? 'Your context / request:'
                    : 'Ваш контекст / запит:'}
                </label>
                <VoiceInputButton
                  id="voice-input-affirmations-context"
                  currentValue={customContext}
                  onTranscript={(text) => setCustomContext(text)}
                  fieldLabel={
                    lang === 'ru'
                      ? 'Контекст запроса'
                      : lang === 'en'
                      ? 'Custom context'
                      : 'Контекст запиту'
                  }
                />
              </div>
              <textarea
                value={customContext}
                onChange={(e) => setCustomContext(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Например: Сегодня предстоит важное выступление, чувствую синдром самозванца и страх, что все пойдет не по плану...'
                    : lang === 'en'
                    ? 'E.g.: I have a high-stakes meeting today and feel impostor syndrome creeping in, fear that my work is not enough...'
                    : 'Наприклад: Сьогодні маю важливий виступ, відчуваю синдром самозванця і страх, що все піде не за планом...'
                }
                rows={3}
                className="w-full rounded-xl border border-violet-300 dark:border-violet-800 bg-white dark:bg-stone-900 p-3 text-xs text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {aiError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {aiError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAiPanelOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 cursor-pointer"
              >
                {lang === 'ru' ? 'Отмена' : lang === 'en' ? 'Cancel' : 'Скасувати'}
              </button>
              <button
                type="submit"
                disabled={isGeneratingAi}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white cursor-pointer shadow-xs"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {lang === 'ru'
                        ? 'Синтезируем опору...'
                        : lang === 'en'
                        ? 'Synthesizing...'
                        : 'Синтезуємо опору...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ru'
                        ? 'Создать формулу поддержки'
                        : lang === 'en'
                        ? 'Generate Support Formula'
                        : 'Створити формулу підтримки'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mood / Emotional State Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>
              {lang === 'ru'
                ? '1. Выберите актуальное психоэмоциональное состояние:'
                : lang === 'en'
                ? '1. Select Your Current Psychological State:'
                : '1. Оберіть свій актуальний психоемоційний стан:'}
            </span>
          </label>
          <span className="text-[11px] text-stone-400">
            {lang === 'ru'
              ? '8 адаптированных архетипов'
              : lang === 'en'
              ? '8 adapted archetypes'
              : '8 адаптованих архетипів'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {MOOD_CATEGORIES.map((cat) => {
            const isSelected = selectedMood === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedMood(cat.id)}
                className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/40 shadow-md ring-2 ring-amber-500/80 dark:ring-amber-400/80'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 hover:bg-stone-50 dark:hover:bg-stone-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xl">{cat.emoji}</span>
                  {isSelected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse shadow-xs" />
                  )}
                </div>
                <h4
                  className={`text-xs font-bold leading-snug ${
                    isSelected
                      ? 'text-amber-950 dark:text-amber-300 font-extrabold'
                      : 'text-stone-900 dark:text-stone-100'
                  }`}
                >
                  {lang === 'ru' ? cat.titleRu || cat.titleUk : lang === 'en' ? cat.titleEn : cat.titleUk}
                </h4>
                <p
                  className={`text-[11px] mt-1 line-clamp-2 leading-tight ${
                    isSelected
                      ? 'text-stone-800 dark:text-stone-200 font-medium'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {lang === 'ru' ? cat.descriptionRu || cat.descriptionUk : lang === 'en' ? cat.descriptionEn : cat.descriptionUk}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized Breathing Box (Optional Accordion) */}
      {isBreathingOpen && (
        <div className="rounded-3xl border-2 border-teal-500/40 bg-linear-to-b from-teal-500/10 via-teal-500/5 to-transparent p-6 text-center space-y-4 shadow-sm animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-teal-700 dark:text-teal-300">
            <Wind className="w-4 h-4 animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {lang === 'ru'
                ? 'Соматическое резонансное дыхание с аффирмацией (Бокс 4-4-4-4)'
                : lang === 'en'
                ? 'Somatic Resonance Breathing (4-4-4-4 Box)'
                : 'Соматичне резонансне дихання з афірмацією'}
            </span>
          </div>

          <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
            <div
              className={`absolute inset-0 rounded-full border-4 border-teal-500/30 transition-all duration-1000 ${
                breathPhase === 'inhale'
                  ? 'scale-110 bg-teal-500/20'
                  : breathPhase === 'hold'
                  ? 'scale-110 bg-teal-500/30 ring-4 ring-teal-400/40'
                  : breathPhase === 'exhale'
                  ? 'scale-90 bg-teal-500/10'
                  : 'scale-90 bg-teal-500/5'
              }`}
            />
            <div className="relative z-10 space-y-1">
              <span className="text-xs font-bold uppercase text-teal-800 dark:text-teal-200">
                {breathPhase === 'inhale' && (lang === 'ru' ? 'Вдох' : lang === 'en' ? 'Inhale' : 'Вдих')}
                {breathPhase === 'hold' && (lang === 'ru' ? 'Задержка' : lang === 'en' ? 'Hold' : 'Затримка')}
                {breathPhase === 'exhale' && (lang === 'ru' ? 'Выдох' : lang === 'en' ? 'Exhale' : 'Видих')}
                {breathPhase === 'rest' && (lang === 'ru' ? 'Пауза' : lang === 'en' ? 'Pause' : 'Пауза')}
              </span>
              <div className="text-3xl font-extrabold text-teal-900 dark:text-teal-100 font-mono">
                {breathTimer}
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-300 max-w-md mx-auto italic">
            {breathPhase === 'inhale' &&
              (lang === 'ru'
                ? 'Вдыхайте спокойствие в центр грудной клетки...'
                : lang === 'en'
                ? 'Inhale calm presence into your chest...'
                : 'Вдихайте спокій у центр грудної клітки...')}
            {breathPhase === 'hold' &&
              (lang === 'ru'
                ? 'Задержите дыхание и почувствуйте слова цитаты...'
                : lang === 'en'
                ? 'Hold and let the affirmation resonate in mind...'
                : 'Затримайте подих і відчуйте слова цитати...')}
            {breathPhase === 'exhale' &&
              (lang === 'ru'
                ? 'Медленно выпускайте все напряжение и спешку...'
                : lang === 'en'
                ? 'Slowly release all muscle tension and rush...'
                : 'Повільно випускайте всю напругу та поспіх...')}
            {breathPhase === 'rest' &&
              (lang === 'ru'
                ? 'Отдохните в тишине перед следующим вдохом.'
                : lang === 'en'
                ? 'Rest in pure awareness before the next breath.'
                : 'Відпочиньте у тиші перед наступним вдихом.')}
          </p>
        </div>
      )}

      {/* Main Quote / Affirmation Card */}
      <div className="relative rounded-3xl border-2 border-amber-500/30 bg-slate-900/95 dark:bg-slate-900/95 text-slate-100 p-6 md:p-10 shadow-2xl space-y-6 overflow-hidden backdrop-blur-md">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Top Badges & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              {lang === 'ru'
                ? currentAffirmation.categoryTitleRu || currentAffirmation.categoryTitleUk
                : lang === 'en'
                ? currentAffirmation.categoryTitleEn
                : currentAffirmation.categoryTitleUk}
            </span>
            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {lang === 'ru'
                ? currentAffirmation.authorOrSchoolRu || currentAffirmation.authorOrSchoolUk
                : lang === 'en'
                ? currentAffirmation.authorOrSchoolEn
                : currentAffirmation.authorOrSchoolUk}
            </span>
            {currentAffirmation.isAiGenerated && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                AI Tailored
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeech}
              title={
                lang === 'ru'
                  ? 'Озвучить аффирмацию'
                  : lang === 'en'
                  ? 'Listen to affirmation'
                  : 'Озвучити афірмацію'
              }
              className={`min-h-[40px] min-w-[40px] p-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center ${
                isSpeaking
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold animate-pulse'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              title={
                lang === 'ru'
                  ? 'Скопировать цитату'
                  : lang === 'en'
                  ? 'Copy quote'
                  : 'Скопіювати цитату'
              }
              className="min-h-[40px] min-w-[40px] p-2.5 rounded-xl text-xs font-medium border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer flex items-center justify-center"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => toggleFavorite(currentAffirmation.id)}
              title={
                lang === 'ru'
                  ? 'Добавить в избранное'
                  : lang === 'en'
                  ? 'Add to favorites'
                  : 'Додати в улюблені'
              }
              className={`min-h-[40px] min-w-[40px] p-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center justify-center ${
                isFav
                  ? 'bg-rose-950/60 text-rose-300 border-rose-600/60'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-400 text-rose-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShuffle}
              title={
                lang === 'ru'
                  ? 'Другая цитата для этого состояния'
                  : lang === 'en'
                  ? 'Get another quote'
                  : 'Інша цитата для цього стану'
              }
              className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {lang === 'ru' ? 'Другая' : lang === 'en' ? 'Next Quote' : 'Інша'}
              </span>
            </button>
          </div>
        </div>

        {/* The Quote Statement */}
        <div className="space-y-4 py-2">
          <div className="text-amber-400/50 text-5xl md:text-6xl font-serif select-none -mb-6 leading-none">
            “
          </div>
          <blockquote className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-amber-50 leading-snug tracking-tight">
            {lang === 'ru'
              ? currentAffirmation.quoteRu || currentAffirmation.quoteUk
              : lang === 'en'
              ? currentAffirmation.quoteEn
              : currentAffirmation.quoteUk}
          </blockquote>
          <div className="flex items-center justify-end gap-2 pt-2">
            <span className="text-xs md:text-sm font-semibold text-amber-300/90 italic">
              —{' '}
              {lang === 'ru'
                ? currentAffirmation.authorOrSchoolRu || currentAffirmation.authorOrSchoolUk
                : lang === 'en'
                ? currentAffirmation.authorOrSchoolEn
                : currentAffirmation.authorOrSchoolUk}
            </span>
          </div>
        </div>

        {/* 4 Pillars Breakdown (Mechanism, Somatic, Reflection, Micro-action) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* 1. Neuro Mechanism */}
          <div className="rounded-2xl border border-sky-600/40 bg-sky-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
              <Brain className="w-4 h-4 text-sky-400" />
              <span>
                {lang === 'ru'
                  ? 'Нейробиологический механизм:'
                  : lang === 'en'
                  ? 'Neuro-Psychological Mechanism:'
                  : 'Нейробіологічний механізм:'}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {lang === 'ru'
                ? currentAffirmation.psychologicalMechanismRu || currentAffirmation.psychologicalMechanismUk
                : lang === 'en'
                ? currentAffirmation.psychologicalMechanismEn
                : currentAffirmation.psychologicalMechanismUk}
            </p>
          </div>

          {/* 2. Somatic Anchor */}
          <div className="rounded-2xl border border-emerald-600/40 bg-emerald-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>
                {lang === 'ru'
                  ? 'Соматический якорь (Практика в теле):'
                  : lang === 'en'
                  ? 'Somatic Anchor (Body practice):'
                  : 'Соматичний якір (Практика в тілі):'}
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {lang === 'ru'
                ? currentAffirmation.somaticAnchorRu || currentAffirmation.somaticAnchorUk
                : lang === 'en'
                ? currentAffirmation.somaticAnchorEn
                : currentAffirmation.somaticAnchorUk}
            </p>
          </div>

          {/* 3. Reflection Question */}
          <div className="rounded-2xl border border-amber-600/40 bg-amber-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>
                {lang === 'ru'
                  ? 'Вопрос для рефлексии в дневнике:'
                  : lang === 'en'
                  ? 'Daily Journal Reflection Question:'
                  : 'Питання для рефлексії в щоденнику:'}
              </span>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed italic">
              «
              {lang === 'ru'
                ? currentAffirmation.reflectionQuestionRu || currentAffirmation.reflectionQuestionUk
                : lang === 'en'
                ? currentAffirmation.reflectionQuestionEn
                : currentAffirmation.reflectionQuestionUk}
              »
            </p>
          </div>

          {/* 4. Micro-action */}
          <div className="rounded-2xl border border-violet-600/40 bg-violet-950/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-violet-300 font-bold text-xs">
              <Flame className="w-4 h-4 text-violet-400" />
              <span>
                {lang === 'ru'
                  ? 'Микро-шаг на 1 минуту на сегодня:'
                  : lang === 'en'
                  ? '1-Minute Micro-Step for Today:'
                  : 'Мікро-крок на 1 хвилину на сьогодні:'}
              </span>
            </div>
            <p className="text-xs text-violet-100 leading-relaxed font-medium">
              {lang === 'ru'
                ? currentAffirmation.microActionRu || currentAffirmation.microActionUk
                : lang === 'en'
                ? currentAffirmation.microActionEn
                : currentAffirmation.microActionUk}
            </p>
          </div>
        </div>

        {/* Bottom Save / Journal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {lang === 'ru'
              ? 'Сохраните эту аффирмацию в свой дневник для отслеживания внутреннего состояния.'
              : lang === 'en'
              ? 'Save this quote to your personal reflection journal for progress tracking.'
              : 'Збережіть цю афірмацію у свій щоденник для відстеження внутрішнього стану.'}
          </span>

          <button
            type="button"
            onClick={handleSaveToJournal}
            disabled={savedJournal}
            className={`min-h-[44px] flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-lg ${
              savedJournal
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold'
            }`}
          >
            {savedJournal ? (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>
                  {lang === 'ru'
                    ? 'Сохранено в Журнал'
                    : lang === 'en'
                    ? 'Saved to Journal'
                    : 'Збережено в Журнал'}
                </span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>
                  {lang === 'ru'
                    ? 'Сохранить в Мой Журнал'
                    : lang === 'en'
                    ? 'Save to My Journal'
                    : 'Зберегти у Мій Журнал'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Favorites Showcase (if any) */}
      {favorites.length > 0 && (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span>
              {lang === 'ru'
                ? `Ваши избранные опоры (${favorites.length})`
                : lang === 'en'
                ? `Your Favorite Anchors (${favorites.length})`
                : `Ваші улюблені опори (${favorites.length})`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {CURATED_AFFIRMATIONS.filter((item) => favorites.includes(item.id)).map((item) => (
              <div
                key={item.id}
                onClick={() => setCurrentAffirmation(item)}
                className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-400 transition-all cursor-pointer space-y-1.5 shadow-xs"
              >
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                  {lang === 'ru' ? item.categoryTitleRu || item.categoryTitleUk : lang === 'en' ? item.categoryTitleEn : item.categoryTitleUk}
                </span>
                <p className="text-xs font-medium text-stone-800 dark:text-stone-200 line-clamp-2 italic">
                  «{lang === 'ru' ? item.quoteRu || item.quoteUk : lang === 'en' ? item.quoteEn : item.quoteUk}»
                </p>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
                  — {lang === 'ru' ? item.authorOrSchoolRu || item.authorOrSchoolUk : lang === 'en' ? item.authorOrSchoolEn : item.authorOrSchoolUk}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
