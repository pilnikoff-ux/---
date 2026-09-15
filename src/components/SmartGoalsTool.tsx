import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  BookOpen,
  Calendar,
  Send,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  ListTodo,
} from 'lucide-react';
import { SmartGoalData } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { getUserProfile } from '../services/userStatsService';
import { saveJournalEntry } from '../services/storageService';
import { requestSmartGoalAudit } from '../services/geminiService';
import { VoiceInputButton } from './VoiceInputButton';

const STORAGE_KEY = 'psy_smart_goals_v1';

interface SmartGoalsProps {
  initialGoalTitle?: string;
  initialCategory?: string;
  onSavedToJournal?: () => void;
}

export const SmartGoalsTool: React.FC<SmartGoalsProps> = ({
  initialGoalTitle = '',
  initialCategory = 'career',
  onSavedToJournal,
}) => {
  const { lang, t } = useThemeLanguage();

  const [goals, setGoals] = useState<SmartGoalData[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Active form state
  const [title, setTitle] = useState(initialGoalTitle);
  const [category, setCategory] = useState(initialCategory);
  const [deadline, setDeadline] = useState('');

  // SMART criteria
  const [specific, setSpecific] = useState('');
  const [measurable, setMeasurable] = useState('');
  const [achievable, setAchievable] = useState('');
  const [relevant, setRelevant] = useState('');
  const [timeBound, setTimeBound] = useState('');

  // WOOP & Implementation Intentions
  const [woopWish, setWoopWish] = useState('');
  const [woopOutcome, setWoopOutcome] = useState('');
  const [woopObstacle, setWoopObstacle] = useState('');
  const [woopPlanIfThen, setWoopPlanIfThen] = useState('');
  const [first72hStep, setFirst72hStep] = useState('');

  const [showGuide, setShowGuide] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [aiAudit, setAiAudit] = useState<SmartGoalData['aiAudit'] | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Load saved goals
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setGoals(parsed);
          if (parsed.length > 0 && !initialGoalTitle) {
            loadGoalIntoForm(parsed[0]);
          }
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync if initialGoalTitle changes from outside (e.g. sent from 100 Wishes)
  useEffect(() => {
    if (initialGoalTitle) {
      setTitle(initialGoalTitle);
      setWoopWish(initialGoalTitle);
      if (initialCategory) setCategory(initialCategory);
      setSelectedGoalId(null);
    }
  }, [initialGoalTitle, initialCategory]);

  // Save goals list
  const persistGoals = (updated: SmartGoalData[]) => {
    setGoals(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const loadGoalIntoForm = (g: SmartGoalData) => {
    setSelectedGoalId(g.id);
    setTitle(g.title);
    setCategory(g.category);
    setDeadline(g.deadline || '');
    setSpecific(g.specific);
    setMeasurable(g.measurable);
    setAchievable(g.achievable);
    setRelevant(g.relevant);
    setTimeBound(g.timeBound);
    setWoopWish(g.woopWish || '');
    setWoopOutcome(g.woopOutcome || '');
    setWoopObstacle(g.woopObstacle || '');
    setWoopPlanIfThen(g.woopPlanIfThen || '');
    setFirst72hStep(g.first72hStep || '');
    setAiAudit(g.aiAudit || null);
  };

  const handleResetToNew = () => {
    setSelectedGoalId(null);
    setTitle('');
    setCategory('career');
    setDeadline('');
    setSpecific('');
    setMeasurable('');
    setAchievable('');
    setRelevant('');
    setTimeBound('');
    setWoopWish('');
    setWoopOutcome('');
    setWoopObstacle('');
    setWoopPlanIfThen('');
    setFirst72hStep('');
    setAiAudit(null);
  };

  // Calculate live SMART Score
  const calculateSmartScore = () => {
    let score = 0;
    if (title.trim().length > 3) score += 10;
    if (specific.trim().length > 15) score += 20;
    if (measurable.trim().length > 10) score += 20;
    if (achievable.trim().length > 10) score += 15;
    if (relevant.trim().length > 10) score += 15;
    if (timeBound.trim().length > 5 || deadline) score += 10;
    if (first72hStep.trim().length > 5) score += 10;
    return Math.min(100, score);
  };

  const handleRunAiAudit = async () => {
    if (!title.trim() && !specific.trim()) {
      alert(
        lang === 'ru'
          ? 'Пожалуйста, введите название цели и хотя бы параметр Конкретности (S).'
          : 'Будь ласка, вкажіть назву цілі та хоча б параметр Конкретності (S).'
      );
      return;
    }

    setIsAuditing(true);
    try {
      const audit = await requestSmartGoalAudit({
        title,
        category,
        deadline,
        specific,
        measurable,
        achievable,
        relevant,
        timeBound,
        woopWish,
        woopOutcome,
        woopObstacle,
        woopPlanIfThen,
        first72hStep,
      });
      setAiAudit(audit);
    } catch (e) {
      console.error('Error in smart goal audit:', e);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleSaveGoal = () => {
    if (!title.trim()) {
      alert(lang === 'ru' ? 'Введите название цели' : 'Вкажіть назву цілі');
      return;
    }

    const goalData: SmartGoalData = {
      id: selectedGoalId || `smart-${Date.now()}`,
      title: title.trim(),
      category,
      deadline,
      specific,
      measurable,
      achievable,
      relevant,
      timeBound,
      woopWish,
      woopOutcome,
      woopObstacle,
      woopPlanIfThen,
      first72hStep,
      aiAudit: aiAudit || undefined,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    };

    let updated: SmartGoalData[];
    if (selectedGoalId) {
      updated = goals.map((g) => (g.id === selectedGoalId ? goalData : g));
    } else {
      updated = [goalData, ...goals];
    }
    persistGoals(updated);
    setSelectedGoalId(goalData.id);

    // Also push to journal
    const user = getUserProfile();
    saveJournalEntry({
      id: goalData.id,
      type: 'smartGoals',
      title: `SMART: ${goalData.title}`,
      date: new Date().toISOString(),
      summary: `Категорія: ${category} | Дедлайн: ${deadline || 'не вказано'} | Перший крок: ${first72hStep || 'не записано'}`,
      data: goalData,
      userId: user?.id,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (onSavedToJournal) onSavedToJournal();
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    persistGoals(updated);
    if (selectedGoalId === id) {
      handleResetToNew();
    }
  };

  const score = calculateSmartScore();

  return (
    <div id="smart-goals-container" className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-linear-to-br from-stone-50 via-teal-50/20 to-amber-50/20 dark:from-stone-900 dark:via-teal-950/20 dark:to-amber-950/20 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Target className="h-3.5 w-3.5" />
              {lang === 'ru'
                ? 'Методология SMART + Ментальный Контрастинг WOOP + Правило 72 Часов'
                : lang === 'en'
                ? 'SMART + WOOP Mental Contrasting + 72h Implementation Rules'
                : 'Методологія SMART + Ментальний Контрастинг WOOP + Правило 72 Годин'}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {lang === 'ru' ? 'Цели по SMART' : lang === 'en' ? 'SMART & WOOP Goals' : 'Цілі по SMART'}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {lang === 'ru'
                ? 'Трансформация размытых мечтаний в конкретные ориентиры. Устранение внутреннего саботажа через формулы «Если — То» Питера Голлвитцера.'
                : lang === 'en'
                ? 'Transform vague intentions into resilient action plans with built-in obstacle defense and instant momentum.'
                : 'Трансформація розмитих бажань у залізобетонні орієнтири. Нейтралізація внутрішнього саботера за допомогою формул «Якщо — То» Пітера Голлвітцера.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="smart-guide-btn"
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 transition hover:bg-stone-100 dark:hover:bg-stone-700 shadow-xs cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>{lang === 'ru' ? 'Рекомендации к заполнению' : 'Рекомендації до заповнення'}</span>
              {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <button
              id="smart-save-btn"
              type="button"
              onClick={handleSaveGoal}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white dark:text-stone-950 transition shadow-xs cursor-pointer active:scale-95"
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>{isSaved ? (lang === 'ru' ? 'Сохранено!' : 'Збережено!') : (lang === 'ru' ? 'Сохранить цель' : 'Зберегти ціль')}</span>
            </button>
          </div>
        </div>

        {/* Live Readiness Indicator */}
        <div className="mt-5 pt-4 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5 font-bold">
            <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              {lang === 'ru' ? 'Индекс проработки SMART-формулировки:' : 'Індекс пропрацьованості SMART-формулювання:'}
            </span>
            <span
              className={`font-mono text-sm font-extrabold ${
                score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-stone-400'
              }`}
            >
              {score}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Detailed Coaching Guide Accordion */}
        {showGuide && (
          <div className="mt-5 rounded-xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/30 p-4 sm:p-5 text-stone-800 dark:text-stone-200 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300 text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>
                {lang === 'ru'
                  ? 'Гайд по идеальной постановке целей: SMART + WOOP'
                  : 'Гайд з ідеальної постановки цілей: SMART + WOOP'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs leading-relaxed">
              <div className="rounded-lg bg-white/70 dark:bg-stone-900/70 p-3 border border-stone-200/70 dark:border-stone-800 space-y-1">
                <h5 className="font-bold text-teal-700 dark:text-teal-400">S — Конкретна (Specific)</h5>
                <p className="text-stone-600 dark:text-stone-400">
                  <span className="text-rose-500 font-semibold">Погано:</span> «Хочу краще виглядати».<br />
                  <span className="text-emerald-600 font-semibold">Добре:</span> «Знизити жирову масу на 4 кг і мати стабільну енергію протягом дня».
                </p>
              </div>

              <div className="rounded-lg bg-white/70 dark:bg-stone-900/70 p-3 border border-stone-200/70 dark:border-stone-800 space-y-1">
                <h5 className="font-bold text-teal-700 dark:text-teal-400">M — Вимірювана (Measurable)</h5>
                <p className="text-stone-600 dark:text-stone-400">
                  <span className="text-rose-500 font-semibold">Погано:</span> «Заробляти багато».<br />
                  <span className="text-emerald-600 font-semibold">Добре:</span> «Вийти на щомісячний дохід $3000 чистими за рахунок 3 нових клієнтів».
                </p>
              </div>

              <div className="rounded-lg bg-white/70 dark:bg-stone-900/70 p-3 border border-stone-200/70 dark:border-stone-800 space-y-1">
                <h5 className="font-bold text-teal-700 dark:text-teal-400">A — Досяжна (Achievable)</h5>
                <p className="text-stone-600 dark:text-stone-400">
                  Чи є у вас час і здоровʼя? Ціль має кидати виклик на 7-8 балів з 10, але не викликати паралізуючий жах та вигорання.
                </p>
              </div>

              <div className="rounded-lg bg-white/70 dark:bg-stone-900/70 p-3 border border-stone-200/70 dark:border-stone-800 space-y-1">
                <h5 className="font-bold text-teal-700 dark:text-teal-400">R — Релевантна (Relevant)</h5>
                <p className="text-stone-600 dark:text-stone-400">
                  Чому це важливо саме для ВАС, а не для очікувань суспільства? Яка глибинна цінність (свобода, безпека, любов) живиться цією метою?
                </p>
              </div>

              <div className="rounded-lg bg-white/70 dark:bg-stone-900/70 p-3 border border-stone-200/70 dark:border-stone-800 space-y-1">
                <h5 className="font-bold text-teal-700 dark:text-teal-400">T — Обмежена в часі (Time-bound)</h5>
                <p className="text-stone-600 dark:text-stone-400">
                  Точна дата (день, місяць, рік). Без дедлайну мозок сприймає мету як необовʼязкову фантазію на пенсію.
                </p>
              </div>

              <div className="rounded-lg bg-white/70 dark:bg-stone-900/70 p-3 border border-stone-200/70 dark:border-stone-800 space-y-1">
                <h5 className="font-bold text-amber-700 dark:text-amber-400">WOOP & Правило 72 годин</h5>
                <p className="text-stone-600 dark:text-stone-400">
                  Передбачте свого внутрішнього саботера заздалегідь: «ЯКЩО виникне лінь, ТО я зроблю 5 хвилин роботи за таймером».
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved Goals Selector */}
      {goals.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={handleResetToNew}
            className={`shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition border cursor-pointer ${
              selectedGoalId === null
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-teal-500/40'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? '+ Новая цель' : '+ Нова ціль'}</span>
          </button>

          {goals.map((g) => (
            <div
              key={g.id}
              className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
                selectedGoalId === g.id
                  ? 'bg-teal-500/15 border-teal-500 text-teal-900 dark:text-teal-200 font-bold'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400'
              }`}
            >
              <button
                type="button"
                onClick={() => loadGoalIntoForm(g)}
                className="cursor-pointer max-w-[160px] truncate"
              >
                {g.title}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteGoal(g.id)}
                className="p-0.5 text-stone-400 hover:text-rose-500 cursor-pointer"
                title="Видалити"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Goal Configuration Card */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Title, Category & Deadline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
              <span>{lang === 'ru' ? 'Название цели' : 'Назва цілі'} *</span>
              <VoiceInputButton onTranscript={(txt) => setTitle((p) => (p ? `${p} ${txt}` : txt))} />
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Наприклад: Пробігти півмарафон 21 км у вересні"
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 font-semibold focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              {lang === 'ru' ? 'Дедлайн реализации' : 'Дедлайн реалізації'}
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* 5 SMART Pillars */}
        <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
            <Target className="h-4 w-4" />
            {lang === 'ru' ? '5 опор формулировки SMART:' : '5 опор формулювання SMART:'}
          </h3>

          {/* S - Specific */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>S — Specific (Конкретна): Що саме має відбутися у фізичному світі?</span>
              <VoiceInputButton onTranscript={(txt) => setSpecific((p) => (p ? `${p} ${txt}` : txt))} />
            </label>
            <textarea
              value={specific}
              onChange={(e) => setSpecific(e.target.value)}
              rows={2}
              placeholder="Чіткий опис кінцевого результату: хто, що, де, у якому форматі..."
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* M - Measurable */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>M — Measurable (Вимірювана): Які конкретні метрики свідчитимуть про 100% готовність?</span>
              <VoiceInputButton onTranscript={(txt) => setMeasurable((p) => (p ? `${p} ${txt}` : txt))} />
            </label>
            <textarea
              value={measurable}
              onChange={(e) => setMeasurable(e.target.value)}
              rows={2}
              placeholder="Числа, відсотки, час забігу, сума в чеку, підписаний договір..."
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* A & R Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                <span>A — Achievable (Досяжна & Екологічна):</span>
                <VoiceInputButton onTranscript={(txt) => setAchievable((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={achievable}
                onChange={(e) => setAchievable(e.target.value)}
                rows={2}
                placeholder="Які ресурси, знання, навички вже є? Що потрібно підтягнути?"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                <span>R — Relevant (Релевантна): Чому це важливо зараз?</span>
                <VoiceInputButton onTranscript={(txt) => setRelevant((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={relevant}
                onChange={(e) => setRelevant(e.target.value)}
                rows={2}
                placeholder="З якими моїми глибинними цінностями узгоджується ця мета?"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* T - Time Bound */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
              <span>T — Time-bound (Проміжні чекпоїнти та час):</span>
              <VoiceInputButton onTranscript={(txt) => setTimeBound((p) => (p ? `${p} ${txt}` : txt))} />
            </label>
            <input
              type="text"
              value={timeBound}
              onChange={(e) => setTimeBound(e.target.value)}
              placeholder="Наприклад: 1-й чекпоїнт — 15 травня (10 км), фінал — 20 вересня (21 км)"
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* WOOP Section: Obstacle & If-Then Plan */}
        <div className="space-y-4 pt-2 border-t border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              {lang === 'ru'
                ? 'WOOP: Защита от внутреннего саботера'
                : 'WOOP: Захист від внутрішнього саботера'}
            </h3>
            <span className="text-[11px] text-stone-500 font-medium">Габріель Еттінген (NYU)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Внутрішня перепона (Obstacle):
              </label>
              <textarea
                value={woopObstacle}
                onChange={(e) => setWoopObstacle(e.target.value)}
                rows={2}
                placeholder="Що всередині мене може завадити? (страх критики, втома ввечері, звичка відкладати)..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Імплементаційний намір: «ЯКЩО..., ТО...»
              </label>
              <textarea
                value={woopPlanIfThen}
                onChange={(e) => setWoopPlanIfThen(e.target.value)}
                rows={2}
                placeholder="Якщо мені буде ліньки бігти вранці, то я просто взую кросівки і вийду на 5-хвилинну ходьбу..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-2.5 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* First 72 Hours Step */}
          <div className="space-y-1 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-3.5">
            <label className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-emerald-600" />
                {lang === 'ru' ? 'Правило 72 часов: Первое микро-действие' : 'Правило 72 годин: Перша найпростіша мікро-дія'}
              </span>
              <VoiceInputButton onTranscript={(txt) => setFirst72hStep((p) => (p ? `${p} ${txt}` : txt))} />
            </label>
            <p className="text-[11px] text-stone-500">
              Дія, яку ви зробите протягом 3 діб, щоб запустити нейронну інерцію успіху.
            </p>
            <input
              type="text"
              value={first72hStep}
              onChange={(e) => setFirst72hStep(e.target.value)}
              placeholder="Наприклад: Купити пульсометр або зареєструватися на забіг сьогодні до 20:00"
              className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* AI Audit Action */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          <span className="text-xs text-stone-500">
            {lang === 'ru'
              ? 'ШИ-аудитор оценит формулировку на скрытые риски и задаст 3 продвигающих вопроса'
              : 'ШІ-аудитор перевірить ціль на вразливості, саботаж та запропонує коучингові підсилення'}
          </span>

          <button
            type="button"
            onClick={handleRunAiAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            {isAuditing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>
              {isAuditing
                ? (lang === 'ru' ? 'Аудит проводится...' : 'Аудит триває...')
                : (lang === 'ru' ? 'ШИ-Аудит цели' : 'ШІ-Аудит цілі')}
            </span>
          </button>
        </div>
      </div>

      {/* AI Audit Result Block */}
      {aiAudit && (
        <div className="rounded-2xl border border-teal-500/40 bg-linear-to-br from-teal-50/50 via-white to-indigo-50/40 dark:from-teal-950/40 dark:via-stone-900 dark:to-indigo-950/40 p-5 sm:p-7 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {lang === 'ru' ? 'Результаты ШИ-Аудита по стандартам SMART & ICF' : 'Результати ШІ-Аудиту за стандартами SMART & ICF'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">SMART-оцінка:</span>
              <span className="text-sm font-extrabold font-mono px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300">
                {aiAudit.smartScore} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {lang === 'ru' ? 'Сильные стороны формулировки:' : 'Сильні сторони формулювання:'}
              </h4>
              <ul className="list-disc list-inside text-xs text-stone-700 dark:text-stone-300 space-y-1">
                {aiAudit.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>

            {/* Vulnerabilities */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 p-4 space-y-2">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                {lang === 'ru' ? 'Уязвимости и риски саботажа:' : 'Вразливості та ризики саботажу:'}
              </h4>
              <ul className="list-disc list-inside text-xs text-stone-700 dark:text-stone-300 space-y-1">
                {aiAudit.vulnerabilities.map((v, idx) => (
                  <li key={idx}>{v}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Coaching Questions */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 space-y-2">
            <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-indigo-600" />
              {lang === 'ru' ? 'Коучинговые вопросы для калибровки цели:' : '3 коучингові питання для калібрування мети:'}
            </h4>
            <ul className="list-disc list-inside text-xs text-stone-700 dark:text-stone-300 space-y-1">
              {aiAudit.coachQuestions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>

          {/* Boost Recommendation */}
          <div className="rounded-xl border border-teal-500/30 bg-teal-50/30 dark:bg-teal-950/20 p-4 space-y-1">
            <h4 className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-teal-600" />
              {lang === 'ru' ? 'Рекомендация по усилению:' : 'Рекомендація з підсилення імпульсу:'}
            </h4>
            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {aiAudit.boostRecommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
