import React, { useState } from 'react';
import { FileText, Sparkles, Brain, RefreshCw, Bookmark, Check, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { CbtDiaryEntry } from '../types';
import { CBT_DISTORTIONS } from '../data/cbtDistortions';
import { requestCbtRestructure } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { VoiceInputButton } from './VoiceInputButton';

const SAMPLE_CBT_CASES = [
  {
    situationUk: 'Колега не відповів на моє привітання вранці у коридорі.',
    situationRu: 'Коллега не ответил на мое приветствие утром в коридоре.',
    situationEn: 'A colleague didn’t respond to my morning greeting in the hallway.',
    thoughtUk: 'Він мене зневажає і вважає непрофесіоналом, тепер зі мною ніхто не спілкуватиметься.',
    thoughtRu: 'Он меня презирает и считает непрофессионалом, теперь со мной никто не будет общаться.',
    thoughtEn: 'He dislikes me and thinks I am unprofessional; now nobody will talk to me.',
    emotionsUk: [{ name: 'Тривога', intensity: 80 }, { name: 'Сором', intensity: 70 }],
    emotionsRu: [{ name: 'Тревога', intensity: 80 }, { name: 'Стыд', intensity: 70 }],
    emotionsEn: [{ name: 'Anxiety', intensity: 80 }, { name: 'Shame', intensity: 70 }],
    bodyUk: 'Стиснення в горлі та прискорений пульс.',
    bodyRu: 'Сжатие в горле и учащенный пульс.',
    bodyEn: 'Tightness in throat and elevated pulse.',
    distortions: ['mind_reading', 'catastrophizing', 'personalization'],
  },
  {
    situationUk: 'Отримав зауваження від замовника щодо одного пункту у звіті.',
    situationRu: 'Получил замечание от заказчика по поводу одного пункта в отчете.',
    situationEn: 'Received critical feedback from the client regarding one bullet in the report.',
    thoughtUk: 'Я повний невдаха, нічого не вмію робити нормально. Мій бізнес приречений.',
    thoughtRu: 'Я полный неудачник, ничего не умею делать нормально. Мой бизнес обречен.',
    thoughtEn: 'I am a complete failure, I cannot do anything right. My business is doomed.',
    emotionsUk: [{ name: 'Безсилля', intensity: 90 }, { name: 'Сум', intensity: 75 }],
    emotionsRu: [{ name: 'Бессилие', intensity: 90 }, { name: 'Грусть', intensity: 75 }],
    emotionsEn: [{ name: 'Helplessness', intensity: 90 }, { name: 'Sadness', intensity: 75 }],
    bodyUk: 'Важкість у плечах, клубок у животі.',
    bodyRu: 'Тяжесть в плечах, комок в животе.',
    bodyEn: 'Heavy shoulders, knot in the stomach.',
    distortions: ['all_or_nothing', 'labeling', 'catastrophizing'],
  },
];

export const CbtThoughtDiary: React.FC<{ onSavedToJournal?: () => void }> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();

  const [situation, setSituation] = useState('');
  const [thought, setThought] = useState('');
  const [beliefBefore, setBeliefBefore] = useState(85);
  const [beliefAfter, setBeliefAfter] = useState(30);

  const [emotions, setEmotions] = useState([
    {
      name: lang === 'ru' ? 'Тревога' : lang === 'en' ? 'Anxiety' : 'Тривога',
      intensityBefore: 75,
      intensityAfter: 35,
    },
    {
      name: lang === 'ru' ? 'Вина' : lang === 'en' ? 'Guilt' : 'Провина',
      intensityBefore: 60,
      intensityAfter: 25,
    },
  ]);

  const [bodySensations, setBodySensations] = useState('');
  const [selectedDistortions, setSelectedDistortions] = useState<string[]>([]);
  const [rationalAlternative, setRationalAlternative] = useState('');
  const [behavioralExperiment, setBehavioralExperiment] = useState('');

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiSocraticQuestions, setAiSocraticQuestions] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleDistortion = (id: string) => {
    setSelectedDistortions((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleAiRestructure = async () => {
    if (!situation.trim() || !thought.trim()) {
      setError(
        lang === 'ru'
          ? 'Введите ситуацию и автоматическую мысль.'
          : lang === 'en'
          ? 'Please enter both situation and automatic thought.'
          : 'Введіть ситуацію та автоматичну думку.'
      );
      return;
    }
    setError(null);
    setIsLoadingAi(true);

    try {
      const result = await requestCbtRestructure({
        situation,
        automaticThought: thought,
        emotions: emotions.map((e) => ({ name: e.name, intensityBefore: e.intensityBefore })),
        bodySensations,
      });

      setRationalAlternative(result.rationalAlternative);
      setBehavioralExperiment(result.behavioralExperiment);
      setAiSocraticQuestions(result.socraticQuestions || []);

      // Auto-check detected distortions
      if (result.detectedDistortions?.length) {
        const detectedIds = result.detectedDistortions
          .map((d: any) => {
            const found = CBT_DISTORTIONS.find((cd) =>
              cd.name.toLowerCase().includes(d.name.toLowerCase()) ||
              (cd.nameRu && cd.nameRu.toLowerCase().includes(d.name.toLowerCase()))
            );
            return found ? found.id : null;
          })
          .filter(Boolean) as string[];

        setSelectedDistortions((prev) => Array.from(new Set([...prev, ...detectedIds])));
      }
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === 'ru'
            ? 'Не удалось реструктурировать мысль.'
            : lang === 'en'
            ? 'Failed to restructure thought.'
            : 'Не вдалося реструктурувати думку.')
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  const loadSample = (sample: typeof SAMPLE_CBT_CASES[0]) => {
    setSituation(lang === 'ru' ? sample.situationRu : lang === 'en' ? sample.situationEn : sample.situationUk);
    setThought(lang === 'ru' ? sample.thoughtRu : lang === 'en' ? sample.thoughtEn : sample.thoughtUk);
    const ems = lang === 'ru' ? sample.emotionsRu : lang === 'en' ? sample.emotionsEn : sample.emotionsUk;
    setEmotions(
      ems.map((e) => ({
        name: e.name,
        intensityBefore: e.intensity,
        intensityAfter: Math.round(e.intensity / 2),
      }))
    );
    setBodySensations(lang === 'ru' ? sample.bodyRu : lang === 'en' ? sample.bodyEn : sample.bodyUk);
    setSelectedDistortions(sample.distortions);
  };

  const handleSave = () => {
    if (!situation.trim() || !thought.trim()) return;
    const data: CbtDiaryEntry = {
      id: `cbt_${Date.now()}`,
      date: new Date().toISOString(),
      situation,
      automaticThought: thought,
      beliefIntensityBefore: beliefBefore,
      emotions,
      bodySensations,
      cognitiveDistortions: selectedDistortions,
      rationalAlternative,
      beliefIntensityAfter: beliefAfter,
      outcomeBehavior: behavioralExperiment,
    };

    saveJournalEntry({
      type: 'cbt',
      title: `${lang === 'ru' ? 'КПТ Дневник' : lang === 'en' ? 'CBT Diary' : 'КПТ Щоденник'}: ${thought.slice(0, 45)}...`,
      summary: rationalAlternative
        ? `${lang === 'ru' ? 'Альтернативная мысль' : lang === 'en' ? 'Rational alternative' : 'Альтернативна думка'}: ${rationalAlternative}`
        : `${lang === 'ru' ? 'Автоматическая мысль' : lang === 'en' ? 'Automatic thought' : 'Автоматична думка'}: ${thought}`,
      data,
    });

    setIsSaved(true);
    if (onSavedToJournal) onSavedToJournal();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-950/40 px-3 py-1 text-xs font-semibold text-sky-400">
          <FileText className="h-3.5 w-3.5" />
          {lang === 'ru'
            ? 'Протокол СМЭР (Когнитивно-поведенческая реструктуризация)'
            : lang === 'en'
            ? 'ABCDE Protocol (Cognitive-Behavioral Restructuring)'
            : 'Протокол СМЕР (Когнітивно-поведінкова реструктуризація)'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl font-serif">
          {lang === 'ru'
            ? 'КПТ Дневник Мыслей: Ситуация → Мысль → Эмоция → Реакция'
            : lang === 'en'
            ? 'CBT Thought Diary: Situation → Thought → Emotion → Response'
            : 'КПТ Щоденник Думок: Ситуація → Думка → Емоція → Реакція'}
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          {lang === 'ru'
            ? '«Людей беспокоят не сами вещи, а их взгляды на эти вещи» (Эпиктет / Аарон Бек). Выявите автоматические искажения мышления и замените их на жизнеутверждающую рациональную альтернативу.'
            : lang === 'en'
            ? '“Men are disturbed not by things, but by the view which they take of them” (Epictetus / Aaron Beck). Identify cognitive distortions and replace them with adaptive rational alternatives.'
            : '«Людей турбують не самі речі, а їхні погляди на ці речі» (Епіктет / Аарон Бек). Виявіть автоматичні викривлення мислення та замініть їх на життєствердну раціональну альтернативу.'}
        </p>
      </div>

      {/* Main Form */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-5 sm:p-7 space-y-6 shadow-xl">
        {/* Preset chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-3 text-xs">
          <span className="text-stone-400">
            {lang === 'ru'
              ? 'Примеры жизненных случаев:'
              : lang === 'en'
              ? 'Case examples:'
              : 'Приклади життєвих випадків:'}
          </span>
          <div className="flex gap-2">
            {SAMPLE_CBT_CASES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => loadSample(sample)}
                className="rounded-lg border border-stone-800 bg-stone-950 px-3 py-1 text-stone-300 hover:bg-stone-800 hover:text-sky-300 transition-colors cursor-pointer"
              >
                {lang === 'ru' ? `Пример ${idx + 1}` : lang === 'en' ? `Example ${idx + 1}` : `Приклад ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        {/* Step 1: Situation (C) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="block text-xs font-semibold text-stone-200">
              {lang === 'ru'
                ? '1. Ситуация (Фактический триггер, без оценок):'
                : lang === 'en'
                ? '1. Situation (Factual trigger without judgments):'
                : '1. Ситуація (Фактичний тригер, без оцінок):'}
            </label>
            <VoiceInputButton
              id="voice-input-cbt-situation"
              currentValue={situation}
              onTranscript={(text) => setSituation(text)}
              fieldLabel="Ситуація тригер"
            />
          </div>
          <textarea
            rows={2}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'Что именно произошло? Где, когда и с кем?'
                : lang === 'en'
                ? 'What specifically happened? Where, when and with whom?'
                : 'Що саме сталося? Де, коли і з ким?'
            }
            className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:border-sky-500 focus:outline-hidden"
          />
        </div>

        {/* Step 2: Automatic Thought (M) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center flex-wrap gap-1">
            <label className="block text-xs font-semibold text-stone-200">
              {lang === 'ru'
                ? '2. Автоматическая мысль (Что промелькнуло в голове?):'
                : lang === 'en'
                ? '2. Automatic Thought (What flashed through your mind?):'
                : '2. Автоматична думка (Що промайнуло в голові?):'}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-sky-400 font-medium">
                {lang === 'ru' ? 'Вера' : lang === 'en' ? 'Belief' : 'Віра'}: {beliefBefore}%
              </span>
              <VoiceInputButton
                id="voice-input-cbt-thought"
                currentValue={thought}
                onTranscript={(text) => setThought(text)}
                fieldLabel="Автоматична думка"
              />
            </div>
          </div>
          <textarea
            rows={2}
            value={thought}
            onChange={(e) => setThought(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'Какая негативная мысль или катастрофический вывод возник в голове?'
                : lang === 'en'
                ? 'What negative thought or catastrophic conclusion arose in your head?'
                : 'Яка негативна думка або катастрофічний висновок виник у голові?'
            }
            className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-2.5 text-xs text-stone-100 placeholder-stone-600 focus:border-sky-500 focus:outline-hidden"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={beliefBefore}
            onChange={(e) => setBeliefBefore(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
        </div>

        {/* Step 3: Emotions & Body (E & R) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-stone-200">
              {lang === 'ru'
                ? '3. Эмоции и их интенсивность (0-100%):'
                : lang === 'en'
                ? '3. Emotions & Intensity (0-100%):'
                : '3. Емоції та їхня інтенсивність (0-100%):'}
            </label>
            <div className="space-y-2">
              {emotions.map((em, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950 p-2 text-xs">
                  <span className="w-24 font-medium text-stone-300">{em.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={em.intensityBefore}
                    onChange={(e) => {
                      const next = [...emotions];
                      next[idx].intensityBefore = Number(e.target.value);
                      setEmotions(next);
                    }}
                    className="flex-1 accent-sky-500"
                  />
                  <span className="w-10 text-right text-sky-400 font-mono">{em.intensityBefore}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-semibold text-stone-200">
                {lang === 'ru'
                  ? '4. Телесные ощущения (Соматическая реакция):'
                  : lang === 'en'
                  ? '4. Somatic / Bodily Sensations:'
                  : '4. Тілесні відчуття (Соматична реакція):'}
              </label>
              <VoiceInputButton
                id="voice-input-cbt-body"
                currentValue={bodySensations}
                onTranscript={(text) => setBodySensations(text)}
                fieldLabel="Тілесні відчуття"
              />
            </div>
            <textarea
              rows={3}
              value={bodySensations}
              onChange={(e) => setBodySensations(e.target.value)}
              placeholder={
                lang === 'ru'
                  ? 'Где в теле чувствуется реакция? (Ком в горле, спазм в груди, жар, напряжение челюсти...)'
                  : lang === 'en'
                  ? 'Where in the body do you feel tension? (Lump in throat, chest tightness, heat, jaw clenching...)'
                  : 'Де в тілі відчувається реакція? (Ком у горлі, спазм у грудях, жар, напруга щелепи...)'
              }
              className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Step 4: Cognitive Distortions Selection */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-200">
              {lang === 'ru'
                ? '5. Обнаруженные когнитивные искажения (ошибки мышления):'
                : lang === 'en'
                ? '5. Detected Cognitive Distortions (Thinking Biases):'
                : '5. Виявлені когнітивні спотворення (помилки мислення):'}
            </label>
            <span className="text-[11px] text-stone-500">
              {lang === 'ru'
                ? 'Выберите присутствующие в этой мысли:'
                : lang === 'en'
                ? 'Select all that apply to this thought:'
                : 'Оберіть ті, які присутні в цій думці:'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CBT_DISTORTIONS.map((cd) => {
              const isSelected = selectedDistortions.includes(cd.id);
              const name = lang === 'ru' ? cd.nameRu || cd.name : lang === 'en' ? cd.nameEn || cd.name : cd.name;
              const desc = lang === 'ru' ? cd.shortDescriptionRu || cd.shortDescription : lang === 'en' ? cd.shortDescriptionEn || cd.shortDescription : cd.shortDescription;
              return (
                <button
                  key={cd.id}
                  type="button"
                  onClick={() => toggleDistortion(cd.id)}
                  className={`rounded-xl border p-3 text-left transition-all text-xs cursor-pointer ${
                    isSelected
                      ? 'border-sky-500/50 bg-sky-950/30 text-sky-200 shadow-xs'
                      : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <div className="font-semibold text-stone-200 mb-1">{name}</div>
                  <div className="text-[11px] text-stone-400 line-clamp-2">{desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Action Button: AI Assistant */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-800">
          <button
            type="button"
            onClick={handleAiRestructure}
            disabled={isLoadingAi || !thought.trim()}
            className="flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-xs font-semibold text-stone-950 shadow-md hover:bg-sky-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
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
                    ? 'ИИ-Ассистент Когнитивной Реструктуризации'
                    : lang === 'en'
                    ? 'AI Cognitive Restructuring Assistant'
                    : 'ШІ-Асистент Когнітивної Реструктуризації'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved || !thought.trim()}
            className="flex items-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-xs font-semibold text-stone-200 hover:bg-stone-700 transition-all cursor-pointer"
          >
            {isSaved ? <Check className="h-4 w-4 text-emerald-400" /> : <Bookmark className="h-4 w-4" />}
            <span>{isSaved ? t('saved_successfully') : t('save_to_journal')}</span>
          </button>
        </div>

        {/* Rational Alternative & Experiment Form (Manual or AI filled) */}
        {(rationalAlternative || aiSocraticQuestions.length > 0) && (
          <div className="space-y-4 pt-4 border-t border-stone-800 animate-in fade-in duration-500">
            {aiSocraticQuestions.length > 0 && (
              <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-2">
                <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Brain className="h-4 w-4" />
                  {lang === 'ru'
                    ? 'Сократовские вопросы для проверки реальностью:'
                    : lang === 'en'
                    ? 'Socratic Questions for Reality Testing:'
                    : 'Сократівські запитання для перевірки реальністю:'}
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-stone-300">
                  {aiSocraticQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="block text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  {lang === 'ru'
                    ? '6. Рациональная альтернативная мысль (Реалистичный взгляд):'
                    : lang === 'en'
                    ? '6. Rational Alternative Thought (Realistic Perspective):'
                    : '6. Раціональна альтернативна думка (Реалістичний погляд):'}
                </label>
                <VoiceInputButton
                  id="voice-input-cbt-rational"
                  currentValue={rationalAlternative}
                  onTranscript={(text) => setRationalAlternative(text)}
                  fieldLabel="Раціональна альтернатива"
                />
              </div>
              <textarea
                rows={3}
                value={rationalAlternative}
                onChange={(e) => setRationalAlternative(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Взвешенная, реалистичная и поддерживающая мысль на замену автоматической...'
                    : lang === 'en'
                    ? 'Balanced, realistic, and supportive replacement thought...'
                    : 'Зважена, реалістична та підтримуюча думка на заміну автоматичній...'
                }
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-950/10 px-4 py-2.5 text-xs text-stone-100 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="block text-xs font-semibold text-amber-300">
                  {lang === 'ru'
                    ? '7. Поведенческий эксперимент (Как проверить действием?):'
                    : lang === 'en'
                    ? '7. Behavioral Experiment (How to test with action?):'
                    : '7. Поведінковий експеримент (Як перевірити дією?):'}
                </label>
                <VoiceInputButton
                  id="voice-input-cbt-experiment"
                  currentValue={behavioralExperiment}
                  onTranscript={(text) => setBehavioralExperiment(text)}
                  fieldLabel="Поведінковий експеримент"
                />
              </div>
              <textarea
                rows={2}
                value={behavioralExperiment}
                onChange={(e) => setBehavioralExperiment(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Какое микро-действие можно предпринять, чтобы проверить страхи на практике?'
                    : lang === 'en'
                    ? 'What micro-action can test these fears in practice?'
                    : 'Яку мікро-дію я можу зробити, щоб перевірити свої страхи на практиці?'
                }
                className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-2 text-xs text-stone-100 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Re-rating belief after alternative */}
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-stone-300">
                  {lang === 'ru'
                    ? 'Переоценка: Насколько вы верите в старую мысль сейчас?'
                    : lang === 'en'
                    ? 'Re-evaluation: How much do you believe the old thought now?'
                    : 'Переоцінка: Наскільки ви вірите у стару думку зараз?'}
                </span>
                <span className="font-bold text-emerald-400">
                  {beliefAfter}% ({lang === 'ru' ? 'Снижение на' : lang === 'en' ? 'Reduction by' : 'Зниження на'} {beliefBefore - beliefAfter}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={beliefAfter}
                onChange={(e) => setBeliefAfter(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
