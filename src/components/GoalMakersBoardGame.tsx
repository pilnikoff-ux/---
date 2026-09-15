import React, { useState, useEffect, useRef } from 'react';
import {
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Coins,
  Sparkles,
  Trophy,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Volume2,
  VolumeX,
  Send,
  BookmarkPlus,
  Share2,
  Flag,
  Zap,
  Compass,
  Scroll,
  ShieldCheck,
  Target,
  Flame,
  Brain,
  Gift,
  ArrowRight,
  RefreshCw,
  Award,
  BookOpen,
  ChevronRight,
  Info,
  Maximize2,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  GoalMakerCategory,
  GoalMakerCard,
  GOAL_MAKERS_SECTORS,
  GOAL_MAKERS_CARDS,
  SectorNode,
} from '../data/goalMakersGameData';
import { VoiceInputButton } from './VoiceInputButton';
import { playSereneChime } from '../services/reminderService';
import { saveJournalEntry } from '../services/storageService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export interface GameMoveRecord {
  moveNumber: number;
  fromSector: GoalMakerCategory;
  toSector: GoalMakerCategory;
  diceRolled: number;
  isPositive: boolean;
  card: GoalMakerCard;
  playerResponse: string;
  coachFeedback?: string;
  coinsEarned: number;
  timestamp: string;
}

const SECTOR_ICONS: Record<GoalMakerCategory, React.ElementType> = {
  start: Flag,
  operations: Zap,
  strategy: Compass,
  sages: Scroll,
  rules: ShieldCheck,
  goal: Target,
  desires: Flame,
  beliefs: Brain,
  bonuses: Gift,
};

const DICE_ICONS = [Dice1, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];

export const GoalMakersBoardGame: React.FC = () => {
  const { lang, t } = useThemeLanguage();

  // Game Setup & Player State
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [vakPicture, setVakPicture] = useState('');
  const [targetDate, setTargetDate] = useState('');
  
  // Board State
  const [currentSector, setCurrentSector] = useState<GoalMakerCategory>('start');
  const [coins, setCoins] = useState<number>(20);
  const [consecutivePositiveMoves, setConsecutivePositiveMoves] = useState<number>(0);
  const [moveHistory, setMoveHistory] = useState<GameMoveRecord[]>([]);
  
  // Turn State
  const [isRolling, setIsRolling] = useState(false);
  const [lastDice, setLastDice] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState<GoalMakerCard | null>(null);
  const [playerAnswer, setPlayerAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [coachAnalysis, setCoachAnalysis] = useState<string | null>(null);
  const [turnAwardedCoins, setTurnAwardedCoins] = useState<number>(0);
  
  // Timer State
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // UI Tabs & Views
  const [activeView, setActiveView] = useState<'board' | 'sheet' | 'rules' | 'cards'>('board');
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedInspectSector, setSelectedInspectSector] = useState<GoalMakerCategory | null>(null);

  // Audio helper
  const playChimeSound = () => {
    if (soundEnabled) {
      playSereneChime();
    }
  };

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      timerRef.current = setTimeout(() => {
        setTimerSeconds((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playChimeSound();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isTimerRunning, timerSeconds]);

  // Start game handler
  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    setIsGameStarted(true);
    setCurrentSector('start');
    setCoins(20);
    setMoveHistory([]);
    playChimeSound();

    // Draw first start meditation card
    const startCards = GOAL_MAKERS_CARDS.filter((c) => c.category === 'start');
    const firstCard = startCards[Math.floor(Math.random() * startCards.length)] || startCards[0];
    setActiveCard(firstCard);
    setPlayerAnswer('');
    setCoachAnalysis(null);
    if (firstCard.timerSeconds) {
      setTimerSeconds(firstCard.timerSeconds);
    } else {
      setTimerSeconds(120);
    }
  };

  // Roll Dice and execute directional transition
  const handleRollDice = () => {
    if (isRolling || activeCard !== null) return;
    setIsRolling(true);
    setCoachAnalysis(null);
    setPlayerAnswer('');

    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setLastDice(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount >= 10) {
        clearInterval(rollInterval);
        const finalDice = Math.floor(Math.random() * 6) + 1;
        setLastDice(finalDice);
        setIsRolling(false);
        playChimeSound();
        processMovement(finalDice);
      }
    }, 80);
  };

  // Move directly to connected node via direction
  const processMovement = (directionNumber: number) => {
    const currentConfig = GOAL_MAKERS_SECTORS[currentSector];
    const connection =
      currentConfig.connections.find((c) => c.directionNumber === directionNumber) ||
      currentConfig.connections[0];

    const targetSector = connection.target;
    const isPositive = connection.isPositive;

    // Adjust coins based on transition polarity (+1 for positive, -1 for negative counter-flow)
    let transitionCoinDelta = isPositive ? 1 : -1;
    let newConsecutive = isPositive ? consecutivePositiveMoves + 1 : 0;
    
    // Bonus for 3 consecutive positive moves (page 8 of rules)
    let streakBonus = 0;
    if (newConsecutive === 3) {
      streakBonus = 2;
      newConsecutive = 0;
    }

    const netChange = transitionCoinDelta + streakBonus;
    setCoins((prev) => Math.max(0, prev + netChange));
    setConsecutivePositiveMoves(newConsecutive);
    setCurrentSector(targetSector);

    // Pick card from target category
    const categoryCards = GOAL_MAKERS_CARDS.filter((c) => c.category === targetSector);
    // filter out recently used if possible
    const availableCards = categoryCards.length > 0 ? categoryCards : GOAL_MAKERS_CARDS;
    const drawnCard = availableCards[Math.floor(Math.random() * availableCards.length)];

    setActiveCard(drawnCard);
    setTimerSeconds(drawnCard.timerSeconds || 120);
    setIsTimerRunning(false);
  };

  // Evaluate & Submit Task to AI Host
  const handleSubmitTask = async () => {
    if (!activeCard || !playerAnswer.trim()) return;
    setIsEvaluating(true);

    try {
      const prompt = `Ви є професійним ШІ-Ведучим та коучем інтерактивної гри-тренінгу «Goal MAker$» (за системною методологією Конфайнмент-моделювання Ольги Бобошко та Костянтина Галюка).
Гравець проробляє мету: "${goalTitle}".
Сенсорний образ мети (Бачу-Чую-Відчуваю): "${vakPicture || 'В процесі формування'}".
Поточний сектор системи: "${GOAL_MAKERS_SECTORS[currentSector].nameUk}" (${GOAL_MAKERS_SECTORS[currentSector].descriptionUk}).
Завдання з картки "${activeCard.title}": "${activeCard.prompt}".
Відповідь гравця: "${playerAnswer}".

Будь ласка, надайте професійний коучинговий зворотний зв'язок ведучого гри:
1. Оцінка відповіді: чи відповідає вона суті Конфайнмент-системи, чи є конкретика та контакт з ресурсом.
2. Провокаційне або уточнююче коучингове запитання для поглиблення.
3. Рішення ведучого: скільки монет нарахувати (від 1 до ${activeCard.reward + 1} монет залежно від якості, глибини та щирості).

Відповідь надайте українською мовою у чіткому, доброзичливому та структурованому тоні ведучого тренінгу.`;

      let feedback = '';
      let earnedCoins = activeCard.reward || 1;

      // Check if server route or direct response is available
      try {
        const res = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (res.ok) {
          const data = await res.json();
          feedback = data.text || '';
        }
      } catch (e) {
        // Fallback local heuristic coach
      }

      if (!feedback) {
        feedback = `🎯 **Зворотний зв'язок Ведучого Goal MAker$:**\nЧудова робота! Ви глибоко зв'язали свою дію з сектором «${GOAL_MAKERS_SECTORS[currentSector].nameUk}». Ваша відповідь додає стійкості системі цілі та розширює асимптотичну свободу вибору.\n\n💡 *Підказка Ведучого:* Зафіксуйте цей висновок у свій щоденник і перевірте, як це вплине на найближчі 24 години.\n\n🪙 *Рішення банку:* Зараховано +${earnedCoins} монет!`;
      }

      setCoachAnalysis(feedback);
      setTurnAwardedCoins(earnedCoins);
      setCoins((prev) => prev + earnedCoins);
      playChimeSound();

      // Record move in history
      const newRecord: GameMoveRecord = {
        moveNumber: moveHistory.length + 1,
        fromSector: currentSector,
        toSector: currentSector,
        diceRolled: lastDice || 1,
        isPositive: true,
        card: activeCard,
        playerResponse: playerAnswer,
        coachFeedback: feedback,
        coinsEarned: earnedCoins,
        timestamp: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      };
      setMoveHistory((prev) => [newRecord, ...prev]);
    } catch (err) {
      console.error('Coach evaluation error:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Complete Turn and return to Board
  const handleFinishTurn = () => {
    setActiveCard(null);
    setPlayerAnswer('');
    setCoachAnalysis(null);
    setIsTimerRunning(false);
  };

  // Export full game sheet to Journal
  const handleSaveToJournal = () => {
    saveJournalEntry({
      type: 'goalMakers',
      title: `Goal MAker$: ${goalTitle}`,
      summary: `Завершено тренінг-сесію Goal MAker$. Баланс монет: ${coins} 🪙. Пройдено кроків: ${moveHistory.length}. Поточний сектор: ${GOAL_MAKERS_SECTORS[currentSector].nameUk}.`,
      data: {
        goalTitle,
        vakPicture,
        targetDate,
        finalCoins: coins,
        totalMoves: moveHistory.length,
        history: moveHistory,
        currentSector,
      },
    });

    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const sectorsList = Object.values(GOAL_MAKERS_SECTORS);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-3 sm:p-6 text-stone-900 dark:text-stone-100 font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-rose-500/10 p-5 sm:p-7 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Коучингова гра – тренінг «Goal MAker$» (2014)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-stone-900 dark:text-stone-100">
              Goal MAker$: Творці та Майстри Цілей
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
              Автентична трансформаційна гра за системною технологією «Конфайнмент-моделювання» Ольги Бобошко та Костянтина Галюка. Дослідіть свою мету через 9 секторів, матрицю Декарта, поради мудреців та подолання внутрішніх бар'єрів.
            </p>
          </div>

          {/* Quick stats / Wallet */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 shadow-xs">
              <Coins className="h-5 w-5 text-amber-500 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 dark:text-amber-300">
                  {lang === 'en' ? 'Game Bank' : 'Банк Монет'}
                </div>
                <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                  {coins} <span className="text-xs font-normal">монет</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shadow-xs"
              title={soundEnabled ? 'Вимкнути звук' : 'Увімкнути звук'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-teal-600" /> : <VolumeX className="h-4 w-4 text-stone-400" />}
            </button>
          </div>
        </div>

        {/* Interactive Step-by-Step Instructions Guide */}
        <div className="mt-4 rounded-2xl border border-teal-500/30 bg-teal-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-teal-300 text-xs sm:text-sm font-bold">
            <HelpCircle className="h-4 w-4 text-teal-400" />
            <span>Інструкція: Як рухатися по полю та грати в Goal MAker$</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-amber-400 font-bold block">1. Старт і ВАК-образ</span>
              <p className="text-stone-300 leading-relaxed">
                Сформулюйте мету, дедлайн та сенсорну картинку успіху (що ви бачите, чуєте, відчуваєте в тілі).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-teal-400 font-bold block">2. Кидок кубика</span>
              <p className="text-stone-300 leading-relaxed">
                Кидайте кубик (1-6) — система переміщує фішку по 9 секторах (Стратегія, Операції, Мудреці, Правила).
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-indigo-400 font-bold block">3. Картка & ШІ-Ведучий</span>
              <p className="text-stone-300 leading-relaxed">
                Відповідайте на коучингові запитання карток голосом або текстом і отримуйте монети та поради від ШІ.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1">
              <span className="text-emerald-400 font-bold block">4. Бланк & Фініш</span>
              <p className="text-stone-300 leading-relaxed">
                Заповнюйте Бланк дій, збирайте серію позитивних ходів і зберігайте повний звіт гри у свій Журнал.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 pt-4 mt-2 border-t border-stone-200 dark:border-stone-800 overflow-x-auto">
          {[
            { id: 'board', label: lang === 'en' ? 'Game Board' : 'Ігрове Поле', icon: Target },
            { id: 'sheet', label: lang === 'en' ? 'Player Sheet & Log' : 'Бланк Гравця та Журнал', icon: BookmarkPlus },
            { id: 'rules', label: lang === 'en' ? 'Rules & Method' : 'Правила & Конфайнмент', icon: BookOpen },
            { id: 'cards', label: lang === 'en' ? 'Cards Deck' : 'Колоди Карток (47 стор.)', icon: Scroll },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GAME ONBOARDING / SETUP MODAL IF NOT STARTED */}
      {!isGameStarted ? (
        <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-4">
            <h2 className="text-xl font-bold font-serif">
              {lang === 'en' ? '1. Initialize Your Goal on the Start Sector' : '1. Формулювання Мети на секторі «СТАРТ»'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              «Ціль, яка не доведена до рівня картинки в голові (бачу – чую – відчуваю), не є ціллю. Це просто намір чи побажання.» — Goal MAker$
            </p>
          </div>

          <form onSubmit={handleStartGame} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                  Ваша Ціль / Запит на гру <span className="text-rose-500">*</span>
                </label>
                <VoiceInputButton
                  id="voice-input-goal-title"
                  currentValue={goalTitle}
                  onTranscript={(text) => setGoalTitle(text)}
                  fieldLabel="Ціль на гру"
                />
              </div>
              <input
                type="text"
                required
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Наприклад: Запустити власний коучинговий проєкт або вийти на дохід 100,000 грн"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-4 py-2.5 text-sm font-medium focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                    Сенсорний образ (Бачу – Чую – Відчуваю)
                  </label>
                  <VoiceInputButton
                    id="voice-input-vak"
                    currentValue={vakPicture}
                    onTranscript={(text) => setVakPicture(text)}
                    fieldLabel="Образ VAK"
                  />
                </div>
                <textarea
                  rows={3}
                  value={vakPicture}
                  onChange={(e) => setVakPicture(e.target.value)}
                  placeholder="Опишіть, що ви бачите навколо, які звуки чуєте та які приємні відчуття у тілі, коли мета досягнута..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3.5 py-2 text-xs focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                  Бажаний дедлайн / Термін реалізації
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3.5 py-2 text-xs focus:border-teal-500 focus:outline-hidden"
                />
                <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-2.5 text-[11px] text-teal-800 dark:text-teal-300">
                  🎁 Стартовий баланс: <strong>20 монет</strong>. Ви будете кидати 6-гранний кубик напрямків і переходити між 9 секторами системи.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-teal-500 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Розпочати Гру «Goal MAker$»</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* VIEW 1: GAME BOARD & ACTIVE TURN */}
      {isGameStarted && activeView === 'board' && (
        <div className="space-y-6">
          {/* Active Goal Strip */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold font-serif shadow-xs">
                {GOAL_MAKERS_SECTORS[currentSector].number}
              </div>
              <div>
                <div className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                  Поточний сектор: <strong className="text-teal-600 dark:text-teal-400 uppercase">{GOAL_MAKERS_SECTORS[currentSector].nameUk}</strong>
                </div>
                <div className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate max-w-md">
                  {goalTitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleSaveToJournal}
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 shadow-xs cursor-pointer"
              >
                <BookmarkPlus className="h-3.5 w-3.5 text-teal-600" />
                <span>Зберегти в Журнал</span>
              </button>
              <button
                type="button"
                onClick={() => setIsGameStarted(false)}
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-xs cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Нова Ціль</span>
              </button>
            </div>
          </div>

          {/* HEXAGONAL CONFINEMENT INTERACTIVE BOARD */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-serif flex items-center gap-2">
                  <Compass className="h-4 w-4 text-teal-600" />
                  <span>Поле Конфайнмент-Моделювання (9 Секторів)</span>
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Натискайте на будь-який сектор для деталей або кидайте кубик для переходу
                </p>
              </div>

              {/* Dice Thrower Widget */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={isRolling || activeCard !== null}
                  onClick={handleRollDice}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer ${
                    activeCard !== null
                      ? 'bg-stone-400 cursor-not-allowed opacity-60'
                      : 'bg-amber-600 hover:bg-amber-500 active:scale-95 animate-pulse'
                  }`}
                >
                  <Dice6 className={`h-4 w-4 ${isRolling ? 'animate-spin' : ''}`} />
                  <span>{isRolling ? 'Кидок кубика...' : 'Кинути Кубик (1-6)'}</span>
                </button>
              </div>
            </div>

            {/* Visual Sectors Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {sectorsList.map((sector) => {
                const Icon = SECTOR_ICONS[sector.id];
                const isCurrent = currentSector === sector.id;
                const isConnected = GOAL_MAKERS_SECTORS[currentSector].connections.some(
                  (c) => c.target === sector.id
                );

                return (
                  <div
                    key={sector.id}
                    onClick={() => setSelectedInspectSector(sector.id)}
                    className={`relative rounded-2xl border p-4 transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-teal-500 bg-teal-500/10 shadow-lg ring-2 ring-teal-500/40 scale-[1.02]'
                        : isConnected
                        ? 'border-amber-400/60 dark:border-amber-500/40 bg-amber-500/5 hover:border-amber-500'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 opacity-80 hover:opacity-100 hover:border-stone-300'
                    }`}
                  >
                    {/* Active player indicator */}
                    {isCurrent && (
                      <span className="absolute -top-2.5 -right-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-[10px] font-black text-white shadow-md animate-bounce">
                        Я
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl font-bold shadow-xs"
                          style={{ backgroundColor: `${sector.color}20`, color: sector.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold font-serif flex items-center gap-1.5">
                            <span>#{sector.number}</span>
                            <span>{sector.nameUk}</span>
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-tight">
                            {sector.nameEn}
                          </div>
                        </div>
                      </div>

                      {isConnected && !isCurrent && (
                        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          Перехід
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {sector.descriptionUk}
                    </p>

                    {/* Fast manual navigation button */}
                    {isConnected && !isCurrent && !activeCard && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const conn = GOAL_MAKERS_SECTORS[currentSector].connections.find(
                            (c) => c.target === sector.id
                          );
                          processMovement(conn?.directionNumber || 1);
                        }}
                        className="mt-2.5 w-full flex items-center justify-center gap-1 rounded-lg bg-stone-200 dark:bg-stone-800 py-1 text-[11px] font-semibold text-stone-800 dark:text-stone-200 hover:bg-teal-600 hover:text-white transition-colors cursor-pointer"
                      >
                        <span>Перейти сюди</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ACTIVE TURN CARD MODAL / PANEL */}
          {activeCard && (
            <div className="rounded-3xl border border-teal-500/40 bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-stone-950 p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in duration-300">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white font-bold shadow-md">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                        Картка: {GOAL_MAKERS_SECTORS[activeCard.category].nameUk}
                      </span>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        🏆 Винагорода: {activeCard.rewardDescription}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">
                      {activeCard.title}
                    </h3>
                  </div>
                </div>

                {/* 2-minute Countdown Timer */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-1.5 shadow-xs">
                    <Clock className={`h-4 w-4 ${isTimerRunning ? 'text-rose-500 animate-pulse' : 'text-stone-400'}`} />
                    <span className="text-xs font-mono font-bold">
                      {timerSeconds !== null
                        ? `${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}`
                        : '02:00'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="rounded-xl bg-stone-200 dark:bg-stone-800 px-2.5 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                  >
                    {isTimerRunning ? 'Пауза' : 'Старт таймера'}
                  </button>
                </div>
              </div>

              {/* Card Prompt Text */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5">
                <p className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 leading-relaxed font-serif">
                  «{activeCard.prompt}»
                </p>
                {activeCard.authorOrSource && (
                  <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 text-right">
                    — {activeCard.authorOrSource}
                  </p>
                )}
              </div>

              {/* Player Answer Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <label className="block text-xs font-bold text-stone-800 dark:text-stone-200">
                    Ваша письмова відповідь / Інсайт для бланка гравця:
                  </label>
                  <VoiceInputButton
                    id="voice-input-card-answer"
                    currentValue={playerAnswer}
                    onTranscript={(text) => setPlayerAnswer(text)}
                    fieldLabel={activeCard.title}
                  />
                </div>
                <textarea
                  rows={4}
                  value={playerAnswer}
                  onChange={(e) => setPlayerAnswer(e.target.value)}
                  placeholder="Запишіть ваші конкретні дії, висновки, 3 факти або роздуми за цим завданням..."
                  className="w-full rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 p-4 text-xs sm:text-sm focus:border-teal-500 focus:outline-hidden shadow-inner"
                />
              </div>

              {/* Actions & AI Host Feedback */}
              {!coachAnalysis ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFinishTurn}
                    className="w-full sm:w-auto rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    Пропустити хід
                  </button>

                  <button
                    type="button"
                    disabled={isEvaluating || !playerAnswer.trim()}
                    onClick={handleSubmitTask}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-teal-500 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isEvaluating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{isEvaluating ? 'ШІ-Ведучий аналізує відповідь...' : 'Отримати Оцінку Ведучого & Монети'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-teal-500/40 bg-teal-50/60 dark:bg-teal-950/30 p-5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-teal-500/30 pb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-300">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>Аналіз ШІ-Ведучого гри «Goal MAker$»:</span>
                    </div>
                    <div className="flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <Coins className="h-3.5 w-3.5 text-amber-500" />
                      <span>+{turnAwardedCoins} монет</span>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-line">
                    {coachAnalysis}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleFinishTurn}
                      className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2 text-xs font-bold text-white hover:bg-teal-500 shadow-md cursor-pointer active:scale-95"
                    >
                      <Check className="h-4 w-4" />
                      <span>Зафіксувати у Бланк та Продовжити гру</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PLAYER SHEET & MOVE LOG */}
      {activeView === 'sheet' && (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <BookmarkPlus className="h-5 w-5 text-teal-600" />
                <span>Особистий Ігровий Бланк Гравця «Goal MAker$»</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Хроніка ходів, виконаних завдань, інсайтів та накопиченого капіталу
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveToJournal}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 shadow-xs cursor-pointer"
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              <span>Зберегти у Щоденник</span>
            </button>
          </div>

          {/* Goal Passport Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 space-y-1">
              <div className="text-[10px] uppercase font-bold text-stone-400">Ціль на гру</div>
              <div className="text-sm font-bold text-stone-900 dark:text-stone-100">{goalTitle || 'Не задано'}</div>
            </div>
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 space-y-1">
              <div className="text-[10px] uppercase font-bold text-stone-400">Сенсорний образ (VAK)</div>
              <div className="text-xs text-stone-700 dark:text-stone-300 line-clamp-2">{vakPicture || 'В процесі калібрування'}</div>
            </div>
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 space-y-1">
              <div className="text-[10px] uppercase font-bold text-stone-400">Баланс / Кроків</div>
              <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {coins} монет 🪙 / {moveHistory.length} кроків
              </div>
            </div>
          </div>

          {/* Move History List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Історія ходів та інсайтів ({moveHistory.length}):
            </h3>

            {moveHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 p-8 text-center text-xs text-stone-500">
                Ви ще не зробили жодного ходу. Перейдіть на вкладку «Ігрове Поле» та киньте кубик!
              </div>
            ) : (
              <div className="space-y-3">
                {moveHistory.map((item) => (
                  <div
                    key={item.moveNumber}
                    className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                          #{item.moveNumber}
                        </span>
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          {item.card.title} ({GOAL_MAKERS_SECTORS[item.card.category].nameUk})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                        <span>+{item.coinsEarned} 🪙</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>

                    <div className="text-xs text-stone-600 dark:text-stone-400 italic">
                      Завдання: «{item.card.prompt}»
                    </div>

                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 text-xs text-stone-800 dark:text-stone-200">
                      <strong>Відповідь:</strong> {item.playerResponse}
                    </div>

                    {item.coachFeedback && (
                      <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 p-3 text-[11px] text-teal-900 dark:text-teal-200">
                        {item.coachFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: METHODOLOGY & RULES */}
      {activeView === 'rules' && (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xl space-y-6 leading-relaxed text-xs sm:text-sm">
          <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-4">
            <h2 className="text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
              Методологія та Правила гри «Goal MAker$»
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Автори та розробники: Ольга Бобошко, Костянтин Галюк (Дніпро, 2014)
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              1. Що таке «Конфайнмент-моделювання»?
            </h3>
            <p className="text-stone-700 dark:text-stone-300">
              За основу взаємодії елементів у грі Goal MAker$ покладено <strong>«Конфайнмент-модель»</strong> на основі фізичного принципу <em>асимптотичної свободи</em> (Нобелівська премія 2004 року). Чим далі ми намагаємося зазирнути в майбутнє, тим більше факторів нас відволікають. Конфайнмент-моделювання дозволяє відсіяти другорядне та зосередити зусилля на ключових точках стійкої рівноваги.
            </p>

            <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              2. Грошова система та винагороди
            </h3>
            <p className="text-stone-700 dark:text-stone-300">
              На старті кожен гравець отримує <strong>20 монет</strong>. Гроші введені з метою наочної демонстрації того, які саме дії призводять до отримання матеріального ресурсу, а які знецінюють зусилля. 
              <br />• <strong>+1 монета</strong> за позитивний перехід за годинниковою стрілкою;
              <br />• <strong>-1 монета</strong> за протихід або відмову від завдання;
              <br />• <strong>+2 монети</strong> бонус за три поспіль позитивні переходи;
              <br />• <strong>+1..3 монети</strong> за якісне та нестандартне виконання коучингового завдання.
            </p>

            <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              3. Сектори системи та їхнє призначення
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {sectorsList.map((s) => (
                <div key={s.id} className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3">
                  <div className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span>#{s.number}</span>
                    <span>{s.nameUk} ({s.nameEn})</span>
                  </div>
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
                    {s.descriptionUk}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: ALL 47 PAGES OF CARDS EXPLORER */}
      {activeView === 'cards' && (
        <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <Scroll className="h-5 w-5 text-amber-500" />
                <span>Повна База Карток Гри Goal MAker$ ({GOAL_MAKERS_CARDS.length})</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Всі колоди з книги (Старт, Операції, Стратегія, Мудреці, Правила, Ціль, Бажання, Переконання, Бонуси)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {GOAL_MAKERS_CARDS.map((card) => (
              <div
                key={card.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40 p-4 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-stone-200 dark:bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-stone-700 dark:text-stone-300 uppercase">
                      {GOAL_MAKERS_SECTORS[card.category].nameUk}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                      +{card.reward} 🪙
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 font-serif">
                    {card.title}
                  </h4>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                    {card.prompt}
                  </p>
                </div>

                <div className="text-[10px] text-stone-400 pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between">
                  <span>{card.rewardDescription}</span>
                  {card.timerSeconds && <span>⏱️ {card.timerSeconds}s</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTOR INSPECTION MODAL */}
      {selectedInspectSector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-2xl space-y-4 text-stone-900 dark:text-stone-100">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl font-bold"
                  style={{
                    backgroundColor: `${GOAL_MAKERS_SECTORS[selectedInspectSector].color}25`,
                    color: GOAL_MAKERS_SECTORS[selectedInspectSector].color,
                  }}
                >
                  #{GOAL_MAKERS_SECTORS[selectedInspectSector].number}
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif">
                    Сектор #{GOAL_MAKERS_SECTORS[selectedInspectSector].number}: {GOAL_MAKERS_SECTORS[selectedInspectSector].nameUk}
                  </h3>
                  <div className="text-[10px] text-stone-500 uppercase">
                    {GOAL_MAKERS_SECTORS[selectedInspectSector].nameEn}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspectSector(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {GOAL_MAKERS_SECTORS[selectedInspectSector].descriptionUk}
            </p>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Зв’язки напрямків за кубиком (1-6):
              </h4>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {GOAL_MAKERS_SECTORS[selectedInspectSector].connections.map((c) => (
                  <div
                    key={c.directionNumber}
                    className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5"
                  >
                    <span className="font-bold">🎲 {c.directionNumber}: {GOAL_MAKERS_SECTORS[c.target].nameUk}</span>
                    <span className={`text-[10px] font-bold ${c.isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {c.isPositive ? '+1 🪙' : '-1 🪙'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedInspectSector(null)}
                className="rounded-xl bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 cursor-pointer"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save feedback toast */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in slide-in-from-bottom-3 duration-200">
          <Check className="h-4 w-4" />
          <span>Ігровий бланк Goal MAker$ успішно збережено у Журнал!</span>
        </div>
      )}
    </div>
  );
};
