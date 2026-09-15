import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Compass,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Share2,
  Brain,
  Layers,
  Zap,
  Target,
  RefreshCw,
  LucideIcon,
  Shield,
  Heart,
} from 'lucide-react';
import { requestActionGuide, ActionGuideProtocol } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export interface ActionToolLink {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  onClick: () => void;
}

interface ActionStepByStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionText: string;
  timeframe: '24h' | '7d' | '30d' | 'experiment' | string;
  situationContext?: string;
  onSelectTab?: (tab: string) => void;
  onOpenGrounding?: () => void;
  onSavedToJournal?: () => void;
}

export const ActionStepByStepModal: React.FC<ActionStepByStepModalProps> = ({
  isOpen,
  onClose,
  actionText,
  timeframe,
  situationContext,
  onSelectTab,
  onOpenGrounding,
  onSavedToJournal,
}) => {
  const { lang } = useThemeLanguage();
  const [guide, setGuide] = useState<ActionGuideProtocol | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Detect relevant app tools from the action text
  const getToolLinks = (): ActionToolLink[] => {
    const text = (actionText || '').toLowerCase();
    const links: ActionToolLink[] = [];

    if (
      (text.includes('заземлен') ||
        text.includes('дихан') ||
        text.includes('соматик') ||
        text.includes('тілесн') ||
        text.includes('вегетатив') ||
        text.includes('релакс')) &&
      onOpenGrounding
    ) {
      links.push({
        id: 'somatic',
        label:
          lang === 'ru'
            ? 'Соматическое заземление (4-7-8)'
            : lang === 'en'
            ? 'Somatic Grounding (4-7-8)'
            : 'Соматичне заземлення (4-7-8)',
        icon: Zap,
        color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25',
        onClick: () => {
          onClose();
          onOpenGrounding();
        },
      });
    }

    if (
      (text.includes('колес') || text.includes('баланс') || text.includes('сфер')) &&
      onSelectTab
    ) {
      links.push({
        id: 'wheelOfBalance',
        label:
          lang === 'ru' ? 'Колесо Баланса' : lang === 'en' ? 'Wheel of Balance' : 'Колесо Балансу',
        icon: Target,
        color: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 hover:bg-teal-500/25',
        onClick: () => {
          onClose();
          onSelectTab('wheelOfBalance');
        },
      });
    }

    if (
      (text.includes('експеримент') ||
        text.includes('кпт') ||
        text.includes('думк') ||
        text.includes('спотворен') ||
        text.includes('щоденник')) &&
      onSelectTab
    ) {
      links.push({
        id: 'cbt',
        label:
          lang === 'ru' ? 'КПТ Дневник' : lang === 'en' ? 'CBT Diary' : 'КПТ Щоденник',
        icon: Brain,
        color: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/25',
        onClick: () => {
          onClose();
          onSelectTab('cbt');
        },
      });
    }

    if (
      (text.includes('цінност') ||
        text.includes('мотиваці') ||
        text.includes('сенс') ||
        text.includes('цінності')) &&
      onSelectTab
    ) {
      links.push({
        id: 'values',
        label:
          lang === 'ru'
            ? 'Ценности & Мотивация'
            : lang === 'en'
            ? 'Values & Motivation'
            : 'Цінності & Мотивація',
        icon: Compass,
        color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25',
        onClick: () => {
          onClose();
          onSelectTab('values');
        },
      });
    }

    if (
      (text.includes('переконан') ||
        text.includes('установк') ||
        text.includes('віруван') ||
        text.includes('патерн')) &&
      onSelectTab
    ) {
      links.push({
        id: 'beliefs',
        label:
          lang === 'ru'
            ? 'Трансформация убеждений'
            : lang === 'en'
            ? 'Belief Transformation'
            : 'Трансформація переконань',
        icon: Shield,
        color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
        onClick: () => {
          onClose();
          onSelectTab('beliefs');
        },
      });
    }

    if (
      (text.includes('smart') ||
        text.includes('дедлайн') ||
        text.includes('ціл') ||
        text.includes('план') ||
        text.includes('крок')) &&
      onSelectTab
    ) {
      links.push({
        id: 'smartGoals',
        label:
          lang === 'ru' ? 'Цели по SMART & WOOP' : lang === 'en' ? 'SMART & WOOP Goals' : 'Цілі по SMART & WOOP',
        icon: Target,
        color: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/25',
        onClick: () => {
          onClose();
          onSelectTab('smartGoals');
        },
      });
    }

    if (
      (text.includes('рефлексі') ||
        text.includes('вечірн') ||
        text.includes('стоїц') ||
        text.includes('аудит')) &&
      onSelectTab
    ) {
      links.push({
        id: 'selfReflection',
        label:
          lang === 'ru' ? 'Саморефлексия' : lang === 'en' ? 'Self-Reflection' : 'Саморефлексія',
        icon: Sparkles,
        color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
        onClick: () => {
          onClose();
          onSelectTab('selfReflection');
        },
      });
    }

    if (
      (text.includes('бажан') || text.includes('мрій') || text.includes('100')) &&
      onSelectTab
    ) {
      links.push({
        id: 'hundredWishes',
        label:
          lang === 'ru' ? '100 Желаний' : lang === 'en' ? '100 Wishes' : '100 Бажань',
        icon: Sparkles,
        color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
        onClick: () => {
          onClose();
          onSelectTab('hundredWishes');
        },
      });
    }

    if (
      (text.includes('етикет') ||
        text.includes('нно') ||
        text.includes('ннк') ||
        text.includes('партнер') ||
        text.includes('розмов') ||
        text.includes('конфлікт')) &&
      onSelectTab
    ) {
      links.push({
        id: 'nvcEq',
        label:
          lang === 'ru' ? 'ННО & EQ Тренажер' : lang === 'en' ? 'NVC & EQ Trainer' : 'ННК & EQ Тренажер',
        icon: Heart,
        color: 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30 hover:bg-pink-500/25',
        onClick: () => {
          onClose();
          onSelectTab('nvcEq');
        },
      });
    }

    return links;
  };

  useEffect(() => {
    if (isOpen && actionText) {
      setSavedSuccess(false);
      setCompletedSteps([]);
      loadGuide();
    }
  }, [isOpen, actionText]);

  const loadGuide = async () => {
    setLoading(true);
    try {
      const res = await requestActionGuide({
        actionText,
        timeframe,
        situation: situationContext,
        lang,
      });
      setGuide(res);
    } catch (e) {
      console.warn('Error loading action guide:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const handleSaveToJournal = () => {
    if (!guide) return;
    saveJournalEntry({
      id: `action-guide-${Date.now()}`,
      type: 'consilium',
      title: `Покроковий алгоритм: ${guide.title || actionText.slice(0, 40)}`,
      date: new Date().toISOString(),
      summary: `Горизонт: ${timeframe} | Дія: ${actionText} | Критерій: ${guide.completionCheck}`,
      data: {
        actionText,
        timeframe,
        guide,
        completedSteps,
      },
    });
    setSavedSuccess(true);
    if (onSavedToJournal) onSavedToJournal();
  };

  if (!isOpen) return null;

  const toolLinks = getToolLinks();

  const getTimeframeBadge = () => {
    switch (timeframe) {
      case '24h':
        return {
          label: lang === 'ru' ? '24 Часа: Перший мікро-крок' : '24 Години: Перший мікро-крок',
          badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
        };
      case '7d':
        return {
          label: lang === 'ru' ? '7 Дней: Закрепление практики' : '7 Днів: Закріплення практики',
          badgeColor: 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
        };
      case '30d':
        return {
          label: lang === 'ru' ? '30 Дней: Системная стратегия' : '30 Днів: Системна стратегія',
          badgeColor: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30',
        };
      case 'experiment':
        return {
          label: lang === 'ru' ? 'Поведенческий эксперимент (КПТ)' : 'Поведінковий експеримент (КПТ)',
          badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        };
      default:
        return {
          label: lang === 'ru' ? 'Рекомендованная практика' : 'Рекомендована практика',
          badgeColor: 'bg-stone-500/20 text-stone-600 dark:text-stone-400 border-stone-500/30',
        };
    }
  };

  const badge = getTimeframeBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.badgeColor}`}>
                  {badge.label}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 mt-0.5">
                {lang === 'ru'
                  ? 'Пошаговый алгоритм выполнения'
                  : lang === 'en'
                  ? 'Step-by-Step Execution Guide'
                  : 'Покроковий алгоритм виконання'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Target Action Card */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              {lang === 'ru' ? 'Рекомендованное действие:' : 'Рекомендована дія / практика:'}
            </span>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-relaxed">
              «{actionText}»
            </p>
          </div>

          {/* Quick Direct Links to In-App Tools */}
          {toolLinks.length > 0 && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/50 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                  {lang === 'ru'
                    ? 'Прямой переход к практике в приложении:'
                    : lang === 'en'
                    ? 'Direct link to practice in app:'
                    : 'Прямий перехід до практики у додатку:'}
                </span>
                <span className="text-[10px] text-stone-400">
                  {lang === 'ru' ? 'В один клик' : 'В 1 клік'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {toolLinks.map((tl) => {
                  const Icon = tl.icon;
                  return (
                    <button
                      key={tl.id}
                      type="button"
                      onClick={tl.onClick}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${tl.color}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tl.label}</span>
                      <ArrowRight className="h-3 w-3 opacity-70" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw className="h-7 w-7 text-amber-500 animate-spin" />
              <p className="text-xs text-stone-500 font-medium">
                {lang === 'ru'
                  ? 'Формируем пошаговый психологический протокол...'
                  : 'Формуємо покроковий психологічний протокол...'}
              </p>
            </div>
          ) : guide ? (
            <>
              {/* Psychological Mechanism */}
              <div className="rounded-2xl border border-teal-500/20 bg-teal-50/40 dark:bg-teal-950/20 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold">
                  <Brain className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span>
                    {lang === 'ru'
                      ? 'Психологический смысл (Почему это работает):'
                      : 'Психологічний сенс (Чому це працює):'}
                  </span>
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  {guide.psychologicalMechanism}
                </p>
              </div>

              {/* Step-by-Step Protocol */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-amber-500" />
                    {lang === 'ru' ? 'Пошаговый протокол выполнения:' : 'Покроковий протокол виконання:'}
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {completedSteps.length} / {guide.stepByStepProtocol.length}{' '}
                    {lang === 'ru' ? 'выполнено' : 'виконано'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {guide.stepByStepProtocol.map((step) => {
                    const isDone = completedSteps.includes(step.stepNumber);
                    return (
                      <div
                        key={step.stepNumber}
                        onClick={() => handleToggleStep(step.stepNumber)}
                        className={`rounded-2xl border p-3.5 transition-all cursor-pointer flex items-start gap-3 ${
                          isDone
                            ? 'border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20'
                            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-amber-500/30'
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border font-bold text-xs transition-colors ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.stepNumber}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <h4
                              className={`font-bold text-xs ${
                                isDone
                                  ? 'line-through text-stone-400'
                                  : 'text-stone-900 dark:text-stone-100'
                              }`}
                            >
                              {step.title}
                            </h4>
                            <span className="text-[10px] text-stone-400 flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3" />
                              {step.timeEstimate}
                            </span>
                          </div>
                          <p className="text-stone-600 dark:text-stone-400 text-xs leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sabotage Trap & Antidote */}
              {guide.sabotageTrapAndAntidote && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                    <span>
                      {lang === 'ru'
                        ? 'Ловушка сопротивления и Антидот:'
                        : 'Пастка опору та Антидот:'}
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {guide.sabotageTrapAndAntidote}
                  </p>
                </div>
              )}

              {/* Completion Check */}
              {guide.completionCheck && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>
                      {lang === 'ru' ? 'Критерий готовности:' : 'Критерій завершеності:'}
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
                    {guide.completionCheck}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/40 text-xs">
          <button
            type="button"
            onClick={loadGuide}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{lang === 'ru' ? 'Обновить ШИ-гайд' : 'Оновити ШІ-гайд'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveToJournal}
              disabled={!guide || savedSuccess}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-xs ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>
                {savedSuccess
                  ? lang === 'ru'
                    ? 'Сохранено в Журнал!'
                    : 'Збережено в Журнал!'
                  : lang === 'ru'
                  ? 'Сохранить алгоритм'
                  : 'Зберегти алгоритм'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
            >
              {lang === 'ru' ? 'Закрыть' : 'Закрити'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
