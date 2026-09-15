import React, { useState } from 'react';
import { Grid2X2, Sparkles, Plus, Trash2, Star, RefreshCw, Bookmark, Check, HelpCircle, ShieldAlert } from 'lucide-react';
import { DescartesMatrixData, DescartesItem } from '../types';
import { requestCartesianInsights } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { VoiceInputButton } from './VoiceInputButton';

export const DescartesSquareTool: React.FC<{ onSavedToJournal?: () => void }> = ({
  onSavedToJournal,
}) => {
  const { lang, t } = useThemeLanguage();

  const [dilemma, setDilemma] = useState('');
  const [q1, setQ1] = useState<DescartesItem[]>([
    {
      id: '1',
      text:
        lang === 'ru'
          ? 'Новые возможности для профессионального и личностного роста'
          : lang === 'en'
          ? 'New opportunities for career and personal growth'
          : 'Нові можливості для професійного та особистісного росту',
      weight: 4,
    },
  ]);
  const [q2, setQ2] = useState<DescartesItem[]>([
    {
      id: '2',
      text:
        lang === 'ru'
          ? 'Сохранение привычного комфорта, предсказуемость'
          : lang === 'en'
          ? 'Preserving familiar comfort and predictability'
          : 'Збереження звичного комфорту, передбачуваність',
      weight: 3,
    },
  ]);
  const [q3, setQ3] = useState<DescartesItem[]>([
    {
      id: '3',
      text:
        lang === 'ru'
          ? 'Потеря свободного времени на начальном этапе'
          : lang === 'en'
          ? 'Loss of free time during the initial phase'
          : 'Втрата вільного часу на початковому етапі',
      weight: 3,
    },
  ]);
  const [q4, setQ4] = useState<DescartesItem[]>([
    {
      id: '4',
      text:
        lang === 'ru'
          ? 'Невозможность реализовать свой истинный потенциал'
          : lang === 'en'
          ? 'Inability to fulfill your true potential'
          : 'Неможливість реалізувати свій справжній потенціал',
      weight: 5,
    },
  ]);

  // Input states for adding new items
  const [newText1, setNewText1] = useState('');
  const [newWeight1, setNewWeight1] = useState(3);
  const [newText2, setNewText2] = useState('');
  const [newWeight2, setNewWeight2] = useState(3);
  const [newText3, setNewText3] = useState('');
  const [newWeight3, setNewWeight3] = useState(3);
  const [newText4, setNewText4] = useState('');
  const [newWeight4, setNewWeight4] = useState(3);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<DescartesMatrixData['aiAnalysis'] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = (
    quadrant: 1 | 2 | 3 | 4,
    text: string,
    weight: number,
    setText: (s: string) => void
  ) => {
    if (!text.trim()) return;
    const newItem: DescartesItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      text: text.trim(),
      weight,
    };
    if (quadrant === 1) setQ1([...q1, newItem]);
    if (quadrant === 2) setQ2([...q2, newItem]);
    if (quadrant === 3) setQ3([...q3, newItem]);
    if (quadrant === 4) setQ4([...q4, newItem]);
    setText('');
  };

  const removeItem = (quadrant: 1 | 2 | 3 | 4, id: string) => {
    if (quadrant === 1) setQ1(q1.filter((i) => i.id !== id));
    if (quadrant === 2) setQ2(q2.filter((i) => i.id !== id));
    if (quadrant === 3) setQ3(q3.filter((i) => i.id !== id));
    if (quadrant === 4) setQ4(q4.filter((i) => i.id !== id));
  };

  // Calculate scores
  const scoreChange = q1.reduce((sum, i) => sum + i.weight, 0) + q4.reduce((sum, i) => sum + i.weight, 0);
  const scoreStatusQuo = q2.reduce((sum, i) => sum + i.weight, 0) + q3.reduce((sum, i) => sum + i.weight, 0);
  const totalScore = scoreChange + scoreStatusQuo || 1;
  const changePercent = Math.round((scoreChange / totalScore) * 100);

  const handleAnalyze = async () => {
    if (!dilemma.trim()) {
      setError(
        lang === 'ru'
          ? 'Пожалуйста, введите дилемму или взвешиваемое решение.'
          : lang === 'en'
          ? 'Please enter the dilemma or decision you are weighing.'
          : 'Будь ласка, введіть дилему або рішення, яке ви зважуєте.'
      );
      return;
    }
    setError(null);
    setIsLoadingAi(true);

    try {
      const result = await requestCartesianInsights({
        dilemma,
        quadrant1: q1,
        quadrant2: q2,
        quadrant3: q3,
        quadrant4: q4,
      });
      setAiAnalysis(result);
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === 'ru'
            ? 'Не удалось проанализировать матрицу Декарта.'
            : lang === 'en'
            ? 'Failed to analyze Descartes matrix.'
            : 'Не вдалося проаналізувати матрицю Декарта.')
      );
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSave = () => {
    if (!dilemma.trim()) return;
    const data: DescartesMatrixData = {
      id: `descartes_${Date.now()}`,
      dilemma,
      date: new Date().toISOString(),
      quadrant1_Will_Will: q1,
      quadrant2_Will_Not: q2,
      quadrant3_Not_Will: q3,
      quadrant4_Not_Not: q4,
      aiAnalysis: aiAnalysis || undefined,
    };

    saveJournalEntry({
      type: 'descartes',
      title: `${lang === 'ru' ? 'Квадрат Декарта' : lang === 'en' ? 'Descartes Square' : 'Квадрат Декарта'}: ${dilemma}`,
      summary: aiAnalysis
        ? aiAnalysis.overallRecommendation
        : `${lang === 'ru' ? 'Баланс готовности к переменам' : lang === 'en' ? 'Change readiness balance' : 'Баланс готовності до змін'}: ${changePercent}% (${dilemma})`,
      data,
    });

    setIsSaved(true);
    if (onSavedToJournal) onSavedToJournal();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3 py-1 text-xs font-semibold text-teal-400">
          <Grid2X2 className="h-3.5 w-3.5" />
          {lang === 'ru'
            ? 'Матрица принятия взвешенных решений'
            : lang === 'en'
            ? 'Balanced Decision-Making Matrix'
            : 'Матриця прийняття зважених рішень'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl font-serif">
          {lang === 'ru'
            ? 'Квадрат Декарта: 4 взгляда на один выбор'
            : lang === 'en'
            ? 'Descartes Square: 4 Angles on One Choice'
            : 'Квадрат Декарта: 4 погляди на один вибір'}
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          {lang === 'ru'
            ? 'Обычный разум рассматривает только один вопрос: «Что будет, если я это сделаю?». Квадрат Декарта освещает 4 взаимодополняющие плоскости, устраняя когнитивную слепоту и внутренние сомнения.'
            : lang === 'en'
            ? 'The ordinary mind considers only: "What happens if I do this?". The Descartes Square illuminates 4 complementary facets, clearing cognitive blind spots and inner hesitation.'
            : 'Звичайний розум розглядає лише одне запитання: «Що буде, якщо я це зроблю?». Квадрат Декарта висвітлює 4 взаємодоповнюючі площини, усуваючи когнітивну сліпоту та внутрішні сумніви.'}
        </p>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-5 sm:p-7 space-y-6 shadow-xl">
        {/* Dilemma title input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="block text-xs font-semibold text-stone-200">
              {lang === 'ru'
                ? 'Сформулируйте решение или дилемму выбора:'
                : lang === 'en'
                ? 'Formulate your decision dilemma:'
                : 'Сформулюйте рішення або дилему вибору:'}
            </label>
            <VoiceInputButton
              id="voice-input-descartes-dilemma"
              currentValue={dilemma}
              onTranscript={(text) => setDilemma(text)}
              fieldLabel="Дилема вибору"
            />
          </div>
          <input
            type="text"
            value={dilemma}
            onChange={(e) => setDilemma(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'Например: Стоит ли мне менять профессию сейчас? / Переезжать ли в новый город?'
                : lang === 'en'
                ? 'e.g. Should I transition careers now? / Move to a new city?'
                : 'Наприклад: Чи варто мені змінювати професію зараз? / Чи переїжджати в нове місто?'
            }
            className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:border-teal-500 focus:outline-hidden"
          />
        </div>

        {/* 4 Quadrants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: + / + (Що БУДЕ, якщо ВІДБУДЕТЬСЯ?) */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {lang === 'ru'
                  ? '1. Что БУДЕТ, если это ПРОИЗОЙДЕТ?'
                  : lang === 'en'
                  ? '1. What WILL happen if it DOES occur?'
                  : '1. Що БУДЕ, якщо це ВІДБУДЕТЬСЯ?'}
              </span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                {lang === 'ru' ? 'Плюсы перемен (+/+)' : lang === 'en' ? 'Gains of Action (+/+)' : 'Плюси змін (+/+)'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {lang === 'ru'
                ? 'Какие преимущества, возможности и радость вы получите при выборе изменений?'
                : lang === 'en'
                ? 'What advantages, opportunities, and joy will you unlock by changing?'
                : 'Які переваги, можливості та радість ви отримаєте при виборі змін?'}
            </p>

            <div className="space-y-2">
              {q1.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/20 bg-stone-950/80 px-3 py-2 text-xs"
                >
                  <span className="text-stone-200">{item.text}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center text-amber-400 text-[11px]">
                      {item.weight} <Star className="h-3 w-3 fill-amber-400 inline ml-0.5" />
                    </span>
                    <button
                      onClick={() => removeItem(1, item.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newText1}
                onChange={(e) => setNewText1(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem(1, newText1, newWeight1, setNewText1)}
                placeholder={lang === 'ru' ? 'Добавить плюс перемен...' : lang === 'en' ? 'Add gain of change...' : 'Додати плюс змін...'}
                className="flex-1 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-stone-100 focus:outline-hidden"
              />
              <VoiceInputButton
                id="voice-input-descartes-q1"
                currentValue={newText1}
                onTranscript={(text) => setNewText1(text)}
                fieldLabel="Плюс змін"
              />
              <select
                value={newWeight1}
                onChange={(e) => setNewWeight1(Number(e.target.value))}
                className="rounded-lg border border-stone-800 bg-stone-950 px-2 py-1.5 text-xs text-stone-300"
                title="Важливість від 1 до 5"
              >
                <option value={1}>★ 1</option>
                <option value={2}>★ 2</option>
                <option value={3}>★ 3</option>
                <option value={4}>★ 4</option>
                <option value={5}>★ 5</option>
              </select>
              <button
                onClick={() => addItem(1, newText1, newWeight1, setNewText1)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-emerald-500 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quadrant 2: + / - (Що БУДЕ, якщо НЕ відбудеться?) */}
          <div className="rounded-2xl border border-sky-500/30 bg-sky-950/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                {lang === 'ru'
                  ? '2. Что БУДЕТ, если это НЕ произойдет?'
                  : lang === 'en'
                  ? '2. What WILL happen if it DOES NOT occur?'
                  : '2. Що БУДЕ, якщо це НЕ відбудеться?'}
              </span>
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
                {lang === 'ru' ? 'Плюсы статус-кво (+/-)' : lang === 'en' ? 'Gains of Status Quo (+/-)' : 'Плюси незмінності (+/-)'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {lang === 'ru'
                ? 'Какие плюсы в сохранении прежнего состояния? (Стабильность, привычность, безопасность).'
                : lang === 'en'
                ? 'What are the perks of remaining unchanged? (Stability, predictability, safety).'
                : 'Які плюси у збереженні старого стану? (Стабільність, звичність, безпека).'}
            </p>

            <div className="space-y-2">
              {q2.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-sky-500/20 bg-stone-950/80 px-3 py-2 text-xs"
                >
                  <span className="text-stone-200">{item.text}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center text-amber-400 text-[11px]">
                      {item.weight} <Star className="h-3 w-3 fill-amber-400 inline ml-0.5" />
                    </span>
                    <button
                      onClick={() => removeItem(2, item.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newText2}
                onChange={(e) => setNewText2(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem(2, newText2, newWeight2, setNewText2)}
                placeholder={lang === 'ru' ? 'Добавить плюс статус-кво...' : lang === 'en' ? 'Add gain of status quo...' : 'Додати плюс статус-кво...'}
                className="flex-1 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-stone-100 focus:outline-hidden"
              />
              <VoiceInputButton
                id="voice-input-descartes-q2"
                currentValue={newText2}
                onTranscript={(text) => setNewText2(text)}
                fieldLabel="Плюс статус-кво"
              />
              <select
                value={newWeight2}
                onChange={(e) => setNewWeight2(Number(e.target.value))}
                className="rounded-lg border border-stone-800 bg-stone-950 px-2 py-1.5 text-xs text-stone-300"
              >
                <option value={1}>★ 1</option>
                <option value={2}>★ 2</option>
                <option value={3}>★ 3</option>
                <option value={4}>★ 4</option>
                <option value={5}>★ 5</option>
              </select>
              <button
                onClick={() => addItem(2, newText2, newWeight2, setNewText2)}
                className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-sky-500 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quadrant 3: - / + (Чого НЕ буде, якщо ВІДБУДЕТЬСЯ?) */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {lang === 'ru'
                  ? '3. Чего НЕ будет, если это ПРОИЗОЙДЕТ?'
                  : lang === 'en'
                  ? '3. What will NOT happen if it DOES occur?'
                  : '3. Чого НЕ буде, якщо це ВІДБУДЕТЬСЯ?'}
              </span>
              <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                {lang === 'ru' ? 'Потери при переменах (-/+)' : lang === 'en' ? 'Losses of Action (-/+)' : 'Втрати при змінах (-/+)'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {lang === 'ru'
                ? 'Цена перемен: от чего придется отказаться? Что уйдет из вашей жизни?'
                : lang === 'en'
                ? 'Cost of change: what will you have to give up or let go?'
                : 'Ціна змін: від чого доведеться відмовитися? Що піде з вашого життя?'}
            </p>

            <div className="space-y-2">
              {q3.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-stone-950/80 px-3 py-2 text-xs"
                >
                  <span className="text-stone-200">{item.text}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center text-amber-400 text-[11px]">
                      {item.weight} <Star className="h-3 w-3 fill-amber-400 inline ml-0.5" />
                    </span>
                    <button
                      onClick={() => removeItem(3, item.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newText3}
                onChange={(e) => setNewText3(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem(3, newText3, newWeight3, setNewText3)}
                placeholder={lang === 'ru' ? 'Добавить цену перемен...' : lang === 'en' ? 'Add cost of change...' : 'Додати ціну змін...'}
                className="flex-1 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-stone-100 focus:outline-hidden"
              />
              <VoiceInputButton
                id="voice-input-descartes-q3"
                currentValue={newText3}
                onTranscript={(text) => setNewText3(text)}
                fieldLabel="Ціна змін"
              />
              <select
                value={newWeight3}
                onChange={(e) => setNewWeight3(Number(e.target.value))}
                className="rounded-lg border border-stone-800 bg-stone-950 px-2 py-1.5 text-xs text-stone-300"
              >
                <option value={1}>★ 1</option>
                <option value={2}>★ 2</option>
                <option value={3}>★ 3</option>
                <option value={4}>★ 4</option>
                <option value={5}>★ 5</option>
              </select>
              <button
                onClick={() => addItem(3, newText3, newWeight3, setNewText3)}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-500 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Quadrant 4: - / - (Чого НЕ буде, якщо НЕ відбудеться?) */}
          <div className="rounded-2xl border border-rose-500/30 bg-rose-950/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                {lang === 'ru'
                  ? '4. Чего НЕ будет, если это НЕ произойдет?'
                  : lang === 'en'
                  ? '4. What will NOT happen if it DOES NOT occur?'
                  : '4. Чого НЕ буде, якщо це НЕ відбудеться?'}
              </span>
              <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                {lang === 'ru' ? 'Цена бездействия (-/-)' : lang === 'en' ? 'Cost of Inaction (-/-)' : 'Ціна незмінності (-/-)'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              {lang === 'ru'
                ? 'Цена бездействия: чего вы НИКОГДА не достигнете, если все оставить как есть?'
                : lang === 'en'
                ? 'Cost of inaction: what will you NEVER achieve if things remain stagnant?'
                : 'Ціна бездіяльності: чого ви НІКОЛИ не досягнете, якщо все залишити як є?'}
            </p>

            <div className="space-y-2">
              {q4.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-rose-500/20 bg-stone-950/80 px-3 py-2 text-xs"
                >
                  <span className="text-stone-200">{item.text}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="flex items-center text-amber-400 text-[11px]">
                      {item.weight} <Star className="h-3 w-3 fill-amber-400 inline ml-0.5" />
                    </span>
                    <button
                      onClick={() => removeItem(4, item.id)}
                      className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add item input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newText4}
                onChange={(e) => setNewText4(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem(4, newText4, newWeight4, setNewText4)}
                placeholder={lang === 'ru' ? 'Добавить упущенные шансы...' : lang === 'en' ? 'Add missed chances...' : 'Додати втрачені шанси...'}
                className="flex-1 rounded-lg border border-stone-800 bg-stone-950 px-3 py-1.5 text-xs text-stone-100 focus:outline-hidden"
              />
              <VoiceInputButton
                id="voice-input-descartes-q4"
                currentValue={newText4}
                onTranscript={(text) => setNewText4(text)}
                fieldLabel="Втрачені шанси"
              />
              <select
                value={newWeight4}
                onChange={(e) => setNewWeight4(Number(e.target.value))}
                className="rounded-lg border border-stone-800 bg-stone-950 px-2 py-1.5 text-xs text-stone-300"
              >
                <option value={1}>★ 1</option>
                <option value={2}>★ 2</option>
                <option value={3}>★ 3</option>
                <option value={4}>★ 4</option>
                <option value={5}>★ 5</option>
              </select>
              <button
                onClick={() => addItem(4, newText4, newWeight4, setNewText4)}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-rose-500 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Balance Meter */}
        <div className="rounded-xl border border-stone-800 bg-stone-950/70 p-4 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-400">
              {lang === 'ru' ? 'Движение к Переменам' : lang === 'en' ? 'Drive towards Change' : 'Рух уперед до Змін'}: {changePercent}% ({lang === 'ru' ? 'Баллы' : lang === 'en' ? 'Score' : 'Бали'}: {scoreChange})
            </span>
            <span className="text-sky-400">
              {lang === 'ru' ? 'Сохранение Статус-кво' : lang === 'en' ? 'Maintaining Status Quo' : 'Збереження Статус-кво'}: {100 - changePercent}% ({lang === 'ru' ? 'Баллы' : lang === 'en' ? 'Score' : 'Бали'}: {scoreStatusQuo})
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-stone-800 flex">
            <div
              style={{ width: `${changePercent}%` }}
              className="bg-emerald-500 transition-all duration-500"
            />
            <div
              style={{ width: `${100 - changePercent}%` }}
              className="bg-sky-500 transition-all duration-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoadingAi || !dilemma.trim()}
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
                    ? 'ИИ-Анализ Слепых Зон и Баланса Решения'
                    : lang === 'en'
                    ? 'AI Blind Spot & Decision Balance Audit'
                    : 'ШІ-Аналіз Сліпих Зон та Балансу Рішення'}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved || !dilemma.trim()}
            className="flex items-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-xs font-semibold text-stone-200 hover:bg-stone-700 transition-all cursor-pointer"
          >
            {isSaved ? <Check className="h-4 w-4 text-emerald-400" /> : <Bookmark className="h-4 w-4" />}
            <span>{isSaved ? t('saved_successfully') : t('save_to_journal')}</span>
          </button>
        </div>
      </div>

      {/* AI Cartesian Insights Results */}
      {aiAnalysis && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="rounded-2xl border border-teal-500/40 bg-stone-900 p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2 font-serif">
                <Sparkles className="h-5 w-5 text-teal-400" />
                {lang === 'ru'
                  ? 'Стратегический Вывод и Аудит Решения'
                  : lang === 'en'
                  ? 'Strategic Decision Verdict & Audit'
                  : 'Стратегічний Висновок та Аудит Рішення'}
              </h3>
              <div className="flex items-center gap-2 rounded-lg bg-teal-500/20 border border-teal-500/40 px-3 py-1 text-xs font-bold text-teal-300">
                {lang === 'ru' ? 'Индекс ясности' : lang === 'en' ? 'Clarity Score' : 'Індекс ясності'}: {aiAnalysis.clarityScore} / 100
              </div>
            </div>

            <p className="text-sm text-stone-200 leading-relaxed font-serif">
              {aiAnalysis.overallRecommendation}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 space-y-2">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4" />
                  {lang === 'ru'
                    ? 'Обнаруженные слепые зоны (что было упущено):'
                    : lang === 'en'
                    ? 'Discovered Blind Spots (what was overlooked):'
                    : 'Виявлені сліпі зони (що було поза увагою):'}
                </span>
                <ul className="list-disc list-inside space-y-1 text-stone-300">
                  {aiAnalysis.blindSpots.map((bs, i) => (
                    <li key={i}>{bs}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 space-y-2">
                <span className="font-bold text-rose-300 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" />
                  {lang === 'ru'
                    ? 'Скрытые страхи / Вторичные выгоды от нерешительности:'
                    : lang === 'en'
                    ? 'Hidden Fears / Secondary Gains of Indecision:'
                    : 'Приховані страхи / Вторинні вигоди від нерішучості:'}
                </span>
                <ul className="list-disc list-inside space-y-1 text-stone-300">
                  {aiAnalysis.hiddenFears.map((hf, i) => (
                    <li key={i}>{hf}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-1 text-xs">
              <strong className="text-emerald-300 block font-semibold">
                {lang === 'ru'
                  ? '🚀 Руководство к безопасному старту:'
                  : lang === 'en'
                  ? '🚀 Safe Launch Guidance:'
                  : '🚀 Керівництво до безпечного старту:'}
              </strong>
              <p className="text-stone-200 leading-relaxed">
                {aiAnalysis.actionGuidance}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
