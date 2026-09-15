import React, { useState } from 'react';
import { HelpCircle, Sparkles, RefreshCw, Bookmark, Check, ArrowDown, Lightbulb, Zap } from 'lucide-react';
import { FiveWhysData } from '../types';
import { requestFiveWhysDeepen } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { VoiceInputButton } from './VoiceInputButton';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

const SAMPLE_5_WHYS_UK = [
  'Я постійно відкладаю важливі робочі дзвінки та переговори на вечір або наступний тиждень',
  'Я відчуваю сильне роздратування, коли мене просять про допомогу в неробочий час',
  'Я боюся підійти до керівника і попросити про підвищення зарплати',
];

const SAMPLE_5_WHYS_RU = [
  'Я постоянно откладываю важные рабочие звонки и переговоры на вечер или следующую неделю',
  'Я чувствую сильное раздражение, когда меня просят о помощи в нерабочее время',
  'Я боюсь подойти к руководителю и попросить о повышении зарплаты',
];

const SAMPLE_5_WHYS_EN = [
  'I constantly procrastinate on important work calls and negotiations until late or next week',
  'I feel strong irritation when asked for assistance outside of working hours',
  'I am afraid to approach my supervisor to request a salary increase',
];

const DEFAULT_QUESTIONS = {
  uk: [
    'Чому це відбувається?',
    'Чому так стається?',
    'Чому це викликає таку реакцію?',
    'Чому для мене це настільки важливо чи страшно?',
    'Яке моє глибинне переконання про себе чи світ за цим стоїть?',
  ],
  ru: [
    'Почему это происходит?',
    'Почему так случается?',
    'Почему это вызывает такую реакцию?',
    'Почему для меня это настолько важно или страшно?',
    'Какое мое глубинное убеждение о себе или мире за этим стоит?',
  ],
  en: [
    'Why is this happening?',
    'Why does that occur?',
    'Why does it provoke such a reaction?',
    'Why is this so critical or intimidating for me?',
    'What core underlying belief about myself or the world drives this?',
  ],
};

export const FiveWhysTool: React.FC<{ onSavedToJournal?: () => void }> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();

  const questionsList = DEFAULT_QUESTIONS[lang as 'uk' | 'ru' | 'en'] || DEFAULT_QUESTIONS.uk;

  const [initialProblem, setInitialProblem] = useState('');
  const [steps, setSteps] = useState([
    { level: 1, question: questionsList[0], answer: '' },
    { level: 2, question: questionsList[1], answer: '' },
    { level: 3, question: questionsList[2], answer: '' },
    { level: 4, question: questionsList[3], answer: '' },
    { level: 5, question: questionsList[4], answer: '' },
  ]);

  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    suggestedNextWhyPrompt?: string;
    isRootReached?: boolean;
    rootCauseInsight?: string;
    transformativeAction?: string;
  } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleList = lang === 'ru' ? SAMPLE_5_WHYS_RU : lang === 'en' ? SAMPLE_5_WHYS_EN : SAMPLE_5_WHYS_UK;

  const handleAnswerChange = (index: number, value: string) => {
    const next = [...steps];
    next[index].answer = value;
    setSteps(next);
  };

  const handleDeepenWithAI = async () => {
    if (!initialProblem.trim()) {
      setError(
        lang === 'ru'
          ? 'Введите начальную проблему.'
          : lang === 'en'
          ? 'Please enter the initial problem.'
          : 'Введіть початкову проблему.'
      );
      return;
    }
    const currentAnswer = steps[currentLevel - 1].answer;
    if (!currentAnswer.trim()) {
      setError(
        lang === 'ru'
          ? `Ответьте на вопрос уровня ${currentLevel}.`
          : lang === 'en'
          ? `Please answer the level ${currentLevel} question.`
          : `Дайте відповідь на запитання рівня ${currentLevel}.`
      );
      return;
    }

    setError(null);
    setIsLoadingAi(true);

    try {
      const activeSteps = steps.slice(0, currentLevel);
      const result = await requestFiveWhysDeepen({
        initialProblem,
        steps: activeSteps,
      });
      setAiFeedback(result);

      if (result.suggestedNextWhyPrompt && currentLevel < 5) {
        const next = [...steps];
        next[currentLevel].question = result.suggestedNextWhyPrompt;
        setSteps(next);
      }
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === 'ru'
            ? 'Не удалось получить ИИ-анализ причины.'
            : lang === 'en'
            ? 'Failed to obtain AI root-cause analysis.'
            : 'Не вдалося отримати ШІ-аналіз причини.')
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  const fillSample = (sample: string) => {
    setInitialProblem(sample);
  };

  const handleSave = () => {
    if (!initialProblem.trim()) return;
    const data: FiveWhysData = {
      id: `five_whys_${Date.now()}`,
      initialProblem,
      date: new Date().toISOString(),
      steps,
      rootCause: aiFeedback?.rootCauseInsight || steps[4].answer,
      transformativeAction: aiFeedback?.transformativeAction,
    };

    saveJournalEntry({
      type: 'fiveWhys',
      title: `${lang === 'ru' ? '5 Почему' : lang === 'en' ? '5 Whys' : '5 Чому'}: ${initialProblem.slice(0, 45)}...`,
      summary:
        aiFeedback?.rootCauseInsight ||
        `${lang === 'ru' ? 'Первопричина' : lang === 'en' ? 'Root Cause' : 'Першопричина'}: ${steps[4].answer || steps[currentLevel - 1].answer}`,
      data,
    });

    setIsSaved(true);
    if (onSavedToJournal) onSavedToJournal();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3 py-1 text-xs font-semibold text-teal-400">
          <HelpCircle className="h-3.5 w-3.5" />
          {lang === 'ru'
            ? 'Метод поиска первопричины (5 Whys)'
            : lang === 'en'
            ? 'Root-Cause Discovery (5 Whys Method)'
            : 'Метод пошуку першопричини (5 Whys)'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl font-serif">
          {lang === 'ru'
            ? 'Метод «5 Почему»: Раскопка глубинного корня проблемы'
            : lang === 'en'
            ? 'The 5 Whys Method: Uncovering the Root Cause'
            : 'Метод «5 Чому»: Розкопка глибинного кореня проблеми'}
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          {lang === 'ru'
            ? 'Поверхностные симптомы (лень, прокрастинация, раздражение) почти никогда не являются настоящей причиной. Последовательно задавая вопрос «Почему?», мы проходим через 5 уровней к базовой психологической установке.'
            : lang === 'en'
            ? 'Superficial symptoms (laziness, procrastination, irritation) are rarely the true cause. By systematically asking "Why?", we traverse 5 inquiry layers down to the core subconscious belief.'
            : 'Поверхові симптоми (лінь, прокрастинація, роздратування) майже ніколи не є справжньою причиною. Послідовно ставлячи запитання «Чому?», ми проходимо крізь 5 рівнів до базового психологічного переконання.'}
        </p>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-5 sm:p-7 space-y-6 shadow-xl">
        {/* Initial problem input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="block text-xs font-semibold text-stone-200">
              {lang === 'ru'
                ? '1. Начальная ситуация или беспокоящий симптом:'
                : lang === 'en'
                ? '1. Initial situation or troubling symptom:'
                : '1. Початкова ситуація або симптом, який вас турбує:'}
            </label>
            <VoiceInputButton
              id="voice-input-fivewhys-problem"
              currentValue={initialProblem}
              onTranscript={(text) => setInitialProblem(text)}
              fieldLabel={lang === 'ru' ? 'Начальная проблема / Симптом' : lang === 'en' ? 'Initial Problem / Symptom' : 'Початкова проблема / Симптом'}
            />
          </div>
          <textarea
            rows={2}
            value={initialProblem}
            onChange={(e) => setInitialProblem(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'Например: Я постоянно откладываю запуск проекта / Срываюсь на близких после работы...'
                : lang === 'en'
                ? 'e.g. I constantly delay launching projects / I snap at my loved ones after work...'
                : 'Наприклад: Я постійно відкладаю запуск проекту / Я зриваюся на рідних після роботи...'
            }
            className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:border-teal-500 focus:outline-hidden"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-stone-500">{lang === 'ru' ? 'Примеры:' : lang === 'en' ? 'Examples:' : 'Приклади:'}</span>
            {sampleList.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => fillSample(s)}
                className="text-[11px] text-stone-400 hover:text-teal-300 underline underline-offset-2 mr-2 cursor-pointer"
              >
                {s.slice(0, 40)}...
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* 5 Levels Steps */}
        <div className="space-y-4 pt-2">
          {steps.map((step, idx) => {
            const isUnlocked = idx < currentLevel;
            const isCurrent = idx + 1 === currentLevel;
            return (
              <div
                key={step.level}
                className={`rounded-xl border p-4.5 transition-all ${
                  isCurrent
                    ? 'border-teal-500/50 bg-stone-950 shadow-md ring-1 ring-teal-500/20'
                    : isUnlocked
                    ? 'border-stone-800 bg-stone-950/70'
                    : 'border-stone-800/40 bg-stone-950/30 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isCurrent
                          ? 'bg-teal-500 text-stone-950'
                          : isUnlocked
                          ? 'bg-stone-800 text-stone-300'
                          : 'bg-stone-900 text-stone-600'
                      }`}
                    >
                      {step.level}
                    </span>
                    <span className="text-xs font-bold text-stone-200">
                      {step.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {idx === 4 && (
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        {lang === 'ru' ? 'Корень (Первопричина)' : lang === 'en' ? 'Core Root Cause' : 'Корінь (Першопричина)'}
                      </span>
                    )}
                    {isUnlocked && (
                      <VoiceInputButton
                        id={`voice-input-why-${step.level}`}
                        currentValue={step.answer}
                        onTranscript={(text) => handleAnswerChange(idx, text)}
                        fieldLabel={`${lang === 'ru' ? 'Уровень' : lang === 'en' ? 'Level' : 'Рівень'} ${step.level}`}
                      />
                    )}
                  </div>
                </div>

                {isUnlocked ? (
                  <textarea
                    rows={2}
                    value={step.answer}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder={
                      lang === 'ru'
                        ? `Ваш искренний ответ на вопрос уровня ${step.level}...`
                        : lang === 'en'
                        ? `Your authentic answer to the level ${step.level} inquiry...`
                        : `Ваша чесна відповідь на запитання рівня ${step.level}...`
                    }
                    className="w-full rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-teal-500 focus:outline-hidden"
                  />
                ) : (
                  <div className="text-xs text-stone-600 italic">
                    {lang === 'ru'
                      ? 'Заполните предыдущие уровни для разблокировки...'
                      : lang === 'en'
                      ? 'Complete preceding levels to unlock...'
                      : 'Заповніть попередні рівні для розблокування...'}
                  </div>
                )}

                {isCurrent && idx < 4 && step.answer.trim() && (
                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentLevel((prev) => Math.min(5, prev + 1))}
                      className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-stone-950 hover:bg-teal-500 transition-all cursor-pointer"
                    >
                      <span>
                        {lang === 'ru'
                          ? `Углубиться на уровень ${idx + 2}`
                          : lang === 'en'
                          ? `Deepen to Level ${idx + 2}`
                          : `Заглибитися на рівень ${idx + 2}`}
                      </span>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-800">
          <button
            type="button"
            onClick={handleDeepenWithAI}
            disabled={isLoadingAi || !initialProblem.trim()}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-xs font-semibold text-stone-950 shadow-md hover:bg-teal-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoadingAi ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t('loading_ai')}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>
                  {lang === 'ru'
                    ? 'ИИ-Анализ Первопричины и Трансформация'
                    : lang === 'en'
                    ? 'AI Root Cause Analysis & Transformation'
                    : 'ШІ-Аналіз Першопричини & Трансформація'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved || !initialProblem.trim()}
            className="flex items-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-xs font-semibold text-stone-200 hover:bg-stone-700 transition-all cursor-pointer"
          >
            {isSaved ? <Check className="h-4 w-4 text-emerald-400" /> : <Bookmark className="h-4 w-4" />}
            <span>{isSaved ? t('saved_successfully') : t('save_to_journal')}</span>
          </button>
        </div>
      </div>

      {/* AI Root Cause Feedback */}
      {aiFeedback && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="rounded-2xl border border-teal-500/40 bg-stone-900 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-teal-400" />
              <h3 className="text-base font-bold text-stone-100 font-serif">
                {lang === 'ru'
                  ? 'Глубинный Инсайт Первопричины'
                  : lang === 'en'
                  ? 'Core Root Cause Insight'
                  : 'Глибинний Інсайт Першопричини'}
              </h3>
            </div>

            <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-4 text-xs space-y-2">
              <strong className="text-amber-300 block text-sm">
                🔍 {lang === 'ru' ? 'Истинный психологический корень проблемы:' : lang === 'en' ? 'True psychological root cause:' : 'Справжній психологічний корінь проблеми:'}
              </strong>
              <p className="text-stone-200 leading-relaxed text-sm">
                {aiFeedback.rootCauseInsight}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs space-y-2">
              <strong className="text-emerald-300 block text-sm flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                {lang === 'ru'
                  ? 'Трансформационное действие для разрыва паттерна:'
                  : lang === 'en'
                  ? 'Transformative action to break the pattern:'
                  : 'Трансформаційна дія для розриву патерну:'}
              </strong>
              <p className="text-stone-200 leading-relaxed">
                {aiFeedback.transformativeAction}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
