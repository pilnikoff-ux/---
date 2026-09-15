import React, { useState, useEffect } from 'react';
import {
  Swords,
  Sparkles,
  Trophy,
  Shield,
  Backpack,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  RefreshCw,
  Bookmark,
  Check,
  Zap,
  Flame,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoalMakersGameState, GoalMakersQuest, MetaCard } from '../types';
import { META_CARDS_DECK } from '../data/metaCardsData';
import { requestGoalMakersStrategy } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { VoiceInputButton } from './VoiceInputButton';

interface GoalMakersGameProps {
  initialData?: {
    title?: string;
    pointA?: string;
    pointB?: string;
    action24h?: string;
  };
  onSavedToJournal?: () => void;
}

export const GoalMakersGame: React.FC<GoalMakersGameProps> = ({
  initialData,
  onSavedToJournal,
}) => {
  const [goalTitle, setGoalTitle] = useState(
    initialData?.title || 'Сміливий запуск нового проекту без страху провалу'
  );
  const [pointA, setPointA] = useState(
    initialData?.pointA || 'Відчуваю розгубленість, прокрастиную через страх неідеальності.'
  );
  const [pointB, setPointB] = useState(
    initialData?.pointB || 'Запущений перший продукт, перші 3 задоволені клієнти, впевненість у своїх силах.'
  );

  const [resources, setResources] = useState<string[]>([
    'Мій 5-річний практичний досвід',
    'Підтримка близького друга/наставника',
    'Готовність учитися на помилках',
  ]);
  const [newResource, setNewResource] = useState('');

  const [saboteurs, setSaboteurs] = useState<string[]>([
    'Внутрішній Перфекціоніст («або ідеально, або ніяк»)',
    'Страх публічної критики та засудження',
  ]);
  const [newSaboteur, setNewSaboteur] = useState('');

  const [quests, setQuests] = useState<GoalMakersQuest[]>([
    {
      id: 'q1',
      title: initialData?.action24h || 'Скласти чернетку структури проекту за 15 хвилин без редагування',
      timeframe: '24h',
      completed: false,
      rewardPoints: 50,
    },
    {
      id: 'q2',
      title: 'Провести 2 тестові інтерв’ю з потенційними користувачами',
      timeframe: '7d',
      completed: false,
      rewardPoints: 100,
    },
    {
      id: 'q3',
      title: 'Опублікувати фінальний реліз та відсвяткувати перемогу',
      timeframe: '30d',
      completed: false,
      rewardPoints: 250,
    },
  ]);
  const [newQuestTitle, setNewQuestTitle] = useState('');
  const [newQuestTimeframe, setNewQuestTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  // Meta-Cards Deck
  const [activeCard, setActiveCard] = useState<MetaCard | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [selectedDeckCategory, setSelectedDeckCategory] = useState<string>('all');

  // Focus Timer (Pomodoro for 24h quest)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [heroArchetype, setHeroArchetype] = useState<string>('');
  const [victoryRitual, setVictoryRitual] = useState<string>('');
  const [saboteurAntidotes, setSaboteurAntidotes] = useState<{ saboteur: string; antidoteStrategy: string }[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      triggerConfetti();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  };

  const toggleQuest = (id: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const nextState = !q.completed;
          if (nextState) triggerConfetti();
          return { ...q, completed: nextState };
        }
        return q;
      })
    );
  };

  const addQuest = () => {
    if (!newQuestTitle.trim()) return;
    const newQ: GoalMakersQuest = {
      id: `quest_${Date.now()}`,
      title: newQuestTitle.trim(),
      timeframe: newQuestTimeframe,
      completed: false,
      rewardPoints: newQuestTimeframe === '24h' ? 50 : newQuestTimeframe === '7d' ? 100 : 250,
    };
    setQuests([...quests, newQ]);
    setNewQuestTitle('');
  };

  const removeQuest = (id: string) => {
    setQuests(quests.filter((q) => q.id !== id));
  };

  const addResource = () => {
    if (!newResource.trim()) return;
    setResources([...resources, newResource.trim()]);
    setNewResource('');
  };

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index));
  };

  const addSaboteur = () => {
    if (!newSaboteur.trim()) return;
    setSaboteurs([...saboteurs, newSaboteur.trim()]);
    setNewSaboteur('');
  };

  const removeSaboteur = (index: number) => {
    setSaboteurs(saboteurs.filter((_, i) => i !== index));
  };

  // Draw Meta Card
  const drawRandomCard = () => {
    const pool =
      selectedDeckCategory === 'all'
        ? META_CARDS_DECK
        : META_CARDS_DECK.filter((c) => c.category === selectedDeckCategory);
    const random = pool[Math.floor(Math.random() * pool.length)];
    setActiveCard(random);
    setIsCardFlipped(true);
  };

  // AI Strategy Generation
  const handleGenerateStrategy = async () => {
    if (!goalTitle.trim()) {
      setError('Введіть назву мети подорожі.');
      return;
    }
    setError(null);
    setIsLoadingAi(true);

    try {
      const result = await requestGoalMakersStrategy({
        goalTitle,
        pointA,
        pointB,
        resources,
        saboteurs,
      });

      setHeroArchetype(result.heroArchetype);
      setVictoryRitual(result.victoryRitual);
      setSaboteurAntidotes(result.saboteurAntidotes || []);

      if (result.quests?.length) {
        const generatedQuests: GoalMakersQuest[] = result.quests.map((q: any, idx: number) => ({
          id: `gen_q_${Date.now()}_${idx}`,
          title: q.title,
          timeframe: q.timeframe || '24h',
          rewardPoints: q.rewardPoints || 50,
          completed: false,
          notes: q.notes,
        }));
        setQuests(generatedQuests);
      }
      triggerConfetti();
    } catch (err: any) {
      setError(err?.message || 'Не вдалося згенерувати стратегію Goal Makers.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Calculate points
  const totalPoints = quests.reduce((acc, q) => acc + (q.completed ? q.rewardPoints : 0), 0);
  const maxPoints = quests.reduce((acc, q) => acc + q.rewardPoints, 0) || 1;
  const progressPercent = Math.round((totalPoints / maxPoints) * 100);

  const handleSave = () => {
    const data: GoalMakersGameState = {
      id: `goal_makers_${Date.now()}`,
      goalTitle,
      pointA,
      pointB,
      resources,
      saboteurs,
      antidotes: saboteurAntidotes.map((a) => `${a.saboteur}: ${a.antidoteStrategy}`),
      quests,
      activeCard: activeCard || undefined,
      dateCreated: new Date().toISOString(),
      progressPercent,
    };

    saveJournalEntry({
      type: 'goalMakers',
      title: `Мета Героя: ${goalTitle}`,
      summary: `Прогрес: ${progressPercent}% (${totalPoints}/${maxPoints} XP). Залишилося квестів: ${
        quests.filter((q) => !q.completed).length
      }`,
      data,
    });

    setIsSaved(true);
    if (onSavedToJournal) onSavedToJournal();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/40 px-3 py-1 text-xs font-semibold text-rose-300">
          <Swords className="h-3.5 w-3.5" />
          Коучингова гра & Трекер досягнення «Мета Героя»
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl font-serif">
          Арена «Мета Героя»: Перетворення Інсайтів на Перемогу
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          Ігрова подорож героя: переведіть будь-який психологічний інсайт, проблему або сумнів у захопливий квест із ресурсами, битвою із внутрішніми драконами (саботерами) та швидкими перемогами за 24 години!
        </p>

        {/* User Instructions Guide */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 text-xs sm:text-sm font-bold">
            <HelpCircle className="h-4 w-4 text-amber-400" />
            <span>Інструкція: Як рухатися за методологією «Мета Героя»</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-amber-400 font-bold block">1. Точка А → Б</span>
              <p className="text-stone-300 leading-relaxed">
                Опишіть вихідний стан (страх, біль, розгубленість) та бажаний фінал (якість життя, показники успіху).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-teal-400 font-bold block">2. Рюкзак & Дракони</span>
              <p className="text-stone-300 leading-relaxed">
                Додайте свої сильні сторони, навички та людей у «Рюкзак», і викрийте саботерів («внутрішній критик»).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-purple-400 font-bold block">3. ШІ-Стратегія</span>
              <p className="text-stone-300 leading-relaxed">
                Натисніть кнопку генерації, щоб ШІ розрахував ваш архетип героя, антидоти до страхів і 3 мікро-квести.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-rose-400 font-bold block">4. Дія за 24 год + Таймер</span>
              <p className="text-stone-300 leading-relaxed">
                Увімкніть 25-хв фокус-таймер, виконайте перший крок за добу, ставте галочки та збирайте Бали Сили (XP)!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Container */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-5 sm:p-7 space-y-6 shadow-xl">
        {/* Game Title & Points Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-5">
          <div className="flex-1 min-w-[280px] space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-400">Назва місії героя:</label>
              <VoiceInputButton
                id="voice-input-goalmakers-title"
                currentValue={goalTitle}
                onTranscript={(text) => setGoalTitle(text)}
                fieldLabel="Назва місії героя"
              />
            </div>
            <input
              type="text"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="w-full text-base sm:text-lg font-bold text-amber-200 bg-transparent border-b border-stone-700 pb-1 focus:border-amber-500 focus:outline-hidden"
              placeholder="Сформулюйте головну мету..."
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-amber-300">
              <Trophy className="h-5 w-5 text-amber-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-400">Бали Сили (XP)</div>
                <div className="text-sm font-extrabold">{totalPoints} / {maxPoints} XP</div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaved}
              className="flex items-center gap-1.5 rounded-xl bg-stone-800 px-3.5 py-2.5 text-xs font-semibold text-stone-200 hover:bg-stone-700 transition-all"
            >
              {isSaved ? <Check className="h-4 w-4 text-emerald-400" /> : <Bookmark className="h-4 w-4" />}
              <span>{isSaved ? 'Збережено' : 'Зберегти'}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-stone-400">
            <span>Прогрес виконання квестів</span>
            <span className="text-amber-400">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-stone-800 overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-teal-400 transition-all duration-500"
            />
          </div>
        </div>

        {/* Hero's Journey: Point A & Point B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/20 text-[11px]">A</span>
                Точка А (Вихідна реальність / Біль)
              </span>
              <VoiceInputButton
                id="voice-input-goalmakers-point-a"
                currentValue={pointA}
                onTranscript={(text) => setPointA(text)}
                fieldLabel="Точка А"
              />
            </div>
            <textarea
              rows={3}
              value={pointA}
              onChange={(e) => setPointA(e.target.value)}
              placeholder="Де ви знаходитеся зараз? Які перешкоди та труднощі відчуваєте?"
              className="w-full bg-transparent text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden resize-none"
            />
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/10 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[11px]">B</span>
                Точка Б (Бажаний фініш / Тріумф)
              </span>
              <VoiceInputButton
                id="voice-input-goalmakers-point-b"
                currentValue={pointB}
                onTranscript={(text) => setPointB(text)}
                fieldLabel="Точка Б"
              />
            </div>
            <textarea
              rows={3}
              value={pointB}
              onChange={(e) => setPointB(e.target.value)}
              placeholder="Який конкретний вигляд матиме ваша перемога? Як ви дізнаєтеся, що дійшли?"
              className="w-full bg-transparent text-xs text-stone-200 placeholder-stone-600 focus:outline-hidden resize-none"
            />
          </div>
        </div>

        {/* Magic Backpack (Resources) & Dragon Arena (Saboteurs) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Resources */}
          <div className="rounded-2xl border border-teal-500/30 bg-stone-950/70 p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Backpack className="h-4 w-4" />
              Магічний Рюкзак (Ресурси & Союзники)
            </span>

            <div className="space-y-1.5">
              {resources.map((res, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs text-stone-200"
                >
                  <span>{res}</span>
                  <button
                    onClick={() => removeResource(i)}
                    className="text-stone-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addResource()}
                placeholder="Додати ресурс або союзника..."
                className="flex-1 min-w-0 rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-teal-500"
              />
              <VoiceInputButton
                id="voice-input-goalmakers-resource"
                compact
                currentValue={newResource}
                onTranscript={(text) => setNewResource(text)}
                fieldLabel="Ресурс"
              />
              <button
                onClick={addResource}
                title="Додати ресурс"
                className="h-8 w-8 min-w-[32px] flex items-center justify-center rounded-lg bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Saboteurs / Dragons */}
          <div className="rounded-2xl border border-rose-500/30 bg-stone-950/70 p-4 sm:p-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              Внутрішні Дракони (Саботери & Страхи)
            </span>

            <div className="space-y-1.5">
              {saboteurs.map((sab, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-200"
                >
                  <span className="break-words pr-2">{sab}</span>
                  <button
                    onClick={() => removeSaboteur(i)}
                    className="text-stone-500 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                    title="Видалити саботера"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={newSaboteur}
                onChange={(e) => setNewSaboteur(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSaboteur()}
                placeholder="Додати страх, сумнів чи перфекціонізм..."
                className="flex-1 min-w-0 rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-rose-500"
              />
              <VoiceInputButton
                id="voice-input-goalmakers-saboteur"
                compact
                currentValue={newSaboteur}
                onTranscript={(text) => setNewSaboteur(text)}
                fieldLabel="Саботер"
              />
              <button
                onClick={addSaboteur}
                title="Додати саботера"
                className="h-8 w-8 min-w-[32px] flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer active:scale-95 transition-all shadow-xs shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Strategy Generator Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-950/20">
          <div>
            <div className="text-xs font-bold text-amber-300">
              ШІ-Майстер Гри «Мета Героя»:
            </div>
            <div className="text-[11px] text-stone-400">
              Автоматично згенерувати архетип героя, квести 24г/7д/30д та антидоти проти драконів
            </div>
          </div>
          <button
            onClick={handleGenerateStrategy}
            disabled={isLoadingAi || !goalTitle.trim()}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 shadow-md hover:bg-amber-400 active:scale-98 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {isLoadingAi ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Генеруємо квести...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Створити Дорожню Карту Квестів</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Hero Archetype & Saboteur Antidotes if generated */}
        {(heroArchetype || saboteurAntidotes.length > 0 || victoryRitual) && (
          <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-950/80 p-5 animate-in fade-in text-xs">
            {heroArchetype && (
              <div className="text-stone-300">
                <span className="text-amber-400 font-bold">Архетип твого героя: </span>
                <span className="font-semibold text-stone-100">{heroArchetype}</span>
              </div>
            )}

            {saboteurAntidotes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-rose-300 font-bold block">Зброя проти внутрішніх саботерів:</span>
                {saboteurAntidotes.map((ant, idx) => (
                  <div key={idx} className="rounded-lg bg-stone-900 p-2.5 border border-stone-800">
                    <strong className="text-stone-200">{ant.saboteur}: </strong>
                    <span className="text-stone-400">{ant.antidoteStrategy}</span>
                  </div>
                ))}
              </div>
            )}

            {victoryRitual && (
              <div className="pt-1 text-emerald-300">
                <span className="font-bold">Ритуал святкування перемоги: </span>
                <span className="text-stone-300">{victoryRitual}</span>
              </div>
            )}
          </div>
        )}

        {/* Quest Matrix Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-200 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Матриця Квестів Трансформації (24 години / 7 днів / 30 днів)
            </span>
          </div>

          <div className="space-y-2.5">
            {quests.map((quest) => (
              <div
                key={quest.id}
                onClick={() => toggleQuest(quest.id)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-xs transition-all cursor-pointer ${
                  quest.completed
                    ? 'border-emerald-500/40 bg-emerald-950/20 opacity-80'
                    : 'border-stone-800 bg-stone-950/80 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleQuest(quest.id);
                    }}
                  >
                    {quest.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-stone-600 hover:text-stone-400" />
                    )}
                  </button>
                  <span
                    className={`font-medium ${
                      quest.completed ? 'line-through text-stone-500' : 'text-stone-100'
                    }`}
                  >
                    {quest.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      quest.timeframe === '24h'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : quest.timeframe === '7d'
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-sky-500/20 text-sky-300'
                    }`}
                  >
                    {quest.timeframe === '24h' && '24 ГОДИНИ'}
                    {quest.timeframe === '7d' && '7 ДНІВ'}
                    {quest.timeframe === '30d' && '30 ДНІВ'}
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">+{quest.rewardPoints} XP</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeQuest(quest.id);
                    }}
                    className="text-stone-600 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add custom quest */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="flex-1 flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-950 px-3 py-1">
              <input
                type="text"
                value={newQuestTitle}
                onChange={(e) => setNewQuestTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addQuest()}
                placeholder="Додати свій квест дій..."
                className="flex-1 bg-transparent text-xs text-stone-100 focus:outline-hidden"
              />
              <VoiceInputButton
                id="voice-input-goalmakers-quest"
                currentValue={newQuestTitle}
                onTranscript={(text) => setNewQuestTitle(text)}
                fieldLabel="Квест дій"
              />
            </div>
            <select
              value={newQuestTimeframe}
              onChange={(e) => setNewQuestTimeframe(e.target.value as any)}
              className="rounded-xl border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-stone-300"
            >
              <option value="24h">24 Години (Спринт)</option>
              <option value="7d">7 Днів (Рубікон)</option>
              <option value="30d">30 Днів (Стратегія)</option>
            </select>
            <button
              onClick={addQuest}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-all"
            >
              Додати квест
            </button>
          </div>
        </div>

        {/* 24h Action Focus Timer (Pomodoro) */}
        <div className="rounded-2xl border border-amber-500/30 bg-stone-950/80 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Clock className="h-4 w-4" />
              <span>Таймер Фокусу «Спринт 24 Години»: Зроби перший крок просто зараз</span>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(15 * 60);
                }}
                className="rounded bg-stone-900 px-2.5 py-1 text-stone-400 hover:text-stone-200"
              >
                15 хв
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="rounded bg-stone-900 px-2.5 py-1 text-stone-400 hover:text-stone-200"
              >
                25 хв
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(50 * 60);
                }}
                className="rounded bg-stone-900 px-2.5 py-1 text-stone-400 hover:text-stone-200"
              >
                50 хв
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-wider text-stone-100">
              {formatTimer(timerSeconds)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all ${
                  isTimerRunning
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                    : 'bg-teal-600 text-stone-950 hover:bg-teal-500'
                }`}
              >
                {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Metaphorical & Provocative Meta-Cards Deck */}
        <div className="rounded-2xl border border-stone-800 bg-stone-950 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Колода Метафоричних & Провокаційних Карток
              </span>
              <p className="text-[11px] text-stone-400">
                Витягни випадкову карту інсайту для виходу з глухого кута
              </p>
            </div>

            <div className="flex gap-2">
              <select
                value={selectedDeckCategory}
                onChange={(e) => setSelectedDeckCategory(e.target.value)}
                className="rounded-xl border border-stone-800 bg-stone-900 px-3 py-1.5 text-xs text-stone-300"
              >
                <option value="all">Усі 5 колод (Повний набір)</option>
                <option value="courage">Шлях Сміливості</option>
                <option value="truth">Дзеркало Правди</option>
                <option value="linetsky_flow">Природний Потік Линецького</option>
                <option value="resource">Ресурсний Якір</option>
                <option value="future_focus">Фокус Майбутнього</option>
              </select>

              <button
                onClick={drawRandomCard}
                className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-all shadow-md active:scale-95"
              >
                Тягнути Картку
              </button>
            </div>
          </div>

          {/* Active Card View */}
          {activeCard && (
            <div className="mx-auto max-w-lg rounded-2xl border-2 border-purple-500/50 bg-stone-900 p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-300">
              <span className="inline-block rounded-full bg-purple-500/20 px-3 py-0.5 text-[11px] font-bold text-purple-300 uppercase">
                {activeCard.categoryLabel}
              </span>
              <h3 className="text-lg font-bold text-stone-100 font-serif">
                «{activeCard.title}»
              </h3>

              <p className="text-xs text-stone-300 italic font-serif leading-relaxed">
                "{activeCard.metaphor}"
              </p>

              {activeCard.linetskyQuote && (
                <p className="text-xs text-amber-300/90 font-medium">
                  {activeCard.linetskyQuote}
                </p>
              )}

              <div className="rounded-xl bg-stone-950 p-4 border border-stone-800 text-xs space-y-1">
                <strong className="text-purple-300 block">🔥 Провокаційне запитання:</strong>
                <p className="text-stone-200">{activeCard.provocativeQuestion}</p>
              </div>

              <div className="rounded-xl bg-emerald-950/30 p-3.5 border border-emerald-500/30 text-xs text-emerald-200">
                <strong>Імпульс до дії: </strong>
                {activeCard.actionImpulse}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
