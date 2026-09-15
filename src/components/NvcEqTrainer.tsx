import React, { useState } from 'react';
import {
  MessageSquareHeart,
  Sparkles,
  HeartHandshake,
  Brain,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Bookmark,
  RefreshCw,
  Eye,
  Smile,
  Heart,
  HandMetal,
  UserCheck,
  HelpCircle,
} from 'lucide-react';
import { requestNvcEqTransform } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { NvcEqData } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

interface NvcEqTrainerProps {
  initialSituation?: string;
  initialRawExpression?: string;
  onSavedToJournal?: () => void;
}

const PRESETS = [
  {
    titleUk: 'Конфлікт із керівником щодо дедлайнів',
    titleEn: 'Conflict with manager over deadlines',
    situation: 'Керівник призначив термінову задачу у п’ятницю ввечері і дорікає за повільність.',
    raw: 'Ви вічно скидаєте на мене все в останній момент і ніколи не поважаєте мій особистий час!',
    role: 'Керівник / Менеджер',
    emotions: ['Гнів', 'Безсилля', 'Втома'],
    need: 'Повага до меж і передбачуваність',
  },
  {
    titleUk: 'Партнер не допомагає у побуті',
    titleEn: 'Partner doesn’t help with chores',
    situation: 'Після важкого робочого дня партнер сидить у телефоні, поки я прибираю та готую.',
    raw: 'Тобі плювати на наш дім, ти просто паразитуєш на мені і нічого не робиш!',
    role: 'Партнер / Чоловік / Дружина',
    emotions: ['Образа', 'Самотність', 'Виснаження'],
    need: 'Співучасть, турбота і справедливий розподіл зусиль',
  },
  {
    titleUk: 'Порушення особистих кордонів родичами',
    titleEn: 'Family members crossing boundaries',
    situation: 'Батьки або родичі дають непрохані поради щодо виховання дітей, карʼєри чи грошей.',
    raw: 'Перестаньте лізти у моє життя, ви самі нічого не тямите і тільки псуєте мені настрій!',
    role: 'Батьки / Родичі',
    emotions: ['Роздратування', 'Тиск', 'Сум'],
    need: 'Автономія, довіра та визнання дорослості',
  },
  {
    titleUk: 'Колега ігнорує робочі домовленості',
    titleEn: 'Colleague ignoring project agreements',
    situation: 'Колега затримує свою частину звіту, через що команда ризикує зірвати спільний реліз.',
    raw: 'Через твою безвідповідальність ми всі провалимо проект! Скільки можна тягнути?!',
    role: 'Колега по команді',
    emotions: ['Тривога', 'Злість', 'Розгубленість'],
    need: 'Надійність, командна взаємодія та ясність',
  },
];

const EMOTIONS_LIST = [
  'Гнів / Лють',
  'Образа',
  'Тривога',
  'Безсилля',
  'Втома / Виснаження',
  'Самотність',
  'Сум / Біль',
  'Розгубленість',
  'Сором',
  'Знецінення',
];

const NEEDS_LIST = [
  'Повага та визнання',
  'Безпека та передбачуваність',
  'Співпраця та підтримка',
  'Особисті межі й автономія',
  'Відпочинок і відновлення',
  'Ясність та чесність',
  'Близькість і прийняття',
  'Справедливість',
];

export const NvcEqTrainer: React.FC<NvcEqTrainerProps> = ({
  initialSituation = '',
  initialRawExpression = '',
  onSavedToJournal,
}) => {
  const { lang } = useThemeLanguage();

  const [triggerSituation, setTriggerSituation] = useState(initialSituation);
  const [rawExpression, setRawExpression] = useState(initialRawExpression);
  const [partnerRole, setPartnerRole] = useState('Близька людина / Колега');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [currentNeed, setCurrentNeed] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<NvcEqData | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const toggleEmotion = (emo: string) => {
    if (selectedEmotions.includes(emo)) {
      setSelectedEmotions(selectedEmotions.filter((e) => e !== emo));
    } else {
      setSelectedEmotions([...selectedEmotions, emo]);
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTriggerSituation(preset.situation);
    setRawExpression(preset.raw);
    setPartnerRole(preset.role);
    setSelectedEmotions(preset.emotions);
    setCurrentNeed(preset.need);
    setResult(null);
    setIsSaved(false);
  };

  const handleTransform = async () => {
    if (!triggerSituation.trim() && !rawExpression.trim()) {
      setErrorMessage(
        lang === 'en'
          ? 'Please enter the trigger situation or initial complaint.'
          : 'Будь ласка, введіть тригерну ситуацію або початкову претензію.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsSaved(false);

    try {
      const response = await requestNvcEqTransform({
        triggerSituation,
        rawExpression,
        partnerRole,
        selectedEmotions,
        currentNeed,
      });

      const nvcData: NvcEqData = {
        id: `nvc_${Date.now()}`,
        date: new Date().toISOString(),
        triggerSituation,
        rawExpression,
        partnerRole,
        eqAssessment: response.eqAssessment,
        nvc4Steps: response.nvc4Steps,
        nvcCompletePhrasing: response.nvcCompletePhrasing,
        internalSelfEmpathy: response.internalSelfEmpathy,
        empathicGuessForOther: response.empathicGuessForOther,
      };

      setResult(nvcData);
    } catch (err: any) {
      console.error('NVC transformation error:', err);
      setErrorMessage(
        err.message ||
          (lang === 'en'
            ? 'Failed to generate transformation. Please try again.'
            : 'Помилка генерації. Будь ласка, спробуйте ще раз.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveToJournal = () => {
    if (!result) return;

    saveJournalEntry({
      id: result.id,
      type: 'nvcEq',
      title: `${lang === 'en' ? 'NVC & EQ' : 'ННК & EQ'}: ${partnerRole || (lang === 'en' ? 'Dialogue' : 'Діалог')}`,
      date: result.date,
      summary: `${result.nvcCompletePhrasing.slice(0, 160)}...`,
      data: result,
    });

    setIsSaved(true);
    if (onSavedToJournal) {
      onSavedToJournal();
    }
  };

  return (
    <div id="nvc-eq-trainer-module" className="mx-auto max-w-5xl space-y-6 p-2 sm:p-4">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-linear-to-br from-violet-500/10 via-stone-50 to-teal-500/10 dark:from-violet-950/40 dark:via-stone-900 dark:to-teal-950/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
              <MessageSquareHeart className="h-3.5 w-3.5" />
              <span>
                {lang === 'en'
                  ? 'Marshall Rosenberg NVC + Daniel Goleman EQ'
                  : 'Ненасильницька Комунікація Маршалла Розенберга та Емоційний Інтелект Ґоулмана'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
              {lang === 'en' ? 'NVC & EQ Compassionate Dialogue Studio' : 'Студія Ненасильницького Спілкування & EQ'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {lang === 'en'
                ? 'Transform raw anger, blame, and resentment ("Jackal Language") into crystal-clear, heart-centered requests ("Giraffe Language") through 4-step emotional intelligence mastery.'
                : 'Трансформуйте образу, претензії та агресивні думки («Мову Шакала») у чисту, сердечну та дієву мову потреб («Мову Жирафа») за 4-кроковою формулою Розенберга та емоційною саморегуляцією Ґоулмана.'}
            </p>
          </div>

          <div className="hidden lg:flex flex-col gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-3 text-[11px] text-stone-600 dark:text-stone-300 shrink-0">
            <div className="flex items-center gap-1.5 font-bold text-violet-700 dark:text-violet-400">
              <Brain className="h-3.5 w-3.5" />
              <span>4 Кроки ННК Розенберга:</span>
            </div>
            <span>1. <strong>Факти</strong> без оцінок</span>
            <span>2. <strong>Почуття</strong> (EQ)</span>
            <span>3. <strong>Потреба</strong> серця</span>
            <span>4. Конкретне <strong>Прохання</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-violet-500" />
          {lang === 'en' ? 'Quick Conflict Scenarios:' : 'Типові ситуації для швидкого аналізу:'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="flex flex-col text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 hover:border-violet-500/50 hover:bg-violet-50/30 dark:hover:bg-violet-950/20 transition-all cursor-pointer group shadow-2xs"
            >
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 line-clamp-1">
                {lang === 'en' ? preset.titleEn : preset.titleUk}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                «{preset.raw}»
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 space-y-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Situation trigger */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                1. {lang === 'en' ? 'Trigger situation / context' : 'Опис тригерної ситуації (Що трапилося?)'}
              </label>
              <VoiceInputButton
                id="voice-input-nvc-situation"
                currentValue={triggerSituation}
                onTranscript={(text) => setTriggerSituation(text)}
                fieldLabel={lang === 'en' ? 'Trigger situation' : 'Тригерна ситуація'}
              />
            </div>
            <textarea
              rows={3}
              value={triggerSituation}
              onChange={(e) => setTriggerSituation(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Describe what happened objectively...'
                  : 'Наприклад: Керівник написав у п’ятницю ввечері, що звіт треба переробити на завтра...'
              }
              className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-violet-500 focus:outline-hidden"
            />
          </div>

          {/* Raw complaint / Jackal voice */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <span>
                  2. {lang === 'en' ? 'Initial raw thought / complaint (Jackal)' : 'Перша емоційна реакція / претензія (Мова Шакала)'}
                </span>
                <span className="text-[10px] font-normal text-rose-500">Без цензури</span>
              </label>
              <VoiceInputButton
                id="voice-input-nvc-raw"
                currentValue={rawExpression}
                onTranscript={(text) => setRawExpression(text)}
                fieldLabel={lang === 'en' ? 'Raw complaint' : 'Емоційна претензія'}
              />
            </div>
            <textarea
              rows={3}
              value={rawExpression}
              onChange={(e) => setRawExpression(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'What do you want to scream or blame? "You always...", "I hate when you..."'
                  : 'Що хочеться викрикнути або висловити? «Ти вічно все псуєш!», «Вам на мене начхати...»'
              }
              className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-rose-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Partner role */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                {lang === 'en' ? 'Dialogue partner role:' : 'Кому адресовано (роль):'}
              </label>
              <VoiceInputButton
                id="voice-input-nvc-role"
                currentValue={partnerRole}
                onTranscript={(text) => setPartnerRole(text)}
                fieldLabel={lang === 'en' ? 'Partner role' : 'Роль співрозмовника'}
              />
            </div>
            <input
              type="text"
              value={partnerRole}
              onChange={(e) => setPartnerRole(e.target.value)}
              placeholder="Партнер, Керівник, Колега, Батьки..."
              className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-violet-500 focus:outline-hidden"
            />
          </div>

          {/* Preset need */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              {lang === 'en' ? 'Primary unmet need (optional hint):' : 'Головна незадоволена потреба (орієнтир):'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NEEDS_LIST.map((need) => (
                <button
                  key={need}
                  type="button"
                  onClick={() => setCurrentNeed(currentNeed === need ? '' : need)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] transition-all cursor-pointer ${
                    currentNeed === need
                      ? 'bg-violet-600 text-white font-medium shadow-xs'
                      : 'border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:border-violet-400'
                  }`}
                >
                  {need}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emotional tags picker */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
            {lang === 'en' ? 'Emotional Intelligence (EQ) - Select current feelings:' : 'Емоційний інтелект (EQ) — Оберіть те, що відчуваєте:'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS_LIST.map((emo) => {
              const active = selectedEmotions.includes(emo);
              return (
                <button
                  key={emo}
                  type="button"
                  onClick={() => toggleEmotion(emo)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                    active
                      ? 'bg-rose-500/20 border border-rose-500/50 text-rose-700 dark:text-rose-300 font-semibold'
                      : 'border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-600 dark:text-stone-400 hover:border-rose-300'
                  }`}
                >
                  <span>{emo}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit Action */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleTransform}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-violet-500 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{lang === 'en' ? 'Transforming with AI...' : 'Трансформація через ННК & EQ...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{lang === 'en' ? 'Run NVC & EQ Transformation' : 'Запустити ННК & EQ Трансформацію'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main ready-to-speak script banner */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-violet-500/60 bg-linear-to-br from-violet-50 via-white to-teal-50 dark:from-violet-950/60 dark:via-stone-900 dark:to-teal-950/40 p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-200 dark:border-violet-800/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white font-bold text-xs">
                  🦒
                </span>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif">
                    {lang === 'en' ? 'Ready-to-Speak Script (Giraffe Language)' : 'Готова формула для виголошення (Мова Жирафа)'}
                  </h3>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    {lang === 'en' ? 'Direct compassionate communication' : 'Серцецентрична, ненасильницька фраза для живої розмови'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyText(result.nvcCompletePhrasing, 'main-phrase')}
                  className="flex items-center gap-1.5 rounded-xl border border-violet-300 dark:border-violet-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-colors cursor-pointer"
                >
                  {copiedKey === 'main-phrase' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{lang === 'en' ? 'Copied' : 'Скопійовано!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{lang === 'en' ? 'Copy Script' : 'Скопіювати фразу'}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveToJournal}
                  disabled={isSaved}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    isSaved
                      ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>{isSaved ? (lang === 'en' ? 'Saved to Journal' : 'Збережено в Журнал') : (lang === 'en' ? 'Save to Journal' : 'В Журнал')}</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-white/90 dark:bg-stone-900/90 p-4 border border-violet-200/80 dark:border-violet-800/50 shadow-inner">
              <p className="text-base sm:text-lg font-medium text-stone-900 dark:text-stone-100 font-serif leading-relaxed italic">
                «{result.nvcCompletePhrasing}»
              </p>
            </div>
          </div>

          {/* 4 Steps Breakdown Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-500" />
              <span>{lang === 'en' ? '4-Step Rosenberg NVC Breakdown:' : 'Анатомія 4 кроків Розенберга:'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-50/40 dark:bg-sky-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    <span>1. Спостереження</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Факти без оцінок</span>
                </div>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                  {result.nvc4Steps.observation}
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <Smile className="h-3.5 w-3.5" />
                    <span>2. Почуття (EQ)</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Автентична емоція</span>
                </div>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                  {result.nvc4Steps.feeling}
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5" />
                    <span>3. Потреба</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Глибинна цінність</span>
                </div>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                  {result.nvc4Steps.need}
                </p>
              </div>

              {/* Step 4 */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <HandMetal className="h-3.5 w-3.5" />
                    <span>4. Прохання</span>
                  </span>
                  <span className="text-[10px] text-stone-400">Здійсненна дія</span>
                </div>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                  {result.nvc4Steps.request}
                </p>
              </div>
            </div>
          </div>

          {/* Goleman EQ & Empathy row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Goleman EQ Regulation */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <Brain className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  {lang === 'en' ? 'Goleman EQ Regulation & Somatic Anchor' : 'Емоційний Інтелект Ґоулмана & Саморегуляція'}
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-stone-500 dark:text-stone-400 block text-[11px]">
                    Розпізнані емоції:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.eqAssessment.recognizedEmotions.map((e, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 text-[11px] font-medium"
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-stone-500 dark:text-stone-400 block text-[11px]">
                    Тілесна зона тригеру:
                  </span>
                  <p className="text-stone-700 dark:text-stone-300 mt-0.5">{result.eqAssessment.somaticTrigger}</p>
                </div>

                <div className="rounded-xl bg-teal-50/50 dark:bg-teal-950/30 p-3 border border-teal-500/20">
                  <span className="font-bold text-teal-700 dark:text-teal-300 block text-[11px]">
                    Техніка саморегуляції (Пауза 6 секунд):
                  </span>
                  <p className="text-stone-700 dark:text-stone-300 mt-0.5">{result.eqAssessment.selfRegulationTip}</p>
                </div>
              </div>
            </div>

            {/* Internal Self-Empathy & Empathic Guess for Partner */}
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
                <HeartHandshake className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">
                  {lang === 'en' ? 'Self-Empathy & Partner Perspective' : 'Самоспівчуття та Емпатія до Співрозмовника'}
                </h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-violet-50/50 dark:bg-violet-950/30 p-3 border border-violet-500/20">
                  <span className="font-bold text-violet-700 dark:text-violet-300 block text-[11px]">
                    Внутрішній діалог самопідтримки:
                  </span>
                  <p className="text-stone-700 dark:text-stone-300 mt-0.5 italic">
                    «{result.internalSelfEmpathy}»
                  </p>
                </div>

                <div className="rounded-xl bg-stone-50 dark:bg-stone-950 p-3 border border-stone-200 dark:border-stone-800">
                  <span className="font-bold text-stone-700 dark:text-stone-300 block text-[11px]">
                    Емпатичне припущення про співрозмовника:
                  </span>
                  <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                    {result.empathicGuessForOther}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
