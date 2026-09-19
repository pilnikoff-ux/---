import React, { useState } from 'react';
import {
  Skull,
  AlertOctagon,
  ShieldAlert,
  Target,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Bookmark,
  Share2,
  Copy,
  Check,
  Zap,
  Swords,
  ChevronDown,
  ChevronUp,
  Info,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PreMortemData, PreMortemFailureCause } from '../types';
import { runPreMortemAnalysis } from '../services/geminiService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { saveJournalEntry } from '../services/storageService';
import { logUserActivity } from '../services/userStatsService';

interface PreMortemToolProps {
  onSavedToJournal?: () => void;
  onSendToSmartGoal?: (title: string, category: string) => void;
}

const PRESETS = [
  {
    id: 'crypto-signals',
    label: 'Криптоексперт: Торгові сигнали ($25 → $100/день)',
    expertRole: 'Криптоексперт, квантовий трейдер з досвідом маркетмейкінгу та алго-систем',
    plan: 'Мій план — вийти за допомогою Генератора торгових сигналів через місяць на сталий дохід 25$ щодня і постійно реінвестувати та вийти через пів року на дохід 100 доларів на день!',
    context: 'Депозит 500-1000 USDT на біржі Binance/Bybit. Використання сигналів Telegram/Discord каналу. Кредитне плече 3x-10x.',
    horizon: 6,
  },
  {
    id: 'startup-saas',
    label: 'Стартап-архітектор: Запуск AI-сервісу за 3 місяці',
    expertRole: 'Венчурний інвестор та серійний фаундер B2B SaaS',
    plan: 'Створити мікро-SaaS на базі ШІ за 2 місяці, запустити на Product Hunt і за 4 місяці вийти на $3,000 MRR без витрат на платний маркетинг.',
    context: 'Один розробник, бюджет $1,000 на сервери. Очікування органічного вірального трафіку.',
    horizon: 6,
  },
  {
    id: 'career-jump',
    label: 'Кар’єрний стратег: Перехід в IT / Подвоєння доходу',
    expertRole: 'Executive-хедхантер та кар’єрний радник топ-менеджерів',
    plan: 'Пройти 3-місячні курси, самостійно зібрати пет-проєкт та влаштуватися за 6 місяців Senior/Lead спеціалістом у закордонну компанію із зарплатою від $4,000.',
    context: 'Англійська B1+, без комерційного досвіду в цьому стеку, 15 годин навчання на тиждень.',
    horizon: 6,
  },
];

export const PreMortemTool: React.FC<PreMortemToolProps> = ({
  onSavedToJournal,
  onSendToSmartGoal,
}) => {
  const { lang } = useThemeLanguage();

  const [plan, setPlan] = useState('');
  const [expertRole, setExpertRole] = useState('');
  const [horizonMonths, setHorizonMonths] = useState<number>(6);
  const [contextNotes, setContextNotes] = useState('');
  const [activePreset, setActivePreset] = useState<(typeof PRESETS)[0] | null>(null);
  const [isPresetPreview, setIsPresetPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PreMortemData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'causes' | 'timeline' | 'adversary' | 'revised' | 'killswitch'>('causes');
  const [expandedCause, setExpandedCause] = useState<number | null>(1);

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setActivePreset(preset);
    setIsPresetPreview(true);
    setPlan(preset.plan);
    setExpertRole(preset.expertRole);
    setContextNotes(preset.context);
    setHorizonMonths(preset.horizon);
    setError(null);
  };

  const handleFieldFocus = () => {
    if (isPresetPreview) {
      setPlan('');
      setExpertRole('');
      setContextNotes('');
      setIsPresetPreview(false);
      setActivePreset(null);
    }
  };

  const handleKeepPresetText = () => {
    setIsPresetPreview(false);
  };

  const handleClearForm = () => {
    setPlan('');
    setExpertRole('');
    setContextNotes('');
    setIsPresetPreview(false);
    setActivePreset(null);
    setError(null);
  };

  const handleRunAnalysis = async () => {
    if (!plan.trim()) {
      setError(
        lang === 'en'
          ? 'Please enter your plan or goal to analyze.'
          : 'Будь ласка, введіть ваш план або дію, яку ви збираєтесь реалізувати.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setSaved(false);

    try {
      const data = await runPreMortemAnalysis({
        plan: plan.trim(),
        expertRole: expertRole.trim(),
        horizonMonths,
        contextNotes: contextNotes.trim(),
        lang,
      });

      setResult(data);
      logUserActivity({
        tab: 'preMortem',
        toolName: 'Премортем Гері Кляйна',
        querySummary: `Премортем [${horizonMonths} міс]: ${plan.trim().slice(0, 100)}`,
        category: 'risk_management',
      });
    } catch (err: any) {
      console.error('Pre-mortem error:', err);
      setError(
        err?.message ||
          (lang === 'en'
            ? 'Failed to generate Pre-Mortem analysis. Please try again.'
            : 'Не вдалося згенерувати аналіз Премортем. Спробуйте ще раз.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToJournal = () => {
    if (!result) return;

    saveJournalEntry({
      id: result.id,
      type: 'preMortem',
      title: result.title,
      date: result.date,
      summary: `Премортем [${result.targetHorizon}]: ${result.failureCauses.length} причин краху, смертельний ризик: ${result.mostDangerousFailure.title}`,
      data: result,
    });

    setSaved(true);
    if (onSavedToJournal) {
      onSavedToJournal();
    }
  };

  const handleCopyReport = () => {
    if (!result) return;

    const text = `💀 ПРЕМОРТЕМ: АНАЛІЗ КРАХУ З МАЙБУТНЬОГО (Гері Кляйн)
Горизонт: ${result.targetHorizon} | Експерт: ${result.expertPersona}
План: "${result.originalPlan}"

🚨 ПЕРШИЙ ТРИВОЖНИЙ СИГНАЛ:
${result.firstEarlyRedFlag}

💥 НАЙБІЛЬШЕ ПРИХОВАНЕ ДОПУЩЕННЯ ТА ТОТАЛЬНИЙ ІЗ'ЯН:
Допущення: ${result.biggestHiddenAssumption.assumption}
Відверта правда: ${result.biggestHiddenAssumption.brutalTruth}
Діагноз: ${result.biggestHiddenAssumption.fatalFlawDiagnosis}

☠️ НАЙНЕБЕЗПЕЧНІШИЙ ПРОВАЛ (#${result.mostDangerousFailure.causeNumber}):
${result.mostDangerousFailure.title}
Чому смертельний: ${result.mostDangerousFailure.whyDeadliest}
Чим відрізняється: ${result.mostDangerousFailure.fundamentalDifference}

🔴 7 ПРИЧИН ПОВНОГО КРАХУ ТА МАТРИЦЯ РОЗТЯЖКИ:
${result.failureCauses
  .map(
    (c) =>
      `[${c.number}] ${c.title}
Механізм: ${c.mechanism}
Сигнал розтяжки (факт/цифра): ${c.earlyWarningSignal}
Тиждень перевірки: Тиждень ${c.checkWeek}`
  )
  .join('\n\n')}

🛡️ БРОНЕБІЙНИЙ ПЕРЕПИСАНИЙ ПЛАН:
${result.revisedAntiFragilePlan.summary}
Залізні правила:
${result.revisedAntiFragilePlan.newRulesOfEngagement.map((r) => `- ${r}`).join('\n')}

🛑 KILL-SWITCH ЧЕК-ЛИСТ (Критерії відмови від плану):
${result.killSwitchChecklist.map((k) => `• ${k.checkItem} => КРИТЕРІЙ ВІДМОВИ: ${k.killThreshold}`).join('\n')}

👁️ ПОГЛЯД СУПЕРНИКА (${result.adversaryPerspective.persona}):
Пастка тижня запуску: ${result.adversaryPerspective.launchWeekTrap}
Невидимий хід: ${result.adversaryPerspective.invisibleStrike}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-rose-950/40 to-stone-900 border border-rose-900/40 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider">
              <Skull className="w-3.5 h-3.5" />
              Методологія Гері Кляйна (Gary Klein)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight font-display">
              Премортем: Анатомія краху з майбутнього
            </h1>
            <p className="text-stone-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Перенесіться на 6 місяців вперед, де ваш план уже <span className="text-rose-400 font-semibold">зазнав тотального фіаско</span>. 
              Жодних заспокоювань, жодної «води» — лише хірургічний розбір прихованих допущень, смертельних пасток та конкретна матриця вимірюваних сигналів.
            </p>
          </div>

          <div className="bg-stone-950/80 border border-stone-800 rounded-xl p-3 sm:p-4 text-xs text-stone-400 space-y-1.5 shrink-0 max-w-xs">
            <div className="font-semibold text-stone-200 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Принцип перевернутого аналізу:
            </div>
            <p className="text-stone-400 leading-normal">
              «Замість запитання "що може піти не так?", ми виходимо з факту: <span className="text-stone-200">катастрофа вже сталася</span>. Це знімає оптимістичне засліплення.»
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="mt-6 pt-5 border-t border-stone-800/80">
          <div className="text-xs font-medium text-stone-400 mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Швидкий старт за реальними кейсами (або введіть свій):
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const isActive = isPresetPreview && activePreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-xs'
                      : 'bg-stone-950/60 hover:bg-stone-800/80 border-stone-800 hover:border-rose-500/40 text-stone-300 hover:text-stone-100'
                  }`}
                >
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Input Formulation Card */}
      <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-5 sm:p-7 shadow-lg space-y-5">
        {isPresetPreview && activePreset && (
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs transition-all">
            <div className="flex items-center gap-2 text-rose-200">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Зразок кейсу: <strong className="text-rose-300">{activePreset.label}</strong>.
                <span className="text-stone-300 block sm:inline sm:ml-1">
                  Поставте курсор у поле — і цей зразок автоматично зникне для вашого тексту.
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleKeepPresetText}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium transition-all cursor-pointer"
                title="Залишити текст та редагувати"
              >
                ✏️ Залишити для редагування
              </button>
              <button
                type="button"
                onClick={handleClearForm}
                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 text-[11px] transition-all cursor-pointer"
                title="Очистити всі поля"
              >
                ✕ Очистити
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Ваш план, дія або мета, яку ви плануєте запустити <span className="text-rose-400">*</span>
              </label>
              {plan && !isPresetPreview && (
                <button
                  type="button"
                  onClick={() => setPlan('')}
                  className="text-[11px] text-stone-500 hover:text-stone-300 transition-colors"
                >
                  Очистити
                </button>
              )}
            </div>
            <textarea
              value={plan}
              onFocus={handleFieldFocus}
              onChange={(e) => {
                setIsPresetPreview(false);
                setPlan(e.target.value);
              }}
              placeholder="Приклад: Мій план — вийти за допомогою генератора торгових сигналів через місяць на сталий дохід 25$ щодня і постійно реінвестувати..."
              rows={4}
              className={`w-full rounded-xl p-3.5 text-sm transition-all resize-y placeholder:text-stone-400/80 dark:placeholder:text-stone-500/80 placeholder:italic focus:placeholder:text-transparent focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                isPresetPreview
                  ? 'bg-rose-950/20 border border-rose-500/40 text-stone-300/80 italic'
                  : 'bg-stone-950 border border-stone-800 focus:border-rose-500 text-stone-100 font-normal'
              }`}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Роль суворого експерта
              </label>
              <input
                type="text"
                value={expertRole}
                onFocus={handleFieldFocus}
                onChange={(e) => {
                  setIsPresetPreview(false);
                  setExpertRole(e.target.value);
                }}
                placeholder="наприклад, Криптоексперт / Інвестор"
                className={`w-full rounded-xl px-3 py-2 text-xs transition-all placeholder:text-stone-400/80 dark:placeholder:text-stone-500/80 placeholder:italic focus:placeholder:text-transparent focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  isPresetPreview
                    ? 'bg-rose-950/20 border border-rose-500/40 text-stone-300/80 italic'
                    : 'bg-stone-950 border border-stone-800 focus:border-rose-500 text-stone-100 font-normal'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Часовий горизонт катастрофи
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 6, 12].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setHorizonMonths(months)}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      horizonMonths === months
                        ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {months} міс.
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Додатковий контекст / Ресурси (опціонально)
              </label>
              <input
                type="text"
                value={contextNotes}
                onFocus={handleFieldFocus}
                onChange={(e) => {
                  setIsPresetPreview(false);
                  setContextNotes(e.target.value);
                }}
                placeholder="Бюджет, плече, години на тиждень..."
                className={`w-full rounded-xl px-3 py-2 text-xs transition-all placeholder:text-stone-400/80 dark:placeholder:text-stone-500/80 placeholder:italic focus:placeholder:text-transparent focus:outline-none focus:ring-1 focus:ring-rose-500 ${
                  isPresetPreview
                    ? 'bg-rose-950/20 border border-rose-500/40 text-stone-300/80 italic'
                    : 'bg-stone-950 border border-stone-800 focus:border-rose-500 text-stone-100 font-normal'
                }`}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-stone-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-stone-500" />
            <span>ШІ прийме роль жорсткого скептика. Розтяжка, а не відчуття.</span>
          </div>

          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={isLoading || !plan.trim()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-rose-950/50 hover:shadow-rose-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Аналізую катастрофу з {horizonMonths}-го місяця...</span>
              </>
            ) : (
              <>
                <Skull className="w-4 h-4" />
                <span>Провести Премортем (Перенестись на {horizonMonths} міс. вперед)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 pt-2">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900/60 border border-stone-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-200">
                Премортем завершено: {result.failureCauses.length} сценаріїв краху
              </span>
              <span className="text-xs text-stone-500 hidden sm:inline">|</span>
              <span className="text-xs text-stone-400 hidden sm:inline">
                Експерт: {result.expertPersona}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-all flex items-center gap-1.5"
                title="Копіювати весь звіт у буфер обміну"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Скопійовано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Скопіювати звіт</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveToJournal}
                disabled={saved}
                className="px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-200 text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-60"
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">У Журналі</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Зберегти в Журнал</span>
                  </>
                )}
              </button>

              {onSendToSmartGoal && (
                <button
                  type="button"
                  onClick={() =>
                    onSendToSmartGoal(
                      `Бронебійна мета: ${result.originalPlan.slice(0, 45)}...`,
                      'skills_growth'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-teal-900/40 hover:bg-teal-900/60 border border-teal-700/50 text-teal-200 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>В SMART-цілі</span>
                </button>
              )}
            </div>
          </div>

          {/* Top Fatal Flaw & Hidden Assumption */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Early Warning Red Flag */}
            <div className="bg-stone-900/90 border border-amber-900/40 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                Перший тривожний сигнал (який проігнорували)
              </div>
              <p className="text-stone-200 text-sm leading-relaxed">
                {result.firstEarlyRedFlag}
              </p>
              <div className="text-xs text-amber-400/80 bg-amber-950/40 border border-amber-900/40 p-2.5 rounded-lg">
                ⚠️ <span className="font-semibold">Діагностика:</span> Цей сигнал з’являється вже на 1-2 тижні. Якщо ви бачите його — план уже почав тріщати.
              </div>
            </div>

            {/* Fatal Flaw / Biggest Hidden Assumption */}
            <div className="bg-stone-900/90 border border-rose-900/50 rounded-2xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl" />
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4" />
                Найбільше приховане допущення & Тотальний із'ян
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <span className="text-stone-400 font-medium">Сліпе допущення: </span>
                  <span className="text-stone-100 font-semibold">{result.biggestHiddenAssumption.assumption}</span>
                </div>
                <div>
                  <span className="text-stone-400 font-medium">Відверта правда: </span>
                  <span className="text-rose-300 font-medium">{result.biggestHiddenAssumption.brutalTruth}</span>
                </div>
              </div>
              <div className="text-xs text-stone-300 bg-rose-950/40 border border-rose-900/40 p-2.5 rounded-lg leading-normal">
                💥 <span className="font-semibold text-rose-300">Тотальний із'ян:</span> {result.biggestHiddenAssumption.fatalFlawDiagnosis}
              </div>
            </div>
          </div>

          {/* Most Dangerous Failure Highlight */}
          <div className="bg-gradient-to-r from-red-950/60 via-stone-900 to-red-950/60 border-2 border-red-800/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
                <Skull className="w-4 h-4" />
                Смертельний ризик №{result.mostDangerousFailure.causeNumber}: {result.mostDangerousFailure.title}
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-bold">
                Вбиває план наглухо
              </span>
            </div>
            <div className="text-sm text-stone-200 leading-relaxed">
              <p className="font-semibold text-stone-100 mb-1">Чому саме цей провал найнебезпечніший:</p>
              <p className="text-stone-300 text-xs sm:text-sm">{result.mostDangerousFailure.whyDeadliest}</p>
            </div>
            <div className="text-xs text-red-300/90 bg-red-950/50 border border-red-900/50 p-3 rounded-xl">
              <span className="font-bold text-red-200">Чим принципово відрізняється від інших:</span> {result.mostDangerousFailure.fundamentalDifference}
            </div>
          </div>

          {/* Tab Navigation for Detailed Sections */}
          <div className="flex border-b border-stone-800 gap-2 overflow-x-auto pb-1">
            {[
              { id: 'causes', label: `7 Причин краху & Сигнали`, icon: Skull },
              { id: 'timeline', label: `Хроніка ${result.targetHorizon}`, icon: Calendar },
              { id: 'adversary', label: `Хід Конкурента`, icon: Swords },
              { id: 'revised', label: `Бронебійний план`, icon: ShieldAlert },
              { id: 'killswitch', label: `Kill-Switch Чек-лист`, icon: AlertOctagon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'bg-stone-900 border-rose-500 text-rose-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: 7 Failure Causes & Measurement Matrix */}
          {activeTab === 'causes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                  <Skull className="w-4 h-4 text-rose-400" />
                  <span>7 Сценаріїв краху та точна матриця розтяжки (факти, а не відчуття!)</span>
                </h3>
                <span className="text-xs text-stone-500">Натисніть на картку для деталей</span>
              </div>

              <div className="space-y-3">
                {result.failureCauses.map((cause: PreMortemFailureCause) => {
                  const isExpanded = expandedCause === cause.number;
                  const isDeadliest = cause.number === result.mostDangerousFailure.causeNumber;

                  return (
                    <div
                      key={cause.number}
                      className={`border rounded-xl transition-all overflow-hidden ${
                        isDeadliest
                          ? 'border-red-600/70 bg-red-950/20'
                          : 'border-stone-800 bg-stone-900/70 hover:border-stone-700'
                      }`}
                    >
                      <div
                        onClick={() => setExpandedCause(isExpanded ? null : cause.number)}
                        className="p-4 cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 ${
                              isDeadliest
                                ? 'bg-red-600 text-white shadow-lg shadow-red-950'
                                : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            #{cause.number}
                          </span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-stone-100">{cause.title}</h4>
                              {isDeadliest && (
                                <span className="px-2 py-0.5 rounded bg-red-600/30 text-red-300 text-[10px] font-extrabold border border-red-500/40">
                                  НАЙБІЛЬШ ФАТАЛЬНИЙ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                              <span className="flex items-center gap-1 text-rose-400/90 font-medium">
                                <Clock className="w-3 h-3" />
                                Перевірка: Тиждень {cause.checkWeek}
                              </span>
                              <span className="text-stone-600">•</span>
                              <span className="text-stone-400 line-clamp-1">
                                Сигнал: {cause.earlyWarningSignal}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 text-stone-500">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-stone-800/80 bg-stone-950/40 space-y-3 text-xs">
                          <div>
                            <span className="font-bold text-stone-300 uppercase tracking-wider text-[11px]">
                              Механізм краху:
                            </span>
                            <p className="text-stone-200 mt-1 leading-relaxed text-sm">
                              {cause.mechanism}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                              <span className="text-rose-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <AlertOctagon className="w-3 h-3" />
                                Вимірюваний сигнал розтяжки (Факт/Цифра):
                              </span>
                              <p className="text-stone-200 font-medium">
                                {cause.earlyWarningSignal}
                              </p>
                              <span className="text-[10px] text-stone-500 block">
                                Не орієнтуйтеся на відчуття. Зафіксуйте цей точний показник.
                              </span>
                            </div>

                            <div className="p-3 bg-stone-900 border border-stone-800 rounded-xl space-y-1">
                              <span className="text-amber-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Дедлайн аудиту:
                              </span>
                              <p className="text-stone-200 font-bold text-sm">
                                Тиждень {cause.checkWeek}
                              </p>
                              <span className="text-[10px] text-stone-500 block">
                                Якщо на цьому тижні зафіксовано сигнал — негайно вмикайте протокол зупинки.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Monthly Chronicle */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-400" />
                <span>Щомісячна хроніка катастрофи (як розвивався крах крок за кроком)</span>
              </h3>

              <div className="relative border-l-2 border-rose-900/60 ml-4 pl-6 space-y-6">
                {result.monthlyChronicle.map((item) => (
                  <div key={item.month} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-stone-950 border-2 border-rose-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    </div>

                    <div className="bg-stone-900/80 border border-stone-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-extrabold text-stone-100">
                          {item.title}
                        </h4>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                          Місяць {item.month}
                        </span>
                      </div>

                      <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                        {item.whatHappened}
                      </p>

                      <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300">
                        <span className="font-bold text-rose-200">Фатальна деталь місяця:</span> {item.destructiveDetail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Adversary Perspective */}
          {activeTab === 'adversary' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-950/40 via-stone-900 to-purple-950/40 border border-purple-900/50 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-purple-400 font-extrabold text-xs uppercase tracking-wider">
                  <Swords className="w-4 h-4" />
                  Рольова гра: Позиція того, хто найбільше виграє від вашого краху
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-stone-400 uppercase font-semibold">Ваш головний супротивник / вигодонабувач:</span>
                  <h4 className="text-base font-extrabold text-purple-200">
                    {result.adversaryPerspective.persona}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-stone-950/80 border border-purple-900/40 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                      ⚡ Що суперник зробить у тиждень вашого запуску:
                    </span>
                    <p className="text-stone-200 text-xs sm:text-sm leading-relaxed">
                      {result.adversaryPerspective.launchWeekTrap}
                    </p>
                  </div>

                  <div className="bg-stone-950/80 border border-purple-900/40 rounded-xl p-4 space-y-2">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                      👁️ Прихований хід, який ви б ніколи не помітили самі:
                    </span>
                    <p className="text-stone-200 text-xs sm:text-sm leading-relaxed">
                      {result.adversaryPerspective.invisibleStrike}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-stone-400 bg-purple-950/20 border border-purple-900/30 p-3 rounded-xl">
                  💡 <span className="font-semibold text-purple-300">Психологічний висновок:</span> Ви боретеся не з власною лінню, а з ринковою структурою та гравцями, які математично розраховують на вашу передбачувану поведінку.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Revised Anti-Fragile Plan */}
          {activeTab === 'revised' && (
            <div className="space-y-5">
              <div className="bg-stone-900/90 border border-emerald-900/40 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" />
                  Переписаний бронебійний план (Anti-Fragile Execution)
                </div>

                <p className="text-stone-200 text-sm leading-relaxed font-medium">
                  {result.revisedAntiFragilePlan.summary}
                </p>

                {/* New Rules of Engagement */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Залізні правила взаємодії (Rules of Engagement):
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {result.revisedAntiFragilePlan.newRulesOfEngagement.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-200"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step-by-step Counter-Measures */}
                <div className="space-y-3 pt-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Закриття провальних сценаріїв:
                  </span>
                  <div className="space-y-2.5">
                    {result.revisedAntiFragilePlan.concreteSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-stone-950/60 border border-stone-800 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-stone-400">
                          <span className="font-bold text-rose-400">
                            Закриття вразливості: {step.originalVulnerability}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                            Крок #{idx + 1}
                          </span>
                        </div>
                        <div className="text-stone-100 font-semibold text-sm">
                          {step.revisedAction}
                        </div>
                        <div className="text-emerald-400/90 text-[11px] leading-relaxed">
                          <span className="font-bold">Чому це захищає:</span> {step.whyRationale}
                        </div>
                        {onSendToSmartGoal && (
                          <div className="pt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onSendToSmartGoal(step.revisedAction, 'Антикрихкий крок Премортем')}
                              className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold underline transition-colors"
                            >
                              Перенести як SMART-ціль →
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Kill-Switch Checklist */}
          {activeTab === 'killswitch' && (
            <div className="space-y-4">
              <div className="bg-stone-900/90 border border-red-900/50 rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-wider">
                    <AlertOctagon className="w-4 h-4" />
                    Передстартовий Kill-Switch чек-лист
                  </div>
                  <span className="text-xs text-stone-400">Перевірити ДО старту</span>
                </div>

                <p className="text-xs text-stone-300">
                  Перед тим, як вкласти хоча б одну гривню або запустити процес, проведіть ці тести. 
                  Якщо результат відповідає критерію — <span className="text-red-400 font-bold">ви зобов’язані відмовитися від плану</span>.
                </p>

                <div className="space-y-3">
                  {result.killSwitchChecklist.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl bg-stone-950 border border-stone-800 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-stone-800 text-stone-300 font-extrabold flex items-center justify-center shrink-0 text-xs">
                          {idx + 1}
                        </span>
                        <div className="space-y-1">
                          <span className="font-bold text-stone-200 text-sm block">
                            {item.checkItem}
                          </span>
                        </div>
                      </div>

                      <div className="ml-8 p-3 rounded-lg bg-red-950/40 border border-red-900/50 text-red-300 text-xs leading-normal">
                        <span className="font-bold uppercase tracking-wide text-red-200 flex items-center gap-1.5 mb-1">
                          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                          Критерій повної відмови (Kill-Threshold):
                        </span>
                        {item.killThreshold}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
