import React, { useState } from 'react';
import { Layers, Sparkles, RefreshCw, Bookmark, Check, Info, ArrowRight, Lightbulb } from 'lucide-react';
import { AssociationPyramidData } from '../types';
import { requestAssociationInterpretation } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { VoiceInputButton } from './VoiceInputButton';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

const SAMPLE_STARTERS_UK = [
  'Моя кар’єра та покликання',
  'Гроші та фінансова свобода',
  'Страх самотності',
  'Мої стосунки з близькими',
  'Впевненість у собі та самооцінка',
  'Моє здоров’я та тіло',
];

const SAMPLE_STARTERS_RU = [
  'Моя карьера и призвание',
  'Деньги и финансовая свобода',
  'Страх одиночества',
  'Мои отношения с близкими',
  'Уверенность в себе и самооценка',
  'Мое здоровье и тело',
];

const SAMPLE_STARTERS_EN = [
  'My career and calling',
  'Money and financial freedom',
  'Fear of loneliness',
  'Relationships with close ones',
  'Self-confidence and self-worth',
  'My health and body',
];

export const SixteenAssociationsTool: React.FC<{ onSavedToJournal?: () => void }> = ({
  onSavedToJournal,
}) => {
  const { lang, t } = useThemeLanguage();

  const [problemStatement, setProblemStatement] = useState('');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Layer 1: 16 words
  const [layer1, setLayer1] = useState<string[]>(Array(16).fill(''));
  // Layer 2: 8 words
  const [layer2, setLayer2] = useState<string[]>(Array(8).fill(''));
  // Layer 3: 4 words
  const [layer3, setLayer3] = useState<string[]>(Array(4).fill(''));
  // Layer 4: 2 words
  const [layer4, setLayer4] = useState<string[]>(Array(2).fill(''));
  // Layer 5: 1 word
  const [layer5, setLayer5] = useState<string>('');

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<AssociationPyramidData['aiInterpretation'] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleStarters = lang === 'ru' ? SAMPLE_STARTERS_RU : lang === 'en' ? SAMPLE_STARTERS_EN : SAMPLE_STARTERS_UK;

  const handleLayer1Change = (index: number, val: string) => {
    const next = [...layer1];
    next[index] = val;
    setLayer1(next);
  };

  const handleLayer2Change = (index: number, val: string) => {
    const next = [...layer2];
    next[index] = val;
    setLayer2(next);
  };

  const handleLayer3Change = (index: number, val: string) => {
    const next = [...layer3];
    next[index] = val;
    setLayer3(next);
  };

  const handleLayer4Change = (index: number, val: string) => {
    const next = [...layer4];
    next[index] = val;
    setLayer4(next);
  };

  const fillSampleWords = () => {
    if (lang === 'ru') {
      setProblemStatement('Развитие собственного дела и страх проявляться');
      setLayer1([
        'риск', 'ответственность', 'свобода', 'деньги',
        'критика', 'зависть', 'радость', 'победа',
        'усталость', 'одиночество', 'партнеры', 'доверие',
        'хаос', 'планирование', 'призвание', 'жизнь',
      ]);
    } else if (lang === 'en') {
      setProblemStatement('Starting my own business and fear of self-expression');
      setLayer1([
        'risk', 'responsibility', 'freedom', 'money',
        'criticism', 'envy', 'joy', 'victory',
        'fatigue', 'solitude', 'partners', 'trust',
        'chaos', 'planning', 'calling', 'life',
      ]);
    } else {
      setProblemStatement('Розвиток власної справи та страх проявлятися');
      setLayer1([
        'ризик', 'відповідальність', 'свобода', 'гроші',
        'критика', 'заздрість', 'радість', 'перемога',
        'втома', 'самотність', 'партнери', 'довіра',
        'хаос', 'планування', 'покликання', 'життя',
      ]);
    }
  };

  const validateStep1 = () => {
    if (!problemStatement.trim()) {
      setError(
        lang === 'ru'
          ? 'Введите ключевую тему или проблему для исследования.'
          : lang === 'en'
          ? 'Please enter the core topic or problem statement to explore.'
          : 'Введіть ключову тему або проблему для дослідження.'
      );
      return false;
    }
    const emptyCount = layer1.filter((w) => !w.trim()).length;
    if (emptyCount > 0) {
      setError(
        lang === 'ru'
          ? `Заполните все 16 ассоциаций (осталось: ${emptyCount}).`
          : lang === 'en'
          ? `Please complete all 16 associations (remaining: ${emptyCount}).`
          : `Заповніть усі 16 асоціацій (залишилося: ${emptyCount}).`
      );
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    const emptyCount = layer2.filter((w) => !w.trim()).length;
    if (emptyCount > 0) {
      setError(
        lang === 'ru'
          ? `Заполните все 8 ассоциаций разума (осталось: ${emptyCount}).`
          : lang === 'en'
          ? `Please complete all 8 intellect associations (remaining: ${emptyCount}).`
          : `Заповніть усі 8 асоціацій розуму (залишилося: ${emptyCount}).`
      );
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    const emptyCount = layer3.filter((w) => !w.trim()).length;
    if (emptyCount > 0) {
      setError(
        lang === 'ru'
          ? `Заполните все 4 ассоциации чувств (осталось: ${emptyCount}).`
          : lang === 'en'
          ? `Please complete all 4 emotional associations (remaining: ${emptyCount}).`
          : `Заповніть усі 4 асоціації почуттів (залишилося: ${emptyCount}).`
      );
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep4 = () => {
    const emptyCount = layer4.filter((w) => !w.trim()).length;
    if (emptyCount > 0) {
      setError(
        lang === 'ru'
          ? 'Заполните оба корневых слова.'
          : lang === 'en'
          ? 'Please complete both root words.'
          : 'Заповніть обидва кореневі слова.'
      );
      return false;
    }
    setError(null);
    return true;
  };

  const handleAnalyzeWithAI = async () => {
    if (!layer5.trim()) {
      setError(
        lang === 'ru'
          ? 'Введите финальное слово-ключ 5-го уровня.'
          : lang === 'en'
          ? 'Please enter the final key word for Level 5.'
          : 'Введіть фінальне слово-ключ 5-го рівня.'
      );
      return;
    }
    setError(null);
    setIsLoadingAi(true);

    try {
      const interpretation = await requestAssociationInterpretation({
        problemStatement,
        layer1,
        layer2,
        layer3,
        layer4,
        layer5,
      });
      setAiResult(interpretation);
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === 'ru'
            ? 'Не удалось расшифровать пирамиду.'
            : lang === 'en'
            ? 'Failed to interpret pyramid.'
            : 'Не вдалося розшифрувати піраміду.')
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSaveToJournal = () => {
    const data: AssociationPyramidData = {
      id: `assoc_${Date.now()}`,
      title: `${lang === 'ru' ? '16 Ассоциаций' : lang === 'en' ? '16 Associations' : '16 Асоціацій'}: ${problemStatement}`,
      problemStatement,
      date: new Date().toISOString(),
      layer1,
      layer2,
      layer3,
      layer4,
      layer5,
      aiInterpretation: aiResult || undefined,
    };

    saveJournalEntry({
      type: 'associations16',
      title: `${lang === 'ru' ? 'Пирамида Юнга' : lang === 'en' ? 'Jungian Pyramid' : 'Піраміда Юнга'}: ${problemStatement}`,
      summary: aiResult
        ? aiResult.summary
        : `${lang === 'ru' ? 'Ключ бессознательного' : lang === 'en' ? 'Subconscious Key' : 'Ключ несвідомого'}: «${layer5}» (${problemStatement})`,
      data,
    });

    setIsSaved(true);
    if (onSavedToJournal) onSavedToJournal();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-semibold text-purple-400">
          <Layers className="h-3.5 w-3.5" />
          {lang === 'ru'
            ? 'Юнгианская проективная методика (Тест 16 ассоциаций)'
            : lang === 'en'
            ? 'Jungian Projective Method (16 Associations Test)'
            : 'Юнгіанська проективна методика (Тест 16 асоціацій)'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl font-serif">
          {lang === 'ru'
            ? 'Пирамида 16 ассоциаций: Ключ к Бессознательному'
            : lang === 'en'
            ? '16 Associations Pyramid: Key to the Subconscious'
            : 'Піраміда 16 асоціацій: Ключ до Несвідомого'}
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          {lang === 'ru'
            ? 'Эта классическая техника самопознания помогает обойти рациональные ментальные защиты и спуститься сквозь 5 слоев психики: от будничных стереотипов — к глубинной первопричине и скрытому ресурсу.'
            : lang === 'en'
            ? 'This classic self-discovery technique bypasses rational defense mechanisms and descends through 5 psychic strata: from mundane stereotypes down to the core subconscious root and hidden inner resource.'
            : 'Ця класична техніка самопізнання допомагає обійти раціональні ментальні захисти та спуститися крізь 5 шарів психіки: від буденних стереотипів — до глибинної першопричини та прихованого ресурсу.'}
        </p>
      </div>

      {/* Progress & Steps Indicator */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-4">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span className="font-semibold text-stone-200">
              {lang === 'ru' ? `Уровень ${currentStep} из 5:` : lang === 'en' ? `Level ${currentStep} of 5:` : `Рівень ${currentStep} з 5:`}
            </span>
            {currentStep === 1 && (lang === 'ru' ? 'Слой 1 (16 слов обыденности)' : lang === 'en' ? 'Layer 1 (16 everyday words)' : 'Шар 1 (16 слів буденності)')}
            {currentStep === 2 && (lang === 'ru' ? 'Слой 2 (8 слов разума)' : lang === 'en' ? 'Layer 2 (8 intellect words)' : 'Шар 2 (8 слів розуму)')}
            {currentStep === 3 && (lang === 'ru' ? 'Слой 3 (4 слова чувств)' : lang === 'en' ? 'Layer 3 (4 feeling words)' : 'Шар 3 (4 слова почуттів)')}
            {currentStep === 4 && (lang === 'ru' ? 'Слой 4 (2 слова корня)' : lang === 'en' ? 'Layer 4 (2 root words)' : 'Шар 4 (2 слова кореня)')}
            {currentStep === 5 && (lang === 'ru' ? 'Слой 5 (Ключ бессознательного & ИИ-анализ)' : lang === 'en' ? 'Layer 5 (Subconscious Key & AI Analysis)' : 'Шар 5 (Ключ несвідомого & ШІ-аналіз)')}
          </div>

          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`h-2 w-8 rounded-full transition-all ${
                  currentStep === lvl
                    ? 'bg-purple-500 shadow-sm shadow-purple-500/50'
                    : currentStep > lvl
                    ? 'bg-emerald-500'
                    : 'bg-stone-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Problem Topic Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="block text-xs font-semibold text-stone-200">
              {lang === 'ru'
                ? 'Исследуемая тема, проблема или цель:'
                : lang === 'en'
                ? 'Target topic, dilemma, or goal to explore:'
                : 'Досліджувана тема, проблема або мета:'}
            </label>
            <VoiceInputButton
              id="voice-input-associations-problem"
              currentValue={problemStatement}
              onTranscript={(text) => setProblemStatement(text)}
              fieldLabel={lang === 'ru' ? 'Тема / Запрос исследования' : lang === 'en' ? 'Inquiry Topic' : 'Тема / Запит дослідження'}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder={
                lang === 'ru'
                  ? 'Например: Моя карьера, Конфликт с партнером, Страх денег...'
                  : lang === 'en'
                  ? 'e.g. My career pivot, Relationship tension, Fear of wealth...'
                  : 'Наприклад: Моя кар’єра, Конфлікт із партнером, Страх грошей...'
              }
              className="flex-1 rounded-xl border border-stone-800 bg-stone-950 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:border-purple-500 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={fillSampleWords}
              className="rounded-xl border border-stone-800 bg-stone-950 px-3.5 py-2.5 text-xs text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              {lang === 'ru' ? 'Заполнить демо-данными' : lang === 'en' ? 'Load Sample Words' : 'Заповнити демо-даними'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-stone-500">{lang === 'ru' ? 'Популярные темы:' : lang === 'en' ? 'Popular topics:' : 'Популярні теми:'}</span>
            {sampleStarters.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setProblemStatement(s)}
                className="text-[11px] text-stone-400 hover:text-purple-300 underline underline-offset-2 mr-2 cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Step 1: 16 Words */}
        {currentStep === 1 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-stone-950/60 p-4 border border-stone-800 text-xs text-stone-300 space-y-1">
              <span className="font-semibold text-purple-300 block flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                {lang === 'ru'
                  ? 'Правило 1-го уровня (Слой Обыденности):'
                  : lang === 'en'
                  ? 'Level 1 Rule (Mundane Layer):'
                  : 'Правило 1-го рівня (Шар Буденності):'}
              </span>
              <p>
                {lang === 'ru'
                  ? 'Не думайте долго и не пытайтесь казаться логичным! Запишите первые 16 существительных (или коротких фраз), которые приходят в голову при мысли о вашей теме.'
                  : lang === 'en'
                  ? 'Do not overthink or filter for logic! Rapidly write down the first 16 words/nouns (or short phrases) that intuitively emerge when focusing on your topic.'
                  : 'Не думайте довго і не намагайтеся здаватися логічним чи позитивним! Запишіть перші 16 слів-іменників (або коротких фраз), які спадають на думку, коли ви думаєте про свою тему.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {layer1.map((word, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1.5">
                  <span className="text-xs font-mono text-stone-500 w-5">{idx + 1}.</span>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => handleLayer1Change(idx, e.target.value)}
                    placeholder={lang === 'ru' ? `Слово ${idx + 1}` : lang === 'en' ? `Word ${idx + 1}` : `Слово ${idx + 1}`}
                    className="w-full bg-transparent text-xs text-stone-100 focus:outline-hidden"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition-all cursor-pointer"
              >
                <span>
                  {lang === 'ru'
                    ? 'Перейти ко 2-му уровню (Объединение пар в 8 слов)'
                    : lang === 'en'
                    ? 'Proceed to Level 2 (Pairing into 8 Words)'
                    : 'Перейти до 2-го рівня (Об’єднання пар у 8 слів)'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 8 Words */}
        {currentStep === 2 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-stone-950/60 p-4 border border-stone-800 text-xs text-stone-300 space-y-1">
              <span className="font-semibold text-purple-300 block flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                {lang === 'ru'
                  ? 'Правило 2-го уровня (Слой Разума):'
                  : lang === 'en'
                  ? 'Level 2 Rule (Intellect Layer):'
                  : 'Правило 2-го рівня (Шар Розуму):'}
              </span>
              <p>
                {lang === 'ru'
                  ? 'Посмотрите на каждую соседнюю пару слов (1 и 2, 3 и 4, ...). Какая общая ассоциация или смысловая связка объединяет их вместе? Запишите новое слово для каждой пары.'
                  : lang === 'en'
                  ? 'Observe each adjacent pair (1 & 2, 3 & 4...). What overarching conceptual association or bridge unites them? Enter a fresh unifying word for each pair.'
                  : 'Подивіться на кожну сусідню пару слів (1 і 2, 3 і 4, ...). Яка спільна асоціація чи смислова зв’язка об’єднує їх разом? Запишіть нове слово для кожної пари.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {layer2.map((word, idx) => {
                const pairWord1 = layer1[idx * 2];
                const pairWord2 = layer1[idx * 2 + 1];
                return (
                  <div key={idx} className="rounded-xl border border-stone-800 bg-stone-950/80 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-stone-400">
                      <span>{lang === 'ru' ? `Пара ${idx + 1}:` : lang === 'en' ? `Pair ${idx + 1}:` : `Пара ${idx + 1}:`}</span>
                      <span className="font-medium text-stone-300">
                        «{pairWord1 || '...'}» + «{pairWord2 || '...'}»
                      </span>
                    </div>
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => handleLayer2Change(idx, e.target.value)}
                      placeholder={
                        lang === 'ru'
                          ? `Общая ассоциация для пары ${idx + 1}`
                          : lang === 'en'
                          ? `Combined association for pair ${idx + 1}`
                          : `Спільна асоціація для пари ${idx + 1}`
                      }
                      className="w-full rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-purple-500 focus:outline-hidden"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="rounded-xl border border-stone-800 px-4 py-2 text-xs text-stone-400 hover:bg-stone-800 cursor-pointer"
              >
                ← {lang === 'ru' ? 'Назад' : lang === 'en' ? 'Back' : 'Назад'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setCurrentStep(3);
                }}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition-all cursor-pointer"
              >
                <span>
                  {lang === 'ru'
                    ? 'Перейти к 3-му уровню (4 слова чувств)'
                    : lang === 'en'
                    ? 'Proceed to Level 3 (4 Emotional Words)'
                    : 'Перейти до 3-го рівня (4 слова почуттів)'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 4 Words */}
        {currentStep === 3 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-stone-950/60 p-4 border border-stone-800 text-xs text-stone-300 space-y-1">
              <span className="font-semibold text-purple-300 block flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                {lang === 'ru'
                  ? 'Правило 3-го уровня (Слой Чувств и Эмоций):'
                  : lang === 'en'
                  ? 'Level 3 Rule (Feelings & Emotion Layer):'
                  : 'Правило 3-го рівня (Шар Почуттів та Емоцій):'}
              </span>
              <p>
                {lang === 'ru'
                  ? 'Объедините попарно 8 слов разума в 4 слова. Здесь подключаются более глубокие эмоциональные переживания, триггеры и телесные отклики.'
                  : lang === 'en'
                  ? 'Pair down the 8 intellect words into 4 words. Allow somatic feelings, underlying emotions, and intuitive impressions to guide each fusion.'
                  : 'Об’єднайте попарно 8 слів розуму у 4 слова. Тут підключаються глибші емоційні переживання, тригери та тілесні відгуки.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {layer3.map((word, idx) => {
                const pairWord1 = layer2[idx * 2];
                const pairWord2 = layer2[idx * 2 + 1];
                return (
                  <div key={idx} className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-purple-300">
                      <span>{lang === 'ru' ? `Эмоциональная связка ${idx + 1}:` : lang === 'en' ? `Emotional bridge ${idx + 1}:` : `Емоційна зв’язка ${idx + 1}:`}</span>
                      <span className="font-medium text-stone-200">
                        «{pairWord1 || '...'}» + «{pairWord2 || '...'}»
                      </span>
                    </div>
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => handleLayer3Change(idx, e.target.value)}
                      placeholder={
                        lang === 'ru'
                          ? 'Что вы чувствуете на стыке этих двух слов?'
                          : lang === 'en'
                          ? 'What feeling arises at the intersection of these words?'
                          : 'Що ви відчуваєте на перетині цих двох слів?'
                      }
                      className="w-full rounded-lg border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-stone-100 placeholder-stone-600 focus:border-purple-500 focus:outline-hidden"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-xl border border-stone-800 px-4 py-2 text-xs text-stone-400 hover:bg-stone-800 cursor-pointer"
              >
                ← {lang === 'ru' ? 'Назад' : lang === 'en' ? 'Back' : 'Назад'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep3()) setCurrentStep(4);
                }}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition-all cursor-pointer"
              >
                <span>
                  {lang === 'ru'
                    ? 'Перейти к 4-му уровню (2 корневых слова)'
                    : lang === 'en'
                    ? 'Proceed to Level 4 (2 Root Words)'
                    : 'Перейти до 4-го рівня (2 кореневі слова)'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 2 Words */}
        {currentStep === 4 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-stone-950/60 p-4 border border-stone-800 text-xs text-stone-300 space-y-1">
              <span className="font-semibold text-amber-300 block flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                {lang === 'ru'
                  ? 'Правило 4-го уровня (Корень Проблемы / Два Полюса):'
                  : lang === 'en'
                  ? 'Level 4 Rule (Core Polarity / Two Root Pillars):'
                  : 'Правило 4-го рівня (Корінь Проблеми / Два Полюси):'}
              </span>
              <p>
                {lang === 'ru'
                  ? 'Объедините 4 слова в 2 ключевых понятия. Это два полюса вашего внутреннего конфликта или две субличности, ведущие диалог внутри вас.'
                  : lang === 'en'
                  ? 'Condense the 4 words into 2 essential root concepts. These represent the fundamental dialectical poles or subpersonalities in dialogue within you.'
                  : 'Об’єднайте 4 слова у 2 ключові поняття. Це два стовпи вашого внутрішнього конфлікту або дві субособистості, що ведуть діалог усередині вас.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {layer4.map((word, idx) => {
                const pairWord1 = layer3[idx * 2];
                const pairWord2 = layer3[idx * 2 + 1];
                return (
                  <div key={idx} className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-300">
                      <span>
                        {lang === 'ru'
                          ? `Корень ${idx === 0 ? 'А (Полюс 1)' : 'Б (Полюс 2)'}:`
                          : lang === 'en'
                          ? `Root ${idx === 0 ? 'A (Pole 1)' : 'B (Pole 2)'}:`
                          : `Корінь ${idx === 0 ? 'А (Полюс 1)' : 'Б (Полюс 2)'}:`}
                      </span>
                      <span className="font-medium text-stone-200">
                        «{pairWord1 || '...'}» + «{pairWord2 || '...'}»
                      </span>
                    </div>
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => handleLayer4Change(idx, e.target.value)}
                      placeholder={lang === 'ru' ? `Главная сущность ${idx + 1}` : lang === 'en' ? `Core essence ${idx + 1}` : `Головна сутність ${idx + 1}`}
                      className="w-full rounded-lg border border-stone-800 bg-stone-950 px-4 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="rounded-xl border border-stone-800 px-4 py-2 text-xs text-stone-400 hover:bg-stone-800 cursor-pointer"
              >
                ← {lang === 'ru' ? 'Назад' : lang === 'en' ? 'Back' : 'Назад'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep4()) setCurrentStep(5);
                }}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-all cursor-pointer"
              >
                <span>
                  {lang === 'ru'
                    ? 'Перейти к Финальному Ключу Бессознательного'
                    : lang === 'en'
                    ? 'Proceed to Final Subconscious Key'
                    : 'Перейти до Фінального Ключа Несвідомого'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Final Subconscious Key & Visual Pyramid */}
        {currentStep === 5 && (
          <div className="space-y-6 pt-2">
            <div className="rounded-2xl border-2 border-purple-500/50 bg-stone-950 p-6 text-center space-y-4">
              <span className="inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
                {lang === 'ru'
                  ? 'Уровень 5: Квинтэссенция Бессознательного (Архетипический Ключ)'
                  : lang === 'en'
                  ? 'Level 5: Subconscious Quintessence (Archetypal Key)'
                  : 'Рівень 5: Квінтесенція Несвідомого (Архетиповий Ключ)'}
              </span>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                {lang === 'ru'
                  ? `Объедините последние 2 корневых слова («${layer4[0]}» + «${layer4[1]}») в ОДНО финальное слово. Это ответ вашего подсознания.`
                  : lang === 'en'
                  ? `Synthesize the final 2 root words («${layer4[0]}» + «${layer4[1]}») into ONE master word. This is your subconscious resolution.`
                  : `Об’єднайте останні 2 кореневі слова («${layer4[0]}» + «${layer4[1]}») в ОДНЕ фінальне слово. Це відповідь вашої підсвідомості.`}
              </p>
              <div className="max-w-md mx-auto flex items-center gap-2">
                <input
                  type="text"
                  value={layer5}
                  onChange={(e) => setLayer5(e.target.value)}
                  placeholder={
                    lang === 'ru'
                      ? 'Введите 1 финальное слово-ключ...'
                      : lang === 'en'
                      ? 'Enter your single master key word...'
                      : 'Введіть ваше 1 фінальне слово-ключ...'
                  }
                  className="flex-1 text-center text-lg font-bold rounded-xl border border-purple-500/50 bg-stone-900 px-4 py-3 text-purple-200 placeholder-stone-600 focus:border-purple-400 focus:outline-hidden"
                />
                <VoiceInputButton
                  id="voice-input-associations-layer5"
                  currentValue={layer5}
                  onTranscript={(text) => setLayer5(text)}
                  fieldLabel={lang === 'ru' ? 'Финальный ключ бессознательного' : lang === 'en' ? 'Master Subconscious Key' : 'Фінальний ключ несвідомого'}
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleAnalyzeWithAI}
                  disabled={isLoadingAi || !layer5.trim()}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-semibold text-white shadow-lg hover:bg-purple-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
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
                          ? 'Получить Глубинный Психоанализ Пирамиды'
                          : lang === 'en'
                          ? 'Generate Deep Psychoanalytic Interpretation'
                          : 'Отримати Глибинний Психоаналіз Піраміди'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSaveToJournal}
                  disabled={isSaved || !layer5.trim()}
                  className="flex items-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-xs font-semibold text-stone-200 hover:bg-stone-700 transition-all cursor-pointer"
                >
                  {isSaved ? <Check className="h-4 w-4 text-emerald-400" /> : <Bookmark className="h-4 w-4" />}
                  <span>{isSaved ? t('saved_successfully') : t('save_to_journal')}</span>
                </button>
              </div>
            </div>

            {/* Visual Pyramid Tree Summary */}
            <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-5 space-y-3">
              <h3 className="text-xs font-bold text-stone-300 uppercase tracking-wider text-center">
                {lang === 'ru'
                  ? 'Сводная схема вашей пирамиды:'
                  : lang === 'en'
                  ? 'Summary Schema of Your Pyramid:'
                  : 'Зведена схема вашої піраміди:'}
              </h3>
              <div className="flex flex-col items-center gap-2 text-xs text-center font-mono">
                <div className="rounded-lg border border-purple-500/50 bg-purple-950/40 px-4 py-1.5 font-bold text-purple-300">
                  {lang === 'ru' ? 'У5 (Ключ):' : lang === 'en' ? 'L5 (Key):' : 'Р5 (Ключ):'} {layer5 || '???'}
                </div>
                <div className="text-stone-600">▲</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {layer4.map((w, i) => (
                    <span key={i} className="rounded border border-amber-500/40 bg-amber-950/20 px-3 py-1 text-amber-200">
                      {lang === 'ru' ? 'У4:' : lang === 'en' ? 'L4:' : 'Р4:'} {w || '...'}
                    </span>
                  ))}
                </div>
                <div className="text-stone-600">▲</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {layer3.map((w, i) => (
                    <span key={i} className="rounded border border-stone-700 bg-stone-900 px-2.5 py-0.5 text-stone-300">
                      {w || '...'}
                    </span>
                  ))}
                </div>
                <div className="text-stone-600">▲</div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {layer2.map((w, i) => (
                    <span key={i} className="rounded bg-stone-900 px-2 py-0.5 text-[11px] text-stone-400">
                      {w || '...'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Interpretation Results */}
            {aiResult && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="rounded-2xl border border-purple-500/40 bg-stone-900 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-400" />
                    <h3 className="text-base font-bold text-stone-100">
                      {lang === 'ru'
                        ? 'Психоаналитическая Расшифровка Бессознательного Послания'
                        : lang === 'en'
                        ? 'Psychoanalytic Decryption of Subconscious Message'
                        : 'Психоаналітична Розшифровка Несвідомого Послання'}
                    </h3>
                  </div>

                  <p className="text-sm text-stone-200 leading-relaxed font-serif">
                    {aiResult.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3.5 space-y-1">
                      <strong className="text-stone-200 block">
                        {lang === 'ru' ? '1. Слой обыденности (Поверхностные штампы):' : lang === 'en' ? '1. Mundane layer (Surface stereotypes):' : '1. Шар буденності (Поверхневі штампи):'}
                      </strong>
                      <p className="text-stone-400">{aiResult.layerMeanings.level1Everyday}</p>
                    </div>
                    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3.5 space-y-1">
                      <strong className="text-stone-200 block">
                        {lang === 'ru' ? '2. Слой разума (Рациональные установки):' : lang === 'en' ? '2. Intellect layer (Rational constructs):' : '2. Шар розуму (Раціональні установки):'}
                      </strong>
                      <p className="text-stone-400">{aiResult.layerMeanings.level2Intellect}</p>
                    </div>
                    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3.5 space-y-1">
                      <strong className="text-stone-200 block">
                        {lang === 'ru' ? '3. Слой чувств (Глубинные триггеры):' : lang === 'en' ? '3. Feeling layer (Emotional triggers):' : '3. Шар почуттів (Глибинні тригери):'}
                      </strong>
                      <p className="text-stone-400">{aiResult.layerMeanings.level3Feelings}</p>
                    </div>
                    <div className="rounded-xl border border-stone-800 bg-stone-950/60 p-3.5 space-y-1">
                      <strong className="text-stone-200 block">
                        {lang === 'ru' ? '4. Корень (Диалог двух субличностей):' : lang === 'en' ? '4. Root (Dialogue of dual subpersonalities):' : '4. Корінь (Діалог двох субособистостей):'}
                      </strong>
                      <p className="text-stone-400">{aiResult.layerMeanings.level4Root}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-4 space-y-1 text-xs">
                    <strong className="text-purple-300 block text-sm">
                      ✨ {lang === 'ru' ? `Главный Инсайт: Ключ «${layer5}»` : lang === 'en' ? `Core Insight: Key «${layer5}»` : `Головний Інсайт: Ключ «${layer5}»`}
                    </strong>
                    <p className="text-stone-200 leading-relaxed">
                      {aiResult.subconsciousInsight}
                    </p>
                  </div>

                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1 text-xs">
                    <strong className="text-emerald-300 block font-semibold">
                      🎯 {lang === 'ru' ? 'Рекомендованное действие для интеграции инсайта:' : lang === 'en' ? 'Recommended action to integrate insight:' : '🎯 Рекомендована дія для інтеграції інсайту:'}
                    </strong>
                    <p className="text-stone-200 leading-relaxed">
                      {aiResult.recommendedAction}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
