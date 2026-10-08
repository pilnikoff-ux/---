import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  Circle,
  HelpCircle,
  AlertCircle,
  Bookmark,
  Check,
  ArrowRight,
  Flame,
  Brain,
  Coffee,
  CloudRain,
  Radio,
  Clock,
  Heart,
  ShieldAlert,
  MessageSquare,
  Compass,
  Star,
  Zap,
} from 'lucide-react';
import {
  BodyDoublePersona,
  BodyDoublePersonaId,
  BodyDoubleMicroStep,
  BodyDoubleSessionData,
} from '../types';
import {
  requestBodyDoubleDecompose,
  requestBodyDoubleSOS,
  requestBodyDoubleReflection,
} from '../services/geminiService';
import { ambientAudio, AmbientSoundType } from '../services/ambientAudioService';
import { saveJournalEntry } from '../services/storageService';
import { logUserActivity } from '../services/userStatsService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

const getPersonas = (lang: string): BodyDoublePersona[] => [
  {
    id: 'alex',
    name: lang === 'en' ? 'Alex' : 'Алекс',
    title:
      lang === 'en'
        ? 'Focus Peer (Tech & Logic)'
        : lang === 'ru'
        ? 'Фокус-коллега (Tech & Logic)'
        : 'Фокус-колега (Tech & Logic)',
    description:
      lang === 'en'
        ? 'Calm developer-analyst. Quietly works on their project beside you, maintaining a steady, productive rhythm.'
        : lang === 'ru'
        ? 'Спокойный разработчик-аналитик. Работает молча рядом над своим проектом, поддерживая устойчивый рабочий ритм.'
        : 'Спокійний розробник-аналітик. Працює мовчки поруч над своїм проєктом, тримаючи стабільний робочий ритм.',
    avatarEmoji: '🧑‍💻',
    focusStyle:
      lang === 'en'
        ? 'Silent grounded presence & clear accountability'
        : lang === 'ru'
        ? 'Тихое устойчивое присутствие и логическая подотчетность'
        : 'Тиха непорушна присутність та логічна підзвітність',
    currentActivityStatus:
      lang === 'en'
        ? [
            'Alex is focused on writing code beside you...',
            'Alex cross-checks their notes in the notebook...',
            'Alex takes a sip of coffee and nods: "Keep the momentum"',
            'Alex reviews diagrams, keeping a silent space for your focus...',
            'Alex is immersed in deep work, radiating calm productivity...',
          ]
        : lang === 'ru'
        ? [
            'Алекс сосредоточенно пишет код рядом...',
            'Алекс сверяет заметки в блокноте...',
            'Алекс делает глоток кофе и кивает тебе: «Держим темп»',
            'Алекс внимательно анализирует схему и молча держит твой фокус...',
            'Алекс погружен в задачу, создавая атмосферу чистой продуктивности...',
          ]
        : [
            'Алекс зосереджено пише код поруч...',
            'Алекс перевіряє свої нотатки у блокноті...',
            'Алекс робить ковток кави і киває тобі: «Тримаємо темп»',
            'Алекс уважно аналізує діаграми і мовчки підтримує твій фокус...',
            'Алекс занурений у задачу, створюючи простір чистої продуктивності...',
          ],
  },
  {
    id: 'maya',
    name: lang === 'en' ? 'Maya' : 'Майя',
    title:
      lang === 'en'
        ? 'Zen Partner (Anti-Anxiety & Mindful)'
        : lang === 'ru'
        ? 'Zen-напарница (Anti-Anxiety & Mindful)'
        : 'Zen-напарниця (Anti-Anxiety & Mindful)',
    description:
      lang === 'en'
        ? 'Gentle, supportive partner. Helps dissolve imposter syndrome, perfectionism, and fear of mistakes.'
        : lang === 'ru'
        ? 'Мягкая, поддерживающая напарница. Помогает снять синдром самозванца, перфекционизм и страх ошибки.'
        : 'М’яка, турботлива напарниця. Допомагає зняти синдром самозванця, перфекціонізм та страх помилки.',
    avatarEmoji: '🧘‍♀️',
    focusStyle:
      lang === 'en'
        ? 'Relieving inner pressure, grounding & gentle self-kindness'
        : lang === 'ru'
        ? 'Снижение внутреннего давления, заземление и бережность к себе'
        : 'Зниження внутрішнього тиску, заземлення та доброта до себе',
    currentActivityStatus:
      lang === 'en'
        ? [
            'Maya takes a gentle mindful breath and writes in her journal...',
            'Maya gently reminds with a smile: "Drop your shoulders, no rush"',
            'Maya is quietly working on creative sketches beside you...',
            'Maya gives an encouraging nod: "Every small step counts"',
            'Maya sips herbal tea, sharing warm and tranquil presence...',
          ]
        : lang === 'ru'
        ? [
            'Майя делает мягкий осознанный вдох и делает пометку в дневнике...',
            'Майя взглядом напоминает: «Опусти плечи, никакой спешки»',
            'Майя просматривает свои скетчи рядом с тобой...',
            'Майя улыбается: «Каждый твой маленький шаг имеет ценность»',
            'Майя пьет травяной чай, транслируя теплое спокойствие...',
          ]
        : [
            'Майя робить м’який усвідомлений вдих і пише у щоденник...',
            'Майя нагадує поглядом: «Опусти плечі, жодного поспіху»',
            'Майя переглядає свої творчі ескізи поруч з тобою...',
            'Майя посміхається: «Кожен твій маленький крок має значення»',
            'Майя спокійно п’є трав’яний чай, транслюючи безтурботний спокій...',
          ],
  },
  {
    id: 'mark',
    name: lang === 'en' ? 'Mark' : 'Марк',
    title:
      lang === 'en'
        ? 'Productive Tracker (Action & Drive)'
        : lang === 'ru'
        ? 'Продуктивный трекер (Action & Drive)'
        : 'Продуктивний трекер (Action & Drive)',
    description:
      lang === 'en'
        ? 'High-energy focus partner. Helps overcome procrastination and eliminate distractions.'
        : lang === 'ru'
        ? 'Энергичный партнер по фокусу. Помогает преодолеть прокрастинацию и отсечь лишние отвлечения.'
        : 'Енергійний партнер по фокусу. Допомагає подолати прокрастинацію та відсікти зайві відволікання.',
    avatarEmoji: '🎯',
    focusStyle:
      lang === 'en'
        ? 'Crisp micro-sprints, dopamine check-offs & momentum'
        : lang === 'ru'
        ? 'Четкие микро-спринты, дофаминовые отметки и разгон инерции'
        : 'Чіткі мікро-спринти, дофамінові відмітки та подолання ліні',
    currentActivityStatus:
      lang === 'en'
        ? [
            'Mark checks off a milestone in his task tracker...',
            'Mark closes distracting tabs and flashes a thumbs-up 👍',
            'Mark is focused on refining his project report...',
            'Mark logs intermediate progress: "We are moving forward!"',
            'Mark is fully locked in flow, driving working momentum...',
          ]
        : lang === 'ru'
        ? [
            'Марк отмечает выполненный пункт в таск-трекере...',
            'Марк закрыл лишние вкладки и показывает знак одобрения 👍',
            'Марк сосредоточенно правит рабочий документ...',
            'Марк фиксирует результат: «Мы движемся вперед!»',
            'Марк в чистом потоке, заряжая рабочей энергией...',
          ]
        : [
            'Марк відмічає свій виконаний підпункт у таск-трекері...',
            'Марк закрив зайві вкладки і показує жест схвалення 👍',
            'Марк зосереджено редагує робочий звіт...',
            'Марк фіксує проміжний результат: «Ми рухаємося вперед!»',
            'Марк повністю у потоці, підтримуючи високу робочу енергію...',
          ],
  },
  {
    id: 'cat',
    name: lang === 'en' ? 'Coconut the Cat' : lang === 'ru' ? 'Кот Кокос' : 'Кіт Кокос',
    title:
      lang === 'en'
        ? 'Cozy Companion (Anti-Stress Mascot)'
        : lang === 'ru'
        ? 'Уютный дублер (Anti-Stress Mascot)'
        : 'Затишний дублер (Anti-Stress Mascot)',
    description:
      lang === 'en'
        ? 'Fluffy cat peacefully purring by your keyboard, melting away stress and anxiety.'
        : lang === 'ru'
        ? 'Пушистый кот, который мирно спит возле клавиатуры, тихо мурлычет и нейтрализует тревогу.'
        : 'Пухнастий кіт, який мирно спить біля клавіатури, тихо муркоче і нейтралізує тривогу та самотність.',
    avatarEmoji: '🐱',
    focusStyle:
      lang === 'en'
        ? 'Pure coziness, calm warmth, and psychological safety'
        : lang === 'ru'
        ? 'Абсолютный уют, тепло и ощущение безопасности в пространстве'
        : 'Абсолютний затишок, тепло і відчуття безпеки в просторі',
    currentActivityStatus:
      lang === 'en'
        ? [
            'Coconut is cozily napping by your laptop, purring softly...',
            'Coconut lazily stretches, glances at you, and dozes off 💤',
            'Coconut rests a paw near your mouse, radiating warmth...',
            'Coconut breathes evenly, calming your nervous system...',
            'Coconut flicks an ear to your typing rhythm and purrs...',
          ]
        : lang === 'ru'
        ? [
            'Кокос уютно спит возле твоего ноутбука и тихо мурлычет...',
            'Кокос лениво потянулся, взглянул на тебя и задремал дальше 💤',
            'Кокос положил лапу рядом с мышкой, даря ощущение дома...',
            'Кокос ровно дышит, мягко успокаивая нервную систему...',
            'Кокос приподнял ухо, прислушался к кликам клавиш и сладко вздохнул...',
          ]
        : [
            'Кокос затишно спить поруч з твоїм ноутбуком і тихо муркоче...',
            'Кокос ліниво потягнувся, подивився на тебе і заснув далі 💤',
            'Кокос поклав лапку біля мишки, даруючи тепле відчуття дому...',
            'Кокос спокійно дихає, заспокоюючи твою нервову систему...',
            'Кокос підняв вушко, прислухався до твого клацання клавіш і зітхнув...',
          ],
  },
];

interface BodyDoublerToolProps {
  initialTask?: string;
  sourceContext?: string;
  initialTimeframe?: '15' | '25' | '45' | '60';
  onNavigateToTab?: (tab: any) => void;
  onSavedToJournal?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const BodyDoublerTool: React.FC<BodyDoublerToolProps> = ({
  initialTask = '',
  sourceContext = '',
  initialTimeframe = '25',
  onNavigateToTab,
  onSavedToJournal,
  isModal = false,
  onCloseModal,
}) => {
  const { lang, t } = useThemeLanguage();

  // Step state: 'setup' | 'session' | 'reflection'
  const [sessionStage, setSessionStage] = useState<'setup' | 'session' | 'reflection'>('setup');

  // Configuration
  const [taskTitle, setTaskTitle] = useState(initialTask);
  const [durationMinutes, setDurationMinutes] = useState<number>(Number(initialTimeframe) || 25);
  const [selectedPersonaId, setSelectedPersonaId] = useState<BodyDoublePersonaId>('alex');
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('rain');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.3);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Micro-steps
  const [microSteps, setMicroSteps] = useState<BodyDoubleMicroStep[]>([]);
  const [newStepText, setNewStepText] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [welcomingNote, setWelcomingNote] = useState('');
  const [focusAnchorTip, setFocusAnchorTip] = useState('');

  // Active Session Timer
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live status from the Body
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  // SOS state
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosAdvice, setSosAdvice] = useState<{
    reassuringMessage: string;
    groundingAction: string;
    next60SecondsFocus: string;
  } | null>(null);

  // Reflection stage
  const [reflectionLoading, setReflectionLoading] = useState(false);
  const [reflectionData, setReflectionData] = useState<{
    coachingSummary: string;
    reflectionQuestions: string[];
    closingDopamineAffirmation: string;
  } | null>(null);
  const [userReflectionNotes, setUserReflectionNotes] = useState('');
  const [difficultyRating, setDifficultyRating] = useState<number>(3);
  const [energyRating, setEnergyRating] = useState<number>(4);
  const [isJournalSaved, setIsJournalSaved] = useState(false);

  const personas = getPersonas(lang);
  const selectedPersona = personas.find((p) => p.id === selectedPersonaId) || personas[0];

  // Initialize or update initialTask if passed from Navigator
  useEffect(() => {
    if (initialTask && initialTask !== taskTitle) {
      setTaskTitle(initialTask);
    }
  }, [initialTask]);

  // Clean up ambient audio on unmount
  useEffect(() => {
    return () => {
      ambientAudio.stopAmbient();
    };
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any = null;
    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

  // Cycle body partner status every 18 seconds during session
  useEffect(() => {
    if (sessionStage !== 'session') return;
    const interval = setInterval(() => {
      setCurrentStatusIndex((prev) => (prev + 1) % selectedPersona.currentActivityStatus.length);
    }, 18000);
    return () => clearInterval(interval);
  }, [sessionStage, selectedPersona]);

  // Ambient sound handling
  const handleToggleAmbient = (type: AmbientSoundType) => {
    if (ambientSound === type && !isAudioMuted) {
      ambientAudio.stopAmbient();
      setAmbientSound('none');
    } else {
      setAmbientSound(type);
      setIsAudioMuted(false);
      ambientAudio.playAmbient(type);
      ambientAudio.setVolume(ambientVolume);
    }
  };

  const handleToggleMute = () => {
    const muted = ambientAudio.toggleMute();
    setIsAudioMuted(muted);
  };

  const handleVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    ambientAudio.setVolume(newVol);
  };

  // 1. Decompose Task with AI
  const handleDecomposeWithAI = async () => {
    if (!taskTitle.trim()) return;
    setIsDecomposing(true);
    try {
      const res = await requestBodyDoubleDecompose({
        taskTitle: taskTitle.trim(),
        context: sourceContext,
        durationMinutes,
        personaName: selectedPersona.name,
        lang,
      });

      setWelcomingNote(res.welcomingNote);
      setFocusAnchorTip(res.focusAnchorTip);

      const generatedSteps: BodyDoubleMicroStep[] = (res.dopamineMicroSteps || []).map(
        (text, idx) => ({
          id: `step_${Date.now()}_${idx}`,
          text,
          completed: false,
        })
      );

      setMicroSteps(generatedSteps);
    } catch (e) {
      console.error('Failed to decompose task', e);
    } finally {
      setIsDecomposing(false);
    }
  };

  // Add custom micro-step
  const handleAddCustomStep = () => {
    if (!newStepText.trim()) return;
    const newStep: BodyDoubleMicroStep = {
      id: `step_${Date.now()}`,
      text: newStepText.trim(),
      completed: false,
    };
    setMicroSteps((prev) => [...prev, newStep]);
    setNewStepText('');
  };

  // Toggle step completion
  const handleToggleStep = (stepId: string) => {
    setMicroSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          const nextState = !step.completed;
          if (nextState) {
            ambientAudio.playChime(true);
          }
          return { ...step, completed: nextState };
        }
        return step;
      })
    );
  };

  // 2. Start Session
  const handleStartSession = () => {
    if (!taskTitle.trim()) return;

    // If no micro-steps, add a default one
    if (microSteps.length === 0) {
      setMicroSteps([
        {
          id: `step_${Date.now()}`,
          text: taskTitle.trim(),
          completed: false,
        },
      ]);
    }

    setRemainingSeconds(durationMinutes * 60);
    setElapsedSeconds(0);
    setSessionStartTime(Date.now());
    setIsRunning(true);
    setSessionStage('session');

    // Start ambient audio if selected
    if (ambientSound !== 'none') {
      ambientAudio.playAmbient(ambientSound);
      ambientAudio.setVolume(ambientVolume);
    }
  };

  // Timer complete
  const handleTimerComplete = () => {
    setIsRunning(false);
    ambientAudio.stopAmbient();
    ambientAudio.playChime(true);
    triggerReflectionStage();
  };

  // 3. SOS Trigger
  const handleTriggerSOS = async () => {
    setIsSosOpen(true);
    setSosLoading(true);
    try {
      const activeStep = microSteps.find((s) => !s.completed)?.text || taskTitle;
      const res = await requestBodyDoubleSOS({
        taskTitle,
        currentStep: activeStep,
        issueType: 'Втрата концентрації або напад прокрастинації',
        personaName: selectedPersona.name,
        lang,
      });
      setSosAdvice(res);
    } catch (e) {
      console.error('SOS failed', e);
    } finally {
      setSosLoading(false);
    }
  };

  // 4. Trigger Reflection Stage (on request or session finish)
  const triggerReflectionStage = async () => {
    setIsRunning(false);
    ambientAudio.stopAmbient();
    setSessionStage('reflection');
    setReflectionLoading(true);

    try {
      const completedCount = microSteps.filter((s) => s.completed).length;
      const actualMins = Math.max(1, Math.round(elapsedSeconds / 60));

      const res = await requestBodyDoubleReflection({
        taskTitle,
        completedStepsCount: completedCount,
        totalStepsCount: microSteps.length,
        durationMinutes: actualMins,
        userFeedback: '',
        lang,
      });
      setReflectionData(res);
    } catch (e) {
      console.error('Reflection prompt failed', e);
    } finally {
      setReflectionLoading(false);
    }
  };

  // 5. Save Session to Journal
  const handleSaveToJournal = () => {
    const completedCount = microSteps.filter((s) => s.completed).length;
    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60));

    const sessionData: BodyDoubleSessionData = {
      id: `bd_${Date.now()}`,
      taskTitle,
      sourceContext,
      personaId: selectedPersona.id,
      personaName: selectedPersona.name,
      durationMinutes,
      actualDurationMinutes: actualMins,
      completedStepsCount: completedCount,
      totalStepsCount: microSteps.length,
      microSteps,
      selfReflectionNotes: userReflectionNotes,
      difficultyRating,
      energyAfterSession: energyRating,
      status: 'completed',
      date: new Date().toISOString(),
    };

    saveJournalEntry({
      type: 'bodyDouble',
      title: `🤝 Боді-дублер: ${taskTitle.slice(0, 50)}`,
      summary: `Сесія фокусу (${actualMins} хв) з напарником ${selectedPersona.name}. Виконано ${completedCount}/${microSteps.length} мікро-кроків.`,
      data: sessionData,
    });

    logUserActivity({
      tab: 'bodyDouble',
      toolName: 'Body Doubler Focus Session',
      querySummary: `Фокус-сесія: ${taskTitle} (${actualMins} хв, партнер: ${selectedPersona.name})`,
      category: 'Productivity & Focus',
    });

    setIsJournalSaved(true);
    if (onSavedToJournal) {
      onSavedToJournal();
    }
    window.dispatchEvent(new CustomEvent('journal_cloud_synced'));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((durationMinutes * 60 - remainingSeconds) / (durationMinutes * 60)) * 100))
  );

  return (
    <div className={`mx-auto max-w-5xl space-y-6 ${isModal ? 'p-2' : 'p-4 sm:p-6'}`}>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-stone-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/40 px-3 py-1 text-xs font-bold text-indigo-300">
              <Users className="h-3.5 w-3.5" />
              <span>
                {lang === 'en'
                  ? 'Body Doubling Technique (Co-working)'
                  : lang === 'ru'
                  ? 'Техника «Body Doubling» (Тело-дублер)'
                  : 'Техніка «Body Doubling» (Тіло-дублер)'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
              {lang === 'ru'
                ? 'Фокус-сессия с Боди-дублером'
                : lang === 'en'
                ? 'Body Doubling Focus Companion'
                : 'Фокус-сесія з Боді-дублером'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              {lang === 'ru'
                ? 'Научный метод преодоления прокрастинации и СДВГ-ступора. Работайте над сложной задачей плечом к плечу с виртуальным дублером: социальная подотчетность, дофаминовое дробление задач и вопросы для глубокой саморефлексии.'
                : lang === 'en'
                ? 'The scientifically validated method for overcoming ADHD task paralysis and procrastination. Tackle demanding work alongside a supportive body double: silent accountability, micro-step breakdowns, and deep reflection prompts.'
                : 'Науковий метод подолання прокрастинації, рутини та СДУГ-ступору. Виконуйте складну або нудну задачу пліч-о-пліч з віртуальним дублером: соціальна підзвітність, дофамінове дроблення кроків та питання для чесної саморефлексії.'}
            </p>
          </div>

          {isModal && onCloseModal && (
            <button
              onClick={onCloseModal}
              className="self-start md:self-center px-4 py-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 text-xs font-bold border border-stone-600 transition-colors cursor-pointer"
            >
              ✕ {lang === 'en' ? 'Close' : lang === 'ru' ? 'Закрыть' : 'Закрити'}
            </button>
          )}
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* STAGE 1: SETUP & TASK FRAMING */}
      {sessionStage === 'setup' && (
        <div className="space-y-6">
          {/* 1. Task Definition */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <span>
                  {lang === 'en'
                    ? '1. Focus task or step from Navigator for this session:'
                    : lang === 'ru'
                    ? '1. Задача или шаг из Навигатора для этой сессии:'
                    : '1. Задача або крок з Навігатора для цієї сесії:'}
                </span>
              </label>
              {sourceContext && (
                <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                  {lang === 'en' ? 'Imported from Navigator' : lang === 'ru' ? 'Импортировано из Навигатора' : 'Імпортовано з Навігатора'}
                </span>
              )}
            </div>

            <textarea
              rows={2}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'e.g., Draft the executive summary, make 3 client follow-up calls, clean up messy code...'
                  : lang === 'ru'
                  ? 'Например: Написать структуру отчета, сделать 3 звонка, навести порядок в коде...'
                  : 'Наприклад: Написати вступну частину звіту, зробити перший дзвінок, розібрати вхідні...'
              }
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {/* Duration Selector */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 block">
                {lang === 'en'
                  ? 'Focus Sprint Duration:'
                  : lang === 'ru'
                  ? 'Длительность фокус-спринта:'
                  : 'Тривалість фокус-спринту:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    mins: 15,
                    label: lang === 'en' ? '15 min' : lang === 'ru' ? '15 мин' : '15 хв',
                    sub: lang === 'en' ? 'Blitz start (break inertia)' : lang === 'ru' ? 'Блиц-старт (снять ступор)' : 'Бліц-старт (зняти ступор)',
                  },
                  {
                    mins: 25,
                    label: lang === 'en' ? '25 min' : lang === 'ru' ? '25 мин' : '25 хв',
                    sub: lang === 'en' ? 'Classic Pomodoro' : lang === 'ru' ? 'Классический Помодоро' : 'Класичний Помодоро',
                  },
                  {
                    mins: 45,
                    label: lang === 'en' ? '45 min' : lang === 'ru' ? '45 мин' : '45 хв',
                    sub: lang === 'en' ? 'Deep Work immersion' : lang === 'ru' ? 'Глубокая работа' : 'Глибока робота',
                  },
                  {
                    mins: 60,
                    label: lang === 'en' ? '60 min' : lang === 'ru' ? '60 мин' : '60 хв',
                    sub: lang === 'en' ? 'Strategic Focus block' : lang === 'ru' ? 'Стратегический блок' : 'Стратегічний блок',
                  },
                ].map((item) => (
                  <button
                    key={item.mins}
                    type="button"
                    onClick={() => setDurationMinutes(item.mins)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      durationMinutes === item.mins
                        ? 'border-indigo-500 bg-indigo-500/15 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold">{item.label}</span>
                      <Clock className="h-3.5 w-3.5 opacity-60" />
                    </div>
                    <span className="text-[11px] opacity-75 block mt-0.5">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Choose Persona */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-3">
            <label className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <span>
                {lang === 'en'
                  ? '2. Choose your Body Doubling companion:'
                  : lang === 'ru'
                  ? '2. Выберите вашего Боди-дублера:'
                  : '2. Оберіть вашого Боді-дублера:'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {personas.map((persona) => {
                const isSelected = selectedPersonaId === persona.id;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelectedPersonaId(persona.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-gradient-to-b from-indigo-50/80 to-white dark:from-indigo-950/50 dark:to-stone-900 ring-2 ring-indigo-500/40 shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/50 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{persona.avatarEmoji}</span>
                        {isSelected && (
                          <span className="rounded-full bg-indigo-500 text-white p-1">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                        {persona.name}
                      </div>
                      <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {persona.title}
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
                        {persona.description}
                      </p>
                    </div>

                    <div className="text-[10px] text-stone-500 dark:text-stone-500 border-t border-stone-200 dark:border-stone-800/80 pt-2 italic">
                      ✨ {persona.focusStyle}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Micro-Steps & AI Deconstruction */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span>
                    {lang === 'en'
                      ? '3. Dopamine Micro-Steps (Micro-Actions):'
                      : lang === 'ru'
                      ? '3. Дофаминовые микро-шаги (Micro-Actions):'
                      : '3. Дофамінові мікро-кроки (Micro-Actions):'}
                  </span>
                </label>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {lang === 'en'
                    ? 'ADHD hack: Make the first step ridiculously tiny so your inner critic has no time to trigger resistance.'
                    : lang === 'ru'
                    ? 'СДВГ-хак: первый шаг должен быть настолько крошечным, чтобы внутренний критик не успел включить саботаж.'
                    : 'СДУГ-хак: перший крок має бути настільки крихітним, щоб внутрішній критик не встиг заблокувати старт.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDecomposeWithAI}
                disabled={isDecomposing || !taskTitle.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-800 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>
                  {isDecomposing
                    ? lang === 'en'
                      ? 'Decomposing steps...'
                      : lang === 'ru'
                      ? 'Разбиваем на шаги...'
                      : 'Розбиваємо на кроки...'
                    : lang === 'en'
                    ? 'Break into micro-steps with Body'
                    : lang === 'ru'
                    ? 'Разбить на микро-шаги с Боди'
                    : 'Розбити на мікро-кроки з Боді'}
                </span>
              </button>
            </div>

            {welcomingNote && (
              <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/30 p-3.5 flex items-start gap-3">
                <span className="text-xl">{selectedPersona.avatarEmoji}</span>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300">
                    {selectedPersona.name}:
                  </span>
                  <p className="text-stone-800 dark:text-stone-200 italic leading-relaxed">
                    «{welcomingNote}»
                  </p>
                  {focusAnchorTip && (
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-semibold pt-1">
                      💡 {focusAnchorTip}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Steps List */}
            <div className="space-y-2">
              {microSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-bold text-stone-400 text-[11px]">#{idx + 1}</span>
                    <span className="text-stone-800 dark:text-stone-200 font-medium">{step.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMicroSteps((prev) => prev.filter((s) => s.id !== step.id))}
                    className="text-stone-400 hover:text-rose-500 text-xs px-2 py-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Add manual step input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newStepText}
                  onChange={(e) => setNewStepText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomStep()}
                  placeholder={
                    lang === 'en'
                      ? 'Add another micro-step manually...'
                      : lang === 'ru'
                      ? 'Добавить еще один микро-шаг вручную...'
                      : 'Додати ще один мікро-крок вручну...'
                  }
                  className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomStep}
                  disabled={!newStepText.trim()}
                  className="px-3 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {lang === 'en' ? '+ Add' : lang === 'ru' ? '+ Добавить' : '+ Додати'}
                </button>
              </div>
            </div>
          </div>

          {/* 4. Ambient Sound Selection */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm space-y-3">
            <label className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Radio className="h-4 w-4 text-teal-500" />
              <span>
                {lang === 'en'
                  ? '4. Background Soundscape (Synthesized Web Audio):'
                  : lang === 'ru'
                  ? '4. Фоновый звуковой эмбиент (Web Audio Synthesis):'
                  : '4. Фоновий звуковий ембієнт (Web Audio Synthesis):'}
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              {[
                {
                  type: 'rain',
                  label: lang === 'en' ? '🌧️ Gentle Rain' : lang === 'ru' ? '🌧️ Теплый дождь' : '🌧️ Теплий дощ',
                },
                {
                  type: 'coffee',
                  label: lang === 'en' ? '☕ Cozy Cafe' : lang === 'ru' ? '☕ Уютная кофейня' : '☕ Затишна кавʼярня',
                },
                {
                  type: 'whitenoise',
                  label: lang === 'en' ? '📻 Pink Noise (ADHD)' : lang === 'ru' ? '📻 Розовый шум (СДВГ)' : '📻 Рожевий шум (СДУГ)',
                },
                {
                  type: 'flow',
                  label: lang === 'en' ? '🧘 432Hz Alpha Waves' : lang === 'ru' ? '🧘 432Hz Альфа-волны' : '🧘 432Hz Альфа-хвилі',
                },
                {
                  type: 'none',
                  label: lang === 'en' ? '🔇 Complete Silence' : lang === 'ru' ? '🔇 Полная тишина' : '🔇 Повна тиша',
                },
              ].map((snd) => (
                <button
                  key={snd.type}
                  type="button"
                  onClick={() => handleToggleAmbient(snd.type as AmbientSoundType)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    ambientSound === snd.type
                      ? 'border-teal-500 bg-teal-500/20 text-teal-900 dark:text-teal-200 ring-1 ring-teal-500/40'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                  }`}
                >
                  {snd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleStartSession}
              disabled={!taskTitle.trim()}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold text-base shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>
                {lang === 'en'
                  ? `Start Focus Session (${durationMinutes} min) with ${selectedPersona.name}`
                  : lang === 'ru'
                  ? `Начать сессию (${durationMinutes} мин) с ${selectedPersona.name}`
                  : `Почати сесію (${durationMinutes} хв) з ${selectedPersona.name}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: ACTIVE FOCUS SESSION */}
      {sessionStage === 'session' && (
        <div className="space-y-6">
          {/* Main Focus Room */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Body Doubler Live Presence Screen (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl border-2 border-indigo-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-stone-950 p-6 text-white shadow-2xl flex flex-col justify-between gap-6 relative overflow-hidden">
              <div className="space-y-4">
                {/* Status Bar */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-[11px] font-bold text-emerald-400 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>
                      {lang === 'en'
                        ? 'Body Online • Session Active'
                        : lang === 'ru'
                        ? 'Боди на связи • Сессия активна'
                        : 'Боді на звʼязку • Сесія активна'}
                    </span>
                  </div>
                  <span className="text-xs text-stone-400 font-mono">
                    {formatTime(remainingSeconds)}
                  </span>
                </div>

                {/* Avatar Visual & Presence */}
                <div className="flex flex-col items-center justify-center py-6 space-y-3">
                  <div className="relative">
                    <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border-2 border-indigo-400/40 flex items-center justify-center text-6xl shadow-inner animate-pulse">
                      {selectedPersona.avatarEmoji}
                    </div>
                    {/* Breath pulse indicator */}
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-400/30 animate-ping opacity-40 pointer-events-none" />
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-extrabold text-white">{selectedPersona.name}</h3>
                    <p className="text-xs text-indigo-300 font-medium">{selectedPersona.title}</p>
                  </div>
                </div>

                {/* Live Activity Status Bubble */}
                <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
                    <span>
                      {lang === 'en'
                        ? 'Companion Activity:'
                        : lang === 'ru'
                        ? 'Текущее действие напарника:'
                        : 'Поточна дія напарника:'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-200 font-medium italic leading-relaxed">
                    «{selectedPersona.currentActivityStatus[currentStatusIndex]}»
                  </p>
                </div>
              </div>

              {/* Ambient Sound Bar */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-300 font-semibold flex items-center gap-1.5">
                    {ambientSound === 'rain' && <CloudRain className="h-3.5 w-3.5 text-teal-400" />}
                    {ambientSound === 'coffee' && <Coffee className="h-3.5 w-3.5 text-amber-400" />}
                    {ambientSound === 'whitenoise' && <Radio className="h-3.5 w-3.5 text-sky-400" />}
                    {ambientSound === 'flow' && <Sparkles className="h-3.5 w-3.5 text-purple-400" />}
                    {ambientSound === 'none' && <VolumeX className="h-3.5 w-3.5 text-stone-400" />}
                    <span>
                      {lang === 'en'
                        ? `Soundscape (${ambientSound})`
                        : lang === 'ru'
                        ? `Звуковой фон (${ambientSound})`
                        : `Звуковий фон (${ambientSound})`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleMute}
                    className="p-1 text-stone-400 hover:text-white cursor-pointer"
                  >
                    {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* SOS Rescue Button */}
              <button
                type="button"
                onClick={handleTriggerSOS}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs transition-all cursor-pointer"
              >
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>
                  {lang === 'en'
                    ? '🆘 Stuck in paralysis? Inner critic flare-up'
                    : lang === 'ru'
                    ? '🆘 В ступоре? Включился внутренний критик'
                    : '🆘 Застряг? Втратив фокус чи напав критик'}
                </span>
              </button>
            </div>

            {/* Right Column: Timer & Micro-Tasks (7 cols) */}
            <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
              {/* Timer & Controls Card */}
              <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      {lang === 'en' ? 'Focus Objective' : lang === 'ru' ? 'Фокусная задача' : 'Фокусна задача'}
                    </span>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                      {taskTitle}
                    </h2>
                  </div>

                  {/* Progress Badge */}
                  <div className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {lang === 'en'
                      ? `${progressPercent}% complete`
                      : lang === 'ru'
                      ? `${progressPercent}% выполнено`
                      : `${progressPercent}% виконано`}
                  </div>
                </div>

                {/* Big Timer Display */}
                <div className="flex flex-col items-center justify-center py-4 space-y-3">
                  <div className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono text-stone-900 dark:text-stone-100">
                    {formatTime(remainingSeconds)}
                  </div>

                  {/* Progress Line */}
                  <div className="w-full max-w-md h-2.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRunning(!isRunning)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
                  >
                    {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                    <span>
                      {isRunning
                        ? lang === 'en'
                          ? 'Pause'
                          : lang === 'ru'
                          ? 'Пауза'
                          : 'Пауза'
                        : lang === 'en'
                        ? 'Resume'
                        : lang === 'ru'
                        ? 'Продолжить'
                        : 'Продовжити'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRemainingSeconds(durationMinutes * 60)}
                    className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
                    title={lang === 'en' ? 'Reset timer' : lang === 'ru' ? 'Сбросить таймер' : 'Скинути таймер'}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={triggerReflectionStage}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {lang === 'en'
                        ? 'Finish & Reflect'
                        : lang === 'ru'
                        ? 'Завершить и подвести итоги'
                        : 'Завершити та підсумувати'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Micro-Tasks Interactive Checklist */}
              <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 shadow-sm space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                    <span>
                      {lang === 'en'
                        ? 'Session Micro-Steps:'
                        : lang === 'ru'
                        ? 'Микро-шаги этой сессии:'
                        : 'Мікро-кроки цієї сесії:'}
                    </span>
                  </h3>
                  <span className="text-xs text-stone-500 font-medium">
                    {lang === 'en'
                      ? `${microSteps.filter((s) => s.completed).length} of ${microSteps.length} done`
                      : lang === 'ru'
                      ? `${microSteps.filter((s) => s.completed).length} из ${microSteps.length} сделано`
                      : `${microSteps.filter((s) => s.completed).length} з ${microSteps.length} зроблено`}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {microSteps.map((step) => (
                    <div
                      key={step.id}
                      onClick={() => handleToggleStep(step.id)}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        step.completed
                          ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-stone-500 line-through'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 text-stone-800 dark:text-stone-200 hover:border-indigo-400'
                      }`}
                    >
                      <button
                        type="button"
                        className="mt-0.5 cursor-pointer text-indigo-600 dark:text-indigo-400"
                      >
                        {step.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-stone-400" />
                        )}
                      </button>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed flex-1">
                        {step.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Prompt on-demand reflection button */}
                <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center">
                  <span className="text-[11px] text-stone-500">
                    {lang === 'en'
                      ? 'Need a reflection pause right now?'
                      : lang === 'ru'
                      ? 'Нужна пауза на рефлексию прямо сейчас?'
                      : 'Потрібна пауза на рефлексію просто зараз?'}
                  </span>
                  <button
                    type="button"
                    onClick={triggerReflectionStage}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Self-Reflection Prompts'
                        : lang === 'ru'
                        ? 'Вопросы для саморефлексии'
                        : 'Запитання для саморефлексії'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SOS Modal Dialog */}
          {isSosOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-lg rounded-3xl border border-amber-500/40 bg-stone-900 p-6 text-white shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                    <ShieldAlert className="h-5 w-5" />
                    <span>
                      {lang === 'en'
                        ? `Emergency Rescue Support from ${selectedPersona.name}`
                        : lang === 'ru'
                        ? `Экстренная поддержка от ${selectedPersona.name}`
                        : `Екстрена підтримка від ${selectedPersona.name}`}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSosOpen(false)}
                    className="text-stone-400 hover:text-white text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {sosLoading ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="inline-block h-6 w-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-stone-400">
                      {lang === 'en'
                        ? `${selectedPersona.name} is formulating a gentle prompt to restore focus...`
                        : lang === 'ru'
                        ? `${selectedPersona.name} формулирует мягкую подсказку для возвращения фокуса...`
                        : `${selectedPersona.name} формулює мʼяку підказку для повернення фокусу...`}
                    </p>
                  </div>
                ) : (
                  sosAdvice && (
                    <div className="space-y-4 text-xs">
                      <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 leading-relaxed">
                        <span className="font-bold block text-amber-300 mb-1">
                          💛 {selectedPersona.name} {lang === 'en' ? 'says:' : lang === 'ru' ? 'говорит:' : 'каже:'}
                        </span>
                        {sosAdvice.reassuringMessage}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-stone-800/80 border border-stone-700 text-stone-200 leading-relaxed">
                        <span className="font-bold text-teal-300 block mb-1">
                          🌿 {lang === 'en' ? 'Somatic Grounding:' : lang === 'ru' ? 'Телесное заземление:' : 'Тілесне заземлення:'}
                        </span>
                        {sosAdvice.groundingAction}
                      </div>

                      <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 leading-relaxed">
                        <span className="font-bold text-indigo-300 block mb-1">
                          ⚡ {lang === 'en' ? 'Micro-Action for the next 60 seconds:' : lang === 'ru' ? 'Микро-шаг на следующие 60 секунд:' : 'Мікро-рух на наступні 60 секунд:'}
                        </span>
                        {sosAdvice.next60SecondsFocus}
                      </div>
                    </div>
                  )
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSosOpen(false)}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
                  >
                    {lang === 'en' ? 'Return to session 🤝' : lang === 'ru' ? 'Возвращаюсь в сессию 🤝' : 'Повертаюся в сесію 🤝'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STAGE 3: SELF-REFLECTION & CELEBRATION */}
      {sessionStage === 'reflection' && (
        <div className="space-y-6">
          <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-50/40 via-white to-stone-50 dark:from-emerald-950/30 dark:via-stone-900 dark:to-stone-950 p-6 sm:p-8 shadow-xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>
                    {lang === 'en'
                      ? 'Session Complete • Experience Integration'
                      : lang === 'ru'
                      ? 'Сессия завершена • Фиксация опыта'
                      : 'Сесія завершена • Фіксація досвіду'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-serif">
                  {lang === 'en'
                    ? 'Self-Reflection Prompts from your Body Double'
                    : lang === 'ru'
                    ? 'Вопросы для Саморефлексии от Боди-дублера'
                    : 'Питання для Саморефлексії від Боді-дублера'}
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {lang === 'en' ? 'Task: ' : lang === 'ru' ? 'Задача: ' : 'Задача: '}
                  <span className="font-bold text-stone-900 dark:text-stone-200">{taskTitle}</span>{' '}
                  ({lang === 'en' ? 'partner: ' : lang === 'ru' ? 'партнер: ' : 'партнер: '}
                  {selectedPersona.name})
                </p>
              </div>

              {/* Save to Journal Button */}
              <button
                type="button"
                onClick={handleSaveToJournal}
                disabled={isJournalSaved}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold shadow-md transition-all cursor-pointer ${
                  isJournalSaved
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isJournalSaved ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{t('btn_saved', 'Збережено в Журнал!')}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    <span>{t('btn_save_to_journal', 'Зберегти в Щоденник')}</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Coaching Summary & Praise */}
            {reflectionLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="inline-block h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-stone-500">
                  {lang === 'en'
                    ? `${selectedPersona.name} is preparing adaptive reflection questions...`
                    : lang === 'ru'
                    ? `${selectedPersona.name} готовит адаптивные вопросы для вашей саморефлексии...`
                    : `${selectedPersona.name} готує адаптивні запитання для вашої саморефлексії...`}
                </p>
              </div>
            ) : (
              reflectionData && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      <span>
                        {lang === 'en'
                          ? `Session Synthesis from ${selectedPersona.name}:`
                          : lang === 'ru'
                          ? `Синтез сессии от ${selectedPersona.name}:`
                          : `Синтез сесії від ${selectedPersona.name}:`}
                      </span>
                    </span>
                    <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
                      {reflectionData.coachingSummary}
                    </p>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 italic pt-1">
                      🌱 «{reflectionData.closingDopamineAffirmation}»
                    </div>
                  </div>

                  {/* Reflection Prompts Bank */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                      💡 {lang === 'en'
                        ? 'Experience Integration (reflect mentally or write below):'
                        : lang === 'ru'
                        ? 'Исследование опыта (ответьте мысленно или запишите ниже):'
                        : 'Дослідження досвіду (дайте відповідь подумки або запишіть нижче):'}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {reflectionData.reflectionQuestions.map((question, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 shadow-xs space-y-1.5"
                        >
                          <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                            {lang === 'en' ? `Question #${idx + 1}` : lang === 'ru' ? `Вопрос #${idx + 1}` : `Питання #${idx + 1}`}
                          </span>
                          <p className="text-xs text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                            {question}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* User Notes Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  {lang === 'en'
                    ? 'Your insights, observations, and sensations after the session:'
                    : lang === 'ru'
                    ? 'Ваши инсайты, заметки и мысли после сессии:'
                    : 'Ваші інсайти, нотатки та відчуття після сесії:'}
                </span>
              </label>
              <textarea
                rows={4}
                value={userReflectionNotes}
                onChange={(e) => setUserReflectionNotes(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'What worked best? What sensations in the body right now? What is the next immediate micro-step...'
                    : lang === 'ru'
                    ? 'Что сработало лучше всего? Какое ощущение в теле? Что сделаю следующим шагом...'
                    : 'Що спрацювало найкраще? Що відчуває тіло зараз? Який наступний найменший крок...'
                }
                className="w-full rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 p-4 text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Ratings: Difficulty & Energy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-200 dark:border-stone-800 pt-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {lang === 'en'
                    ? 'Difficulty overcoming inertia:'
                    : lang === 'ru'
                    ? 'Сложность преодоления инерции:'
                    : 'Складність подолання інерції:'}
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficultyRating(lvl)}
                      className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                        difficultyRating === lvl
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {lvl}{' '}
                      {lvl === 1
                        ? lang === 'en'
                          ? 'Easy'
                          : lang === 'ru'
                          ? 'Легко'
                          : 'Легко'
                        : lvl === 5
                        ? lang === 'en'
                          ? 'Hard'
                          : lang === 'ru'
                          ? 'Трудно'
                          : 'Важко'
                        : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  {lang === 'en'
                    ? 'Energy level after session:'
                    : lang === 'ru'
                    ? 'Уровень энергии после сессии:'
                    : 'Рівень енергії після сесії:'}
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setEnergyRating(lvl)}
                      className={`px-3 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
                        energyRating === lvl
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {lvl}{' '}
                      {lvl === 1
                        ? lang === 'en'
                          ? 'Drained'
                          : lang === 'ru'
                          ? 'Истощен'
                          : 'Виснажений'
                        : lvl === 5
                        ? lang === 'en'
                          ? 'Energized'
                          : lang === 'ru'
                          ? 'Подъем'
                          : 'Піднесений'
                        : ''}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => {
                  setSessionStage('setup');
                  setIsJournalSaved(false);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-colors cursor-pointer"
              >
                {lang === 'en'
                  ? '+ New Focus Session with Body'
                  : lang === 'ru'
                  ? '+ Новая фокус-сессия с Боди'
                  : '+ Нова фокус-сесія з Боді'}
              </button>

              {onNavigateToTab && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('consilium')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-800 dark:text-teal-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Return to Navigator'
                        : lang === 'ru'
                        ? 'Вернуться в Навигатор'
                        : 'Повернутися в Навігатор'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToTab('journal')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-800 dark:text-indigo-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'View Journal'
                        : lang === 'ru'
                        ? 'Открыть Дневник'
                        : 'Переглянути Щоденник'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BodyDoublerTool;
