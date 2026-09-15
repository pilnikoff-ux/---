import React, { useState } from 'react';
import {
  PieChart,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldAlert,
  Bookmark,
  RefreshCw,
  Sliders,
  CheckCircle2,
  HelpCircle,
  Activity,
  Heart,
  Briefcase,
  Coins,
  Home,
  BookOpen,
  Palmtree,
  Compass,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  AlertTriangle,
  BatteryCharging,
  ArrowRight,
  Lightbulb,
  Scale,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { requestWheelBalanceAnalysis } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { getUserProfile } from '../services/userStatsService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { WheelOfBalanceData, WheelSphereItem } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

interface WheelOfBalanceProps {
  onSavedToJournal?: () => void;
}

// 8 Baseline Spheres with Benchmark Visions and Reflective Guidance
const DEFAULT_SPHERES: WheelSphereItem[] = [
  {
    id: 'health',
    nameUk: 'Здоровʼя та Енергія',
    nameRu: 'Здоровье и Энергия',
    nameEn: 'Health & Vitality',
    score: 6,
    iconName: 'Activity',
    color: '#10b981', // emerald
    notes: '',
    tenPointVision: 'Бадьорий підйом без виснаження, стабільний сон 7-8 год, регулярний рух, відсутність хронічного болю, профілактичні чекапи.',
    whyNotLower: 'Тіло витримує робочі навантаження, базові аналізи в нормі, немає гострих захворювань.',
    whatNeedsForPlusOne: 'Лягати спати на 40 хв раніше та додати 20 хв щоденної ранкової розминки/прогулянки.',
  },
  {
    id: 'career',
    nameUk: 'Карʼєра та Професія',
    nameRu: 'Карьера и Профессия',
    nameEn: 'Career & Business',
    score: 7,
    iconName: 'Briefcase',
    color: '#6366f1', // indigo
    notes: '',
    tenPointVision: 'Захоплюючі задачі, відчуття авторитету й визнання, зрозуміла перспектива росту, повага колег і клієнтів.',
    whyNotLower: 'Маю стабільну експертність, регулярні професійні результати та повагу в команді.',
    whatNeedsForPlusOne: 'Чітко окреслити часові межі робочого дня і делегувати 2 рутинні завдання.',
  },
  {
    id: 'finance',
    nameUk: 'Фінанси та Достаток',
    nameRu: 'Финансы и Достаток',
    nameEn: 'Finances & Wealth',
    score: 5,
    iconName: 'Coins',
    color: '#f59e0b', // amber
    notes: '',
    tenPointVision: 'Доходи покривають комфортний рівень життя, сформована подушка безпеки на 6+ місяців, регулярні інвестиції, відсутність тривоги про гроші.',
    whyNotLower: 'Базові потреби закриті, немає прострочених критичних боргів, є стабільний грошовий потік.',
    whatNeedsForPlusOne: 'Впровадити щотижневий облік витрат і відкладати 10% одразу в день доходу.',
  },
  {
    id: 'relationships',
    nameUk: 'Стосунки та Кохання',
    nameRu: 'Отношения и Любовь',
    nameEn: 'Love & Relationship',
    score: 6,
    iconName: 'Heart',
    color: '#f43f5e', // rose
    notes: '',
    tenPointVision: 'Глибока довіра, психологічна безпека, щире прийняття, можливість бути собою без масок, спільні радості й плани.',
    whyNotLower: 'Є взаємна повага, спільна історія та вміння підтримати у скрутну хвилину.',
    whatNeedsForPlusOne: 'Організувати якісне побачення без гаджетів і щиро поговорити про почуття.',
  },
  {
    id: 'family',
    nameUk: 'Сімʼя, Дім та Побут',
    nameRu: 'Семья, Дом и Быт',
    nameEn: 'Family & Home',
    score: 7,
    iconName: 'Home',
    color: '#f97316', // orange
    notes: '',
    tenPointVision: 'Дім — місце сили та затишку, впорядкований простір, справедливий розподіл обовʼязків, теплі стосунки з рідними.',
    whyNotLower: 'Є власне безпечне житло, базовий комфорт, звʼязок із рідними підтримується.',
    whatNeedsForPlusOne: 'Розвантажити один вихідний від побутових справ і провести спільний сімейний вечір.',
  },
  {
    id: 'growth',
    nameUk: 'Особистісний Розвиток',
    nameRu: 'Личностное Развитие',
    nameEn: 'Personal Growth',
    score: 6,
    iconName: 'BookOpen',
    color: '#a855f7', // purple
    notes: '',
    tenPointVision: 'Постійне пізнання нового, читання книг, розвиток емоційного інтелекту, усвідомленість, робота з мисленням.',
    whyNotLower: 'Регулярно цікавлюся новою інформацією, проходжу навчання, аналізую власні реакції.',
    whatNeedsForPlusOne: 'Виділяти 20 хвилин на день на вдумливе читання замість бездумного скролінгу.',
  },
  {
    id: 'rest',
    nameUk: 'Відпочинок та Яскравість',
    nameRu: 'Отдых и Яркость Жизни',
    nameEn: 'Recreation & Joy',
    score: 4,
    iconName: 'Palmtree',
    color: '#0ea5e9', // sky
    notes: '',
    tenPointVision: 'Дозвілля без почуття провини, яскраві враження, улюблені хобі, подорожі, спонтанна радість і смак життя.',
    whyNotLower: 'Іноді вдається відволіктися на фільм чи прогулянку у вихідний день.',
    whatNeedsForPlusOne: 'Запланувати один повністю «розвантажувальний» день на місяць без будь-яких робочих думок.',
  },
  {
    id: 'spirituality',
    nameUk: 'Духовність, Сенси та Спокій',
    nameRu: 'Духовность, Смыслы и Покой',
    nameEn: 'Spirituality & Peace',
    score: 5,
    iconName: 'Compass',
    color: '#14b8a6', // teal
    notes: '',
    tenPointVision: 'Відчуття глибокого сенсу власного шляху, внутрішня опора, вміння зберігати душевний спокій і жити за своїми цінностями.',
    whyNotLower: 'Маю власні внутрішні моральні орієнтири, вірю в краще і ціную життя.',
    whatNeedsForPlusOne: '10 хвилин ранкової тиші чи медитації для налаштування на день перед включенням у справи.',
  },
];

const PRESETS = [
  {
    titleUk: 'Типове професійне вигорання',
    titleRu: 'Типичное профессиональное выгорание',
    titleEn: 'Workplace Burnout',
    scores: [3, 9, 7, 4, 5, 5, 2, 3],
    goalUk: 'Відновити життєві сили, зупинити хронічне виснаження та повернути час для себе.',
    goalRu: 'Восстановить жизненные силы, остановить хроническое истощение и вернуть время для себя.',
    goalEn: 'Restore vitality, halt chronic exhaustion, and reclaim personal time.',
  },
  {
    titleUk: 'Криза стосунків та побуту',
    titleRu: 'Кризис отношений и быта',
    titleEn: 'Relationship & Family Stress',
    scores: [6, 7, 6, 2, 3, 5, 4, 4],
    goalUk: 'Вирішити сімейний конфлікт, налагодити теплий контакт та взаємну підтримку.',
    goalRu: 'Разрешить семейный конфликт, наладить теплый контакт и взаимопонимание.',
    goalEn: 'Resolve domestic conflicts and rebuild warmth and mutual understanding.',
  },
  {
    titleUk: 'Пошук нового покликання / Сенсу',
    titleRu: 'Поиск нового призвания / Смысла',
    titleEn: 'Career Pivot & Meaning Search',
    scores: [7, 3, 5, 6, 6, 7, 5, 3],
    goalUk: 'Зрозуміти, куди рухатися далі у професії, та знайти справжню внутрішню мотивацію.',
    goalRu: 'Понять, куда двигаться дальше в профессии, и обрести искреннюю внутреннюю мотивацию.',
    goalEn: 'Clarify next career direction and discover authentic inner motivation.',
  },
  {
    titleUk: 'Прагнення гармонійного зростання',
    titleRu: 'Стремление к гармоничному росту',
    titleEn: 'Harmonious Growth Aspirations',
    scores: [7, 7, 6, 7, 7, 8, 6, 6],
    goalUk: 'Системно підняти якість життя без перекосів, надзусиль та вигорання.',
    goalRu: 'Системно повысить качество жизни без перекосов и жертв.',
    goalEn: 'Systematically elevate life quality sustainably and without burnout.',
  },
];

export const WheelOfBalance: React.FC<WheelOfBalanceProps> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();

  const [spheres, setSpheres] = useState<WheelSphereItem[]>(DEFAULT_SPHERES);
  const [userGoal, setUserGoal] = useState('');
  const [title, setTitle] = useState(
    lang === 'ru'
      ? 'Мое Колесо Жизненного Баланса'
      : lang === 'en'
      ? 'My Life Balance Wheel'
      : 'Моє Колесо Життєвого Балансу'
  );

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<WheelOfBalanceData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Guide and reflection states
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'rules' | 'benchmarks' | 'peseschkian'>('rules');
  const [expandedSphereId, setExpandedSphereId] = useState<string | null>(null);

  const handleScoreChange = (id: string, newScore: number) => {
    setSpheres((prev) =>
      prev.map((s) => (s.id === id ? { ...s, score: Math.max(1, Math.min(10, newScore)) } : s))
    );
  };

  const handleSphereFieldChange = (
    id: string,
    field: 'notes' | 'tenPointVision' | 'whyNotLower' | 'whatNeedsForPlusOne',
    value: string
  ) => {
    setSpheres((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setSpheres((prev) =>
      prev.map((s, idx) => ({
        ...s,
        score: preset.scores[idx] ?? s.score,
      }))
    );
    setUserGoal(lang === 'ru' ? preset.goalRu : lang === 'en' ? preset.goalEn : preset.goalUk);
    setResult(null);
    setIsSaved(false);
  };

  const calculateLocalBalanceIndex = () => {
    const scores = spheres.map((s) => s.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    // Higher average and lower deviation = higher balance score (max 100)
    const index = Math.max(10, Math.min(100, Math.round((avg / 10) * 80 + (1 - stdDev / 4.5) * 20)));
    return index;
  };

  // Deep Expert Analysis System (Fallback & local algorithmic diagnosis based on Happy Monday, Vseosvita, NewLeaf)
  const generateLocalAnalysis = () => {
    const sorted = [...spheres].sort((a, b) => a.score - b.score);
    const lowest = sorted.slice(0, 2);
    const highest = sorted.slice(-2);
    const balanceIdx = calculateLocalBalanceIndex();

    const getLocalName = (s: WheelSphereItem) => {
      if (lang === 'ru') return s.nameRu || s.nameUk;
      if (lang === 'en') return s.nameEn;
      return s.nameUk;
    };

    const deficitName = lowest.map(getLocalName).join(' & ');
    const strongName = highest.map(getLocalName).join(' & ');

    // The leverage sphere according to Paul Meyer & Happy Monday is the pivotal domain
    // If health or rest is low, it blocks everything; otherwise lowest or key energy driver
    const healthSphere = spheres.find((s) => s.id === 'health');
    const leverage = (healthSphere && healthSphere.score <= 4) ? healthSphere : lowest[0];
    const leverageName = getLocalName(leverage);

    const minScore = lowest[0].score;
    const maxScore = highest[highest.length - 1].score;
    const delta = maxScore - minScore;

    // Geometry & Rollability (Vseosvita & Happy Monday)
    let shapeName = 'Врівноважене компактне колесо';
    let rollabilityDescription = 'Форма має рівний контур. Колесо котиться плавно, без різкої тряски, хоча загальна швидкість залежить від середнього балу.';
    let frictionLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';

    if (delta >= 6) {
      shapeName = 'Асиметричний колючий їжак';
      rollabilityDescription = `Величезний розрив (${delta} балів) між проривною сферою «${strongName}» та дефіцитною «${deficitName}». На такому колесі неможливо їхати вперед: кожен оберт супроводжується сильними ударами об землю, що веде до хронічного виснаження та ризику зриву.`;
      frictionLevel = 'critical';
    } else if (delta >= 4) {
      shapeName = 'Перекошений овал із провалами';
      rollabilityDescription = `Помітний перекіс (${delta} балів). Витягування життя відбувається за рахунок гіперактивності в одних сферах, тоді як дефіцитні сфери постійно пригальмовують рух та створюють фоновий стрес.`;
      frictionLevel = 'high';
    } else if (delta === 3) {
      shapeName = 'Хвилеподібне колесо';
      rollabilityDescription = `Невеликі коливання (${delta} бали). Колесо котиться з відчутною вібрацією, але зберігає керованість. Потрібно підтягнути всього 1-2 сфери для плавності ходу.`;
      frictionLevel = 'moderate';
    }

    // Peseschkian 4 Vectors (New Leaf)
    const bodyTotal = (spheres.find((s) => s.id === 'health')?.score || 5) + (spheres.find((s) => s.id === 'rest')?.score || 5);
    const achievementTotal = (spheres.find((s) => s.id === 'career')?.score || 5) + (spheres.find((s) => s.id === 'finance')?.score || 5);
    const contactTotal = (spheres.find((s) => s.id === 'relationships')?.score || 5) + (spheres.find((s) => s.id === 'family')?.score || 5);
    const meaningTotal = (spheres.find((s) => s.id === 'growth')?.score || 5) + (spheres.find((s) => s.id === 'spirituality')?.score || 5);
    const totalScoreSum = bodyTotal + achievementTotal + contactTotal + meaningTotal || 1;

    const bodyHealthPct = Math.round((bodyTotal / totalScoreSum) * 100);
    const achievementCareerPct = Math.round((achievementTotal / totalScoreSum) * 100);
    const contactRelationshipsPct = Math.round((contactTotal / totalScoreSum) * 100);
    const futureMeaningPct = Math.max(0, 100 - (bodyHealthPct + achievementCareerPct + contactRelationshipsPct));

    const peseschkianInterpretation =
      achievementCareerPct > 35
        ? 'Явний крен у бік Діяльності та Досягнень (трудоголізм або гонитва за результатом), що виснажує Тіло та звужує простір живого контакту.'
        : bodyHealthPct < 18
        ? 'Критичний дефіцит ресурсу в Тілі та Відпочинку — організм працює в кредит і подає сигнали втоми.'
        : 'Розподіл енергії відносно збалансований між 4 векторами життя без руйнівних перекосів.';

    // Systemic Diagnosis & Compensations
    const systemicDiagnosis =
      lang === 'ru'
        ? `Анализ выявил асимметрию жизненного колеса: сильные сферы (${strongName}) сейчас несут основную нагрузку, в то время как дефицитные зоны (${deficitName}) создают скрытый отток витальной энергии. Рост возможен только через укрепление фундамента.`
        : lang === 'en'
        ? `Systemic analysis reveals energy asymmetry: high-performing domains (${strongName}) carry the primary burden, whereas deficit zones (${deficitName}) drain vital energy and create chronic friction.`
        : `Аналіз виявив асиметрію життєвого колеса: сильні сфери (${strongName}) наразі несуть надмірне навантаження, тоді як дефіцитні зони (${deficitName}) створюють прихований відтік вітальної сили. Реальне зростання можливе не через ще більшу працю, а через відновлення фундаменту.`;

    const hiddenCompensations = [
      `Висока віддача та фіксація на «${strongName}» часто слугує несвідомою психологічною втечею від невирішених викликів у «${deficitName}».`,
      `Спроба компенсувати внутрішню незадоволеність ще більшим перфекціонізмом веде до соматичної втоми.`,
      `Вторинна вигода від дефіциту в «${lowest[0].nameUk}»: це дозволяє уникати нових ризиків чи відповідальності за зміни.`,
    ];

    // Chain Reaction (Happy Monday & Paul Meyer)
    const impactedList = spheres
      .filter((s) => s.id !== leverage.id)
      .slice(0, 3)
      .map(getLocalName);

    const chainReaction = {
      leverageTarget: leverageName,
      impactedSpheres: impactedList,
      expectedImpact: `Підйом сфери «${leverageName}» всього на +1..+2 бали вивільнить енергетичний резерв, зменшить фонову тривогу та автоматично підтягне суміжні сфери (${impactedList.join(', ')}) за принципом доміно.`,
    };

    // Coaching Drive Questions (Vseosvita)
    const coachingDriveQuestions = [
      {
        question: `Чому найнижча сфера «${leverageName}» оцінена вами на ${leverage.score}, а не на 1 чи 2 бали нижче?`,
        answerInsight: `Це підтверджує наявність внутрішніх опор: ви не на нулі, базовий досвід та прагнення до покращення вже є вашим міцним ресурсом (захист від знецінення).`,
      },
      {
        question: `Яка одна дія підніме сферу «${leverageName}» всього на +1 бал уже протягом наступних днів?`,
        answerInsight: `Зосередьтеся на мінімальному реалістичному кроці (Kaizen), а не на недосяжному стрибку до 10 балів.`,
      },
      {
        question: `Які емоції виникають у вас, коли ви спостерігаєте за формою власного колеса?`,
        answerInsight: `Прийняття реального стану без самозвинувачення — це перший і найголовніший акт турботи про себе, з якого починається будь-яка трансформація.`,
      },
    ];

    // Action plan & Recommendations
    const rebalanceActionPlan = {
      immediateAction: `Виділити 15 хвилин повної тиші без гаджетів для аудиту своїх справжніх потреб у сфері «${leverageName}».`,
      shortTermPlan: `Впровадити одне захищене щотижневе вікно у календарі, присвячене виключно зміцненню «${leverageName}».`,
      habitToTransform: `Свідомо перенаправити 10% уваги та часу з перевантажених сфер у сферу «${leverageName}».`,
    };

    const recommendations = {
      rule72HoursAction: `Протягом 72 годин зробити один перший матеріальний мікрокрок у сфері «${leverageName}» (записатися, поговорити, навести лад або погуляти).`,
      smart30DaysGoal: `Підняти оцінку сфери «${leverageName}» з ${leverage.score} до ${Math.min(10, leverage.score + 2)} балів за 30 днів завдяки фіксованому щотижневому ритуалу.`,
      ecologicalBoundary: `Тимчасово послабити надконтроль і дозволити собі робити на 80% замість 100% у гіперактивних сферах.`,
      nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
        lang === 'en' ? 'en-US' : 'uk-UA',
        { day: 'numeric', month: 'long', year: 'numeric' }
      ),
    };

    const coachingInsight = `«Справжній важіль життєвого прориву схований не там, де ви вже експерт, а там, де лежить найглибша прихована втома». Зцілення сфери «${leverageName}» змінить геометрію всього вашого життя.`;

    return {
      balanceIndex: balanceIdx,
      systemicDiagnosis,
      primaryDeficitSphere: deficitName,
      leverageSphere: leverageName,
      hiddenCompensations,
      wheelShapeDiagnostic: {
        shapeName,
        rollabilityDescription,
        frictionLevel,
      },
      peseschkianBalance: {
        bodyHealthPct,
        achievementCareerPct,
        contactRelationshipsPct,
        futureMeaningPct,
        interpretation: peseschkianInterpretation,
      },
      chainReaction,
      coachingDriveQuestions,
      rebalanceActionPlan,
      recommendations,
      coachingInsight,
    };
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setIsSaved(false);

    try {
      const response = await requestWheelBalanceAnalysis({
        spheres: spheres.map((s) => ({
          id: s.id,
          nameUk: s.nameUk,
          nameEn: s.nameEn,
          score: s.score,
          notes: s.notes,
          tenPointVision: s.tenPointVision,
          whyNotLower: s.whyNotLower,
          whatNeedsForPlusOne: s.whatNeedsForPlusOne,
        })),
        userGoal,
        title,
      });

      const fallbackLocal = generateLocalAnalysis();

      const wheelData: WheelOfBalanceData = {
        id: `wheel_${Date.now()}`,
        date: new Date().toISOString(),
        title,
        spheres,
        balanceIndex: response.balanceIndex ?? fallbackLocal.balanceIndex,
        aiAnalysis: {
          systemicDiagnosis: response.systemicDiagnosis || fallbackLocal.systemicDiagnosis,
          primaryDeficitSphere: response.primaryDeficitSphere || fallbackLocal.primaryDeficitSphere,
          leverageSphere: response.leverageSphere || fallbackLocal.leverageSphere,
          hiddenCompensations: response.hiddenCompensations || fallbackLocal.hiddenCompensations,
          wheelShapeDiagnostic: response.wheelShapeDiagnostic || fallbackLocal.wheelShapeDiagnostic,
          peseschkianBalance: response.peseschkianBalance || fallbackLocal.peseschkianBalance,
          chainReaction: response.chainReaction || fallbackLocal.chainReaction,
          coachingDriveQuestions: response.coachingDriveQuestions || fallbackLocal.coachingDriveQuestions,
          rebalanceActionPlan: response.rebalanceActionPlan || fallbackLocal.rebalanceActionPlan,
          recommendations: response.recommendations || fallbackLocal.recommendations,
          coachingInsight: response.coachingInsight || fallbackLocal.coachingInsight,
        },
      };

      setResult(wheelData);
    } catch (err: any) {
      console.warn('AI analysis fell back to local expert system:', err);
      const fallbackAnalysis = generateLocalAnalysis();

      const wheelData: WheelOfBalanceData = {
        id: `wheel_${Date.now()}`,
        date: new Date().toISOString(),
        title,
        spheres,
        balanceIndex: fallbackAnalysis.balanceIndex,
        aiAnalysis: {
          systemicDiagnosis: fallbackAnalysis.systemicDiagnosis,
          primaryDeficitSphere: fallbackAnalysis.primaryDeficitSphere,
          leverageSphere: fallbackAnalysis.leverageSphere,
          hiddenCompensations: fallbackAnalysis.hiddenCompensations,
          wheelShapeDiagnostic: fallbackAnalysis.wheelShapeDiagnostic,
          peseschkianBalance: fallbackAnalysis.peseschkianBalance,
          chainReaction: fallbackAnalysis.chainReaction,
          coachingDriveQuestions: fallbackAnalysis.coachingDriveQuestions,
          rebalanceActionPlan: fallbackAnalysis.rebalanceActionPlan,
          recommendations: fallbackAnalysis.recommendations,
          coachingInsight: fallbackAnalysis.coachingInsight,
        },
      };

      setResult(wheelData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToJournal = () => {
    if (!result) return;
    const user = getUserProfile();

    saveJournalEntry({
      id: result.id,
      type: 'wheelOfBalance',
      title: result.title,
      date: result.date,
      summary: `${lang === 'ru' ? 'Индекс баланса' : lang === 'en' ? 'Balance Index' : 'Індекс балансу'}: ${result.balanceIndex}% | ${lang === 'ru' ? 'Сфера-рычаг' : lang === 'en' ? 'Leverage Sphere' : 'Сфера-важіль'}: ${result.aiAnalysis?.leverageSphere || ''}`,
      data: result,
      userId: user?.id,
    });

    setIsSaved(true);
    if (onSavedToJournal) {
      onSavedToJournal();
    }
  };

  const handleCopySummary = () => {
    if (!result || !result.aiAnalysis) return;
    const text = `🎯 ${result.title}
📊 Індекс балансу: ${result.balanceIndex}%
🚂 Сфера-Важіль («Паровоз»): ${result.aiAnalysis.leverageSphere}
📉 Зона дефіциту: ${result.aiAnalysis.primaryDeficitSphere}
📐 Форма колеса: ${result.aiAnalysis.wheelShapeDiagnostic?.shapeName || 'Колесо життя'}
⚡ Дія за правилом 72 годин: ${result.aiAnalysis.recommendations?.rule72HoursAction || result.aiAnalysis.rebalanceActionPlan.immediateAction}
📅 SMART-ціль на 30 днів: ${result.aiAnalysis.recommendations?.smart30DaysGoal || result.aiAnalysis.rebalanceActionPlan.shortTermPlan}
🌱 Звичка: ${result.aiAnalysis.rebalanceActionPlan.habitToTransform}
💡 Інсайт: ${result.aiAnalysis.coachingInsight}`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  // Helper for SVG Radar Chart calculation
  const size = 340;
  const center = size / 2;
  const radius = center - 45;
  const total = spheres.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
    const r = (radius * value) / 10;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  const polygonPoints = spheres
    .map((s, i) => {
      const { x, y } = getCoordinates(i, s.score);
      return `${x},${y}`;
    })
    .join(' ');

  const currentLocalBalance = calculateLocalBalanceIndex();

  const getSphereName = (s: WheelSphereItem) => {
    if (lang === 'ru') return s.nameRu || s.nameUk;
    if (lang === 'en') return s.nameEn;
    return s.nameUk;
  };

  return (
    <div id="wheel-of-balance-module" className="mx-auto max-w-5xl space-y-6 p-2 sm:p-4 pb-32 sm:pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-linear-to-br from-emerald-500/10 via-stone-50 to-teal-500/10 dark:from-emerald-950/40 dark:via-stone-900 dark:to-teal-950/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <PieChart className="h-3.5 w-3.5" />
                <span>
                  {lang === 'ru'
                    ? 'Методология Пола Майера, Happy Monday & New Leaf'
                    : lang === 'en'
                    ? 'Paul Meyer, Happy Monday & New Leaf System'
                    : 'Методологія Пола Майєра, Happy Monday & New Leaf'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-white dark:bg-stone-800 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-stone-700 transition-colors shadow-2xs cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>{lang === 'ru' ? 'Инструкция и критерии 10/10' : lang === 'en' ? 'Guide & 10/10 Criteria' : 'Інструкція та критерії 10/10'}</span>
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
              {lang === 'ru'
                ? 'Колесо Баланса: Диагностика, Сфера-Рычаг и План'
                : lang === 'en'
                ? 'Wheel of Life Balance & Strategic Leverage'
                : 'Колесо Балансу: Діагностика, Сфера-Важіль та План'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {lang === 'ru'
                ? 'Оцените 8 сфер жизни за последние 1–3 месяца. Найдите скрытые психологические компенсации, геометрию колеса («покатится ли оно») и выявите ключевую сферу-рычаг («паровоз» изменений) с правилом 72 часов.'
                : lang === 'en'
                ? 'Assess 8 life domains based on the last 1–3 months. Discover wheel rollability geometry, unconscious compensations, and strategic leverage to pull your life forward using the 72-hour rule.'
                : 'Оцініть 8 сфер життя за останні 1–3 місяці. Дослідіть геометрію («чи покотиться колесо»), приховані компенсації за Пезешкіаном та виявіть ключову сферу-важіль («паровоз» змін) за правилом 72 годин.'}
            </p>
          </div>

          {/* Real-time live score badge */}
          <div className="flex items-center gap-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 p-4 shadow-sm shrink-0">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block">
                {lang === 'ru' ? 'Текущий Баланс' : lang === 'en' ? 'Current Balance' : 'Поточний Баланс'}
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {currentLocalBalance}%
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                {spheres.reduce((a, b) => a + b.score, 0)} / 80 {lang === 'ru' ? 'баллов' : 'балів'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Archetype Presets */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
          {lang === 'ru' ? 'Быстрые жизненные сценарии:' : lang === 'en' ? 'Life Archetype Presets:' : 'Швидкі життєві сценарії:'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="flex flex-col text-left rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group shadow-2xs"
            >
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {lang === 'ru' ? preset.titleRu : lang === 'en' ? preset.titleEn : preset.titleUk}
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                {lang === 'ru' ? preset.goalRu : lang === 'en' ? preset.goalEn : preset.goalUk}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Grid: SVG Radar Wheel on Left, Sliders & Deep Prompts on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: SVG Polar Radar Wheel & Geometry Overview */}
        <div className="lg:col-span-5 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 flex flex-col items-center justify-center shadow-xs space-y-4">
          <div className="w-full flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-500" />
              {lang === 'ru' ? 'Геометрия Колеса' : lang === 'en' ? 'Life Wheel Geometry' : 'Геометрія Колеса'}
            </h3>
            <span className="text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400">
              Δ {Math.max(...spheres.map((s) => s.score)) - Math.min(...spheres.map((s) => s.score))} балів
            </span>
          </div>

          <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
              {/* Concentric grid rings (2, 4, 6, 8, 10) */}
              {[2, 4, 6, 8, 10].map((level) => {
                const r = (radius * level) / 10;
                return (
                  <circle
                    key={level}
                    cx={center}
                    cy={center}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    className="text-stone-200 dark:text-stone-800"
                    strokeWidth={level === 10 ? '1.5' : '1'}
                    strokeDasharray={level < 10 ? '3 3' : undefined}
                  />
                );
              })}

              {/* Axis rays */}
              {spheres.map((s, i) => {
                const { x, y } = getCoordinates(i, 10);
                return (
                  <line
                    key={s.id}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="currentColor"
                    className="text-stone-200 dark:text-stone-800"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Filled Polygon area */}
              <polygon
                points={polygonPoints}
                fill="url(#wheelGradient)"
                fillOpacity="0.45"
                stroke="#10b981"
                strokeWidth="2.5"
              />

              {/* Gradients */}
              <defs>
                <linearGradient id="wheelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>

              {/* Dots on corners */}
              {spheres.map((s, i) => {
                const { x, y } = getCoordinates(i, s.score);
                return (
                  <circle
                    key={`dot-${s.id}`}
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                );
              })}

              {/* Labels on outer perimeter */}
              {spheres.map((s, i) => {
                const { x, y } = getCoordinates(i, 11.5);
                return (
                  <text
                    key={`label-${s.id}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[9px] font-bold fill-stone-700 dark:fill-stone-300 font-sans"
                  >
                    {s.score}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="w-full rounded-2xl bg-stone-50 dark:bg-stone-950/70 p-3 text-center space-y-1 border border-stone-200/70 dark:border-stone-800">
            <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 block">
              {lang === 'ru' ? 'Методологический принцип:' : 'Методологічний принцип:'}
            </span>
            <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
              {lang === 'ru'
                ? 'Идеальное колесо — не то, где везде десятки (это путь к перфекционизму), а то, где нет резких провалов и форма соответствует вашим осознанным приоритетам.'
                : 'Ідеальне колесо — не те, де всюди десятки (це шлях до неврозу), а те, де немає критичних провалів, і форма дозволяє впевнено рухатися вперед.'}
            </p>
          </div>
        </div>

        {/* Right: Sliders & Deep Reflection Form */}
        <div className="lg:col-span-7 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 dark:border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-500" />
                <span>
                  {lang === 'ru'
                    ? 'Оценка 8 Сфер Жизни (от 1 до 10):'
                    : lang === 'en'
                    ? 'Assess 8 Life Domains (1 to 10):'
                    : 'Оцінка 8 Сфер Життя (від 1 до 10):'}
                </span>
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {lang === 'ru'
                  ? 'Оценивайте состояние за последние 1–3 месяца. Разверните сферу для глубокого анализа.'
                  : 'Оцінюйте реальний стан за останні 1–3 місяці. Натисніть на сферу для детальної рефлексії.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline self-start sm:self-auto cursor-pointer"
            >
              {lang === 'ru' ? 'Как оценивать?' : 'Як оцінювати?'}
            </button>
          </div>

          {/* Sliders list */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {spheres.map((s) => {
              const isExpanded = expandedSphereId === s.id;
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 p-3.5 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        {getSphereName(s)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${s.color}20`, color: s.color }}
                      >
                        {s.score} / 10
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedSphereId(isExpanded ? null : s.id)}
                        className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title={lang === 'ru' ? 'Глубокие вопросы рефлексии' : 'Глибокі запитання рефлексії'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{isExpanded ? 'Згорнути' : 'Рефлексія'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={s.score}
                      onChange={(e) => handleScoreChange(s.id, parseInt(e.target.value))}
                      className="w-full h-2 bg-stone-200 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>

                  {/* Quick label indicators */}
                  <div className="flex justify-between text-[10px] text-stone-400 px-0.5">
                    <span>1 (Криза)</span>
                    <span>4 (Нестабільність)</span>
                    <span>7 (Опора)</span>
                    <span>10 (Розквіт)</span>
                  </div>

                  {/* Expanded deep coaching reflection fields (Happy Monday & Vseosvita methodology) */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2.5 animate-fadeIn">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {lang === 'ru' ? 'Что для вас «10 из 10» в этой сфере?' : 'Що для вас «10 з 10» у цій сфері? (Особистий орієнтир)'}
                        </label>
                        <input
                          type="text"
                          value={s.tenPointVision || ''}
                          onChange={(e) => handleSphereFieldChange(s.id, 'tenPointVision', e.target.value)}
                          placeholder="Наприклад: спати 8 годин, не мати болю, бігати двічі на тиждень..."
                          className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-stone-700 dark:text-stone-300 placeholder-stone-400 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            {lang === 'ru' ? 'Почему не на 1 балл ниже?' : 'Чому не на 1 бал нижче? (Опори)'}
                          </label>
                          <input
                            type="text"
                            value={s.whyNotLower || ''}
                            onChange={(e) => handleSphereFieldChange(s.id, 'whyNotLower', e.target.value)}
                            placeholder="Що вже зараз є непогано і захищає від краху?"
                            className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-stone-700 dark:text-stone-300 placeholder-stone-400 focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {lang === 'ru' ? 'Чего не хватает до +1 балла?' : 'Чого не вистачає до +1 бала?'}
                          </label>
                          <input
                            type="text"
                            value={s.whatNeedsForPlusOne || ''}
                            onChange={(e) => handleSphereFieldChange(s.id, 'whatNeedsForPlusOne', e.target.value)}
                            placeholder="Один мікрокрок: напр., лягати на 30 хв раніше"
                            className="w-full text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-stone-700 dark:text-stone-300 placeholder-stone-400 focus:outline-hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          value={s.notes || ''}
                          onChange={(e) => handleSphereFieldChange(s.id, 'notes', e.target.value)}
                          placeholder="Додаткова замітка / спостереження..."
                          className="w-full text-[11px] rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-stone-700 dark:text-stone-300 placeholder-stone-400 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Goal & Title fields */}
          <div className="pt-2 space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                  {lang === 'ru'
                    ? 'Главный фокус или желаемое изменение на ближайшее время:'
                    : lang === 'en'
                    ? 'Primary Focus / Desired Change:'
                    : 'Головний фокус або бажана зміна на найближчий час:'}
                </label>
                <VoiceInputButton
                  id="voice-input-wheel-goal"
                  currentValue={userGoal}
                  onTranscript={(text) => setUserGoal(text)}
                  fieldLabel={lang === 'ru' ? 'Главный фокус / Цель' : lang === 'en' ? 'Primary Focus' : 'Головний фокус / Мета'}
                />
              </div>
              <input
                type="text"
                value={userGoal}
                onChange={(e) => setUserGoal(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Например: Наладить баланс между проектом и семьей, укрепить здоровье...'
                    : lang === 'en'
                    ? 'e.g. Find balance between startup launch and rest without burning out'
                    : 'Наприклад: Налагодити баланс між проектом і сім’єю, підтягнути здоров’я...'
                }
                className="w-full rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3.5 py-2.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setSpheres(DEFAULT_SPHERES)}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'ru' ? 'Сбросить к исходным' : 'Скинути до початкових'}</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleAnalyze}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{t('loading_ai')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {lang === 'ru'
                        ? 'Глубокий Анализ, Сфера-Рычаг и План Ребаланса'
                        : lang === 'en'
                        ? 'Deep Analysis, Leverage & Rebalance Plan'
                        : 'Глибокий Аналіз, Сфера-Важіль та План Ребалансу'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI & Expert System Diagnostic Results */}
      {result && result.aiAnalysis && (
        <div className="space-y-6 animate-fadeIn pt-4">
          {/* Main leverage callout banner («Паровоз» змін) */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/60 bg-linear-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/60 dark:via-stone-900 dark:to-teal-950/40 p-6 sm:p-8 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-sm">
                  🚂
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                    {lang === 'ru'
                      ? 'Ключевая Сфера-Рычаг («Паровоз» изменений)'
                      : lang === 'en'
                      ? 'Key Leverage Sphere («Train Engine»)'
                      : 'Ключова Сфера-Важіль («Паровоз» змін)'}
                  </h3>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                    {result.aiAnalysis.leverageSphere}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer shadow-2xs"
                >
                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{isCopied ? 'Скопійовано!' : 'Копіювати план'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToJournal}
                  disabled={isSaved}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                    isSaved
                      ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                      : 'border-emerald-500/40 bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>{isSaved ? t('saved_successfully') : t('save_to_journal')}</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
              {result.aiAnalysis.systemicDiagnosis}
            </p>

            {/* Chain Reaction Callout */}
            {result.aiAnalysis.chainReaction && (
              <div className="rounded-2xl border border-emerald-500/30 bg-white/80 dark:bg-stone-900/80 p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Ланцюгова реакція («Ефект доміно» за Полом Майєром):</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {result.aiAnalysis.chainReaction.expectedImpact}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-stone-500">Сфери, що виграють першими:</span>
                  {result.aiAnalysis.chainReaction.impactedSpheres.map((imp, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold"
                    >
                      ✓ {imp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Wheel Geometry Diagnostics & Peseschkian 4 Vectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shape & Rollability */}
            {result.aiAnalysis.wheelShapeDiagnostic && (
              <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-indigo-500" />
                    {lang === 'ru' ? 'Диагностика формы колеса' : 'Діагностика форми колеса'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      result.aiAnalysis.wheelShapeDiagnostic.frictionLevel === 'critical'
                        ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                        : result.aiAnalysis.wheelShapeDiagnostic.frictionLevel === 'high'
                        ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        : result.aiAnalysis.wheelShapeDiagnostic.frictionLevel === 'moderate'
                        ? 'bg-teal-500/20 text-teal-600 border border-teal-500/30'
                        : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                    }`}
                  >
                    {result.aiAnalysis.wheelShapeDiagnostic.frictionLevel === 'critical'
                      ? 'Критичне тертя'
                      : result.aiAnalysis.wheelShapeDiagnostic.frictionLevel === 'high'
                      ? 'Високий опір'
                      : result.aiAnalysis.wheelShapeDiagnostic.frictionLevel === 'moderate'
                      ? 'Помірний опір'
                      : 'Плавний хід'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {result.aiAnalysis.wheelShapeDiagnostic.shapeName}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {result.aiAnalysis.wheelShapeDiagnostic.rollabilityDescription}
                </p>
              </div>
            )}

            {/* Peseschkian 4 Vectors Balance (New Leaf) */}
            {result.aiAnalysis.peseschkianBalance && (
              <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                    <BatteryCharging className="w-3.5 h-3.5 text-teal-500" />
                    {lang === 'ru' ? 'Модель Пезешкиана (4 вектора)' : 'Модель Пезешкіана (4 вектори)'}
                  </span>
                  <span className="text-[10px] text-stone-400">Орієнтир: по ~25%</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-0.5">
                      <span>Тіло & Здоровʼя (Відпочинок)</span>
                      <span className="font-mono">{result.aiAnalysis.peseschkianBalance.bodyHealthPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, result.aiAnalysis.peseschkianBalance.bodyHealthPct)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-0.5">
                      <span>Діяльність & Досягнення (Карʼєра/Гроші)</span>
                      <span className="font-mono">{result.aiAnalysis.peseschkianBalance.achievementCareerPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, result.aiAnalysis.peseschkianBalance.achievementCareerPct)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-0.5">
                      <span>Контакти & Стосунки (Сімʼя/Любов)</span>
                      <span className="font-mono">{result.aiAnalysis.peseschkianBalance.contactRelationshipsPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, result.aiAnalysis.peseschkianBalance.contactRelationshipsPct)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-stone-700 dark:text-stone-300 mb-0.5">
                      <span>Сенси & Майбутнє (Духовність/Ріст)</span>
                      <span className="font-mono">{result.aiAnalysis.peseschkianBalance.futureMeaningPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, result.aiAnalysis.peseschkianBalance.futureMeaningPct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 dark:text-stone-400 italic pt-1">
                  «{result.aiAnalysis.peseschkianBalance.interpretation}»
                </p>
              </div>
            )}
          </div>

          {/* Deficit & Psychological Hidden Compensations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Deficit */}
            <div className="rounded-3xl border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-5 space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                {lang === 'ru' ? 'Главная зона дефицита' : 'Головна зона дефіциту'}
              </span>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {result.aiAnalysis.primaryDeficitSphere}
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                {lang === 'ru'
                  ? 'Сфера, откуда сейчас больше всего утекает жизненный ресурс.'
                  : 'Сфера, звідки зараз найбільше витікає життєвий ресурс і де накопичується хронічна напруга.'}
              </p>
            </div>

            {/* Strategic Leverage */}
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                {lang === 'ru' ? 'Точка приложения усилий' : 'Точка прикладання зусиль'}
              </span>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {result.aiAnalysis.leverageSphere}
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                {lang === 'ru'
                  ? 'Минимум усилий здесь дает максимальный синергетический эффект для всей жизни.'
                  : 'Мінімум зусиль тут запускає ланцюгове вирівнювання всієї системи життя.'}
              </p>
            </div>

            {/* Hidden Compensations */}
            <div className="rounded-3xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-5 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                {lang === 'ru' ? 'Скрытые компенсации (New Leaf)' : 'Приховані компенсації (New Leaf)'}
              </span>
              <div className="space-y-1.5">
                {result.aiAnalysis.hiddenCompensations.map((comp, i) => (
                  <div key={i} className="text-[11px] text-stone-700 dark:text-stone-300 flex items-start gap-1.5 leading-tight">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coaching Drive Questions (Vseosvita Methodology) */}
          {result.aiAnalysis.coachingDriveQuestions && result.aiAnalysis.coachingDriveQuestions.length > 0 && (
            <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-3 shadow-xs">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>Рефлексивні коучингові запитання-драйвери (методика Всеосвіта):</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.aiAnalysis.coachingDriveQuestions.map((qItem, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-stone-50/80 dark:bg-stone-950/80 p-4 border border-stone-200/80 dark:border-stone-800 space-y-2"
                  >
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase block">
                      Питання #{idx + 1}
                    </span>
                    <p className="text-xs font-bold text-stone-800 dark:text-stone-200 leading-snug">
                      «{qItem.question}»
                    </p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                      💡 {qItem.answerInsight}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations & Action Plan (Happy Monday 72-Hours Rule & SMART 30 Days) */}
          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>
                {lang === 'ru'
                  ? 'Практический план действий и рекомендации (Happy Monday & Всеосвіта):'
                  : 'Практичний план дій та рекомендації (Happy Monday & Всеосвіта):'}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* 72-Hours Rule */}
              <div className="rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 p-4 border border-emerald-500/20 space-y-1.5">
                <span className="text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  ⚡ Правило 72 годин:
                </span>
                <p className="text-xs text-stone-900 dark:text-stone-100 font-bold">
                  {result.aiAnalysis.recommendations?.rule72HoursAction || result.aiAnalysis.rebalanceActionPlan.immediateAction}
                </p>
                <span className="text-[10px] text-stone-500 block">Перший мікрокрок без зволікань</span>
              </div>

              {/* SMART 30 Days */}
              <div className="rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 p-4 border border-indigo-500/20 space-y-1.5">
                <span className="text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  📅 SMART-ціль на 30 днів:
                </span>
                <p className="text-xs text-stone-900 dark:text-stone-100 font-bold">
                  {result.aiAnalysis.recommendations?.smart30DaysGoal || result.aiAnalysis.rebalanceActionPlan.shortTermPlan}
                </p>
                <span className="text-[10px] text-stone-500 block">Реалістичний підйом на +1..+2 бали</span>
              </div>

              {/* Ecological Boundary */}
              <div className="rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 p-4 border border-amber-500/20 space-y-1.5">
                <span className="text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  🛑 Екологічна межа:
                </span>
                <p className="text-xs text-stone-900 dark:text-stone-100 font-bold">
                  {result.aiAnalysis.recommendations?.ecologicalBoundary || 'Послабити надконтроль у сфері роботи'}
                </p>
                <span className="text-[10px] text-stone-500 block">Від чого відмовитися для вивільнення сил</span>
              </div>

              {/* Habit & Review Schedule */}
              <div className="rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 p-4 border border-purple-500/20 space-y-1.5">
                <span className="text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  🌱 Щоденна мікро-звичка:
                </span>
                <p className="text-xs text-stone-900 dark:text-stone-100 font-bold">
                  {result.aiAnalysis.rebalanceActionPlan.habitToTransform}
                </p>
                <span className="text-[10px] text-stone-500 block">
                  Наступний аудит: {result.aiAnalysis.recommendations?.nextReviewDate || 'через 30 днів'}
                </span>
              </div>
            </div>

            {/* Transformational Insight */}
            <div className="rounded-2xl bg-teal-50/50 dark:bg-teal-950/30 p-4 sm:p-5 border border-teal-500/20 text-xs space-y-1">
              <span className="font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {lang === 'ru' ? 'Трансформационный инсайт для осознания:' : 'Трансформаційний інсайт для усвідомлення:'}
              </span>
              <p className="text-stone-800 dark:text-stone-200 italic leading-relaxed text-xs sm:text-sm">
                «{result.aiAnalysis.coachingInsight}»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Guide & Methodology Modal (Comprehensive Guide based on Happy Monday, Vseosvita, NewLeaf) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                    Посібник: Як заповнювати та аналізувати Колесо Балансу
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Синтез методологій Пола Майєра, Happy Monday, Всеосвіта та New Leaf
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Guide Tabs */}
            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800/60 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setGuideActiveTab('rules')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  guideActiveTab === 'rules'
                    ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Правила заповнення
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab('benchmarks')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  guideActiveTab === 'benchmarks'
                    ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Критерії 10/10
              </button>
              <button
                type="button"
                onClick={() => setGuideActiveTab('peseschkian')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  guideActiveTab === 'peseschkian'
                    ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Модель Пезешкіана
              </button>
            </div>

            {/* Tab 1: Rules */}
            {guideActiveTab === 'rules' && (
              <div className="space-y-3.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-950/50 space-y-1">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    1. Оцінюйте «Тут і зараз» за останні 1–3 місяці
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400">
                    Не оцінюйте те, як було рік тому чи як ви мрієте бачити своє життя. Фіксуйте чесну реальність поточної ситуації без прикрас і самообману.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-950/50 space-y-1">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" />
                    2. Особисте «10 з 10» замість інстаграмних шаблонів (Happy Monday)
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400">
                    10 балів — це не мільйон доларів чи біцепси як у бодібілдера, якщо вам це не потрібно. Це ваш особистий критерій достатності й комфорту: «Що для МЕНЕ буде ідеальним станом?».
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-950/50 space-y-1">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-500" />
                    3. Що означають бали:
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-stone-600 dark:text-stone-400">
                    <li><strong className="text-stone-800 dark:text-stone-200">1–3 бали:</strong> Гостра криза, виснаження, сфера потребує негайної допомоги.</li>
                    <li><strong className="text-stone-800 dark:text-stone-200">4–6 балів:</strong> Нестабільність, терпимо, але забирає більше сил, ніж дає радості.</li>
                    <li><strong className="text-stone-800 dark:text-stone-200">7–8 балів:</strong> Здорова норма та стабільна ресурсна опора.</li>
                    <li><strong className="text-stone-800 dark:text-stone-200">9–10 балів:</strong> Справжній розквіт і натхнення.</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-950/50 space-y-1">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-teal-500" />
                    4. Запитання «Чому не нижче?» (Всеосвіта)
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400">
                    Перш ніж звинувачувати себе за 4 чи 5 балів, запитайте: «Чому не 1 чи 2?». Це миттєво вкаже на те, що ви вже робите правильно, і захистить від знецінення.
                  </p>
                </div>

                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 p-3.5 bg-stone-50/50 dark:bg-stone-950/50 space-y-1">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    5. Сфера-Важіль & Правило 72 годин
                  </h4>
                  <p className="text-stone-600 dark:text-stone-400">
                    Не намагайтеся підняти всі 8 сфер одночасно — це прямий шлях до вигорання. Оберіть одну сферу-важіль, яка запустить ефект доміно, і зробіть мікрокрок протягом перших 72 годин.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Benchmarks 10/10 */}
            {guideActiveTab === 'benchmarks' && (
              <div className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300 max-h-[50vh] overflow-y-auto pr-1">
                {DEFAULT_SPHERES.map((sphere) => (
                  <div key={sphere.id} className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/60 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-stone-900 dark:text-stone-100">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sphere.color }} />
                      <span>{sphere.nameUk}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      <strong>Орієнтир 10 балів:</strong> {sphere.tenPointVision}
                    </p>
                    <p className="text-[11px] text-teal-600 dark:text-teal-400">
                      <strong>Опори (чому не нижче):</strong> {sphere.whyNotLower}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Peseschkian Balance Model */}
            {guideActiveTab === 'peseschkian' && (
              <div className="space-y-3 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                <p className="text-stone-600 dark:text-stone-400">
                  У позитивній психотерапії Носсрата Пезешкіана (New Leaf) енергія людини розподіляється за 4 головними векторами:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-1">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 block">1. Тіло / Здоровʼя</span>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      Сон, харчування, спорт, тілесний комфорт, сексуальне життя, відпочинок і здатність розслаблятися.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-1">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 block">2. Діяльність / Успіх</span>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      Робота, карʼєра, бізнес, фінанси, навчання, досягнення та соціальне визнання.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-rose-500/30 bg-rose-50/30 dark:bg-rose-950/20 space-y-1">
                    <span className="font-bold text-rose-700 dark:text-rose-300 block">3. Контакти / Стосунки</span>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      Кохання, родина, друзі, соціальні звʼязки, емоційна близькість і взаємна підтримка.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl border border-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20 space-y-1">
                    <span className="font-bold text-purple-700 dark:text-purple-300 block">4. Сенси / Майбутнє</span>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400">
                      Цінності, філософія, духовність, внутрішній спокій, плани на майбутнє та мрії.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>Увага на втечу від стресу:</strong> При проблемах у контактах чи здоровʼї люди часто несвідомо «втікають» у діяльність (трудоголізм), що лише посилює кризу.
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Зрозуміло, перейти до заповнення
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
