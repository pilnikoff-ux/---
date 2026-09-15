import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  Send,
  BookmarkCheck,
  Download,
  Upload,
  RefreshCw,
  Lightbulb,
  Heart,
  Compass,
  ArrowRight,
  Filter,
  Check,
  HelpCircle,
  BarChart3,
  Award,
} from 'lucide-react';
import { WishItem, WishCategory, WishLayer, HundredWishesData } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { getUserProfile } from '../services/userStatsService';
import { saveJournalEntry } from '../services/storageService';
import { requestHundredWishesAnalysis } from '../services/geminiService';
import { VoiceInputButton } from './VoiceInputButton';

const STORAGE_KEY = 'psy_hundred_wishes_data_v1';

interface HundredWishesProps {
  onSavedToJournal?: () => void;
  onSendToSmartGoal?: (wishText: string, category: string) => void;
}

const CATEGORY_CONFIG: Record<
  WishCategory,
  { labelUk: string; labelRu: string; labelEn: string; color: string; badge: string }
> = {
  material: {
    labelUk: 'Матеріальне (Have)',
    labelRu: 'Материальное (Have)',
    labelEn: 'Material (Have)',
    color: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  experience: {
    labelUk: 'Досвід та враження (Experience)',
    labelRu: 'Опыт и впечатления (Experience)',
    labelEn: 'Experience & Travel',
    color: 'text-sky-500',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
  },
  skills_growth: {
    labelUk: 'Навички та тіло (Do / Be)',
    labelRu: 'Навыки и тело (Do / Be)',
    labelEn: 'Skills & Growth (Do / Be)',
    color: 'text-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
  relationships_health: {
    labelUk: 'Стосунки та сімʼя (Relationships)',
    labelRu: 'Отношения и семья (Relationships)',
    labelEn: 'Relationships & Health',
    color: 'text-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
  },
  contribution_spirit: {
    labelUk: 'Внесок та сенси (Give / Contribute)',
    labelRu: 'Вклад и смыслы (Give / Contribute)',
    labelEn: 'Contribution & Spirit (Give)',
    color: 'text-purple-500',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
  },
};

const STARTER_INSPIRATIONS = [
  { text: 'Зустріти світанок на узбережжі океану в тиші', category: 'experience' as WishCategory, energy: 9 },
  { text: 'Створити затишний робочий простір з ергономічним кріслом', category: 'material' as WishCategory, energy: 8 },
  { text: 'Опанувати гру на музичному інструменті або новий танець', category: 'skills_growth' as WishCategory, energy: 9 },
  { text: 'Щотижня мати один теплий вечір без гаджетів із близькими', category: 'relationships_health' as WishCategory, energy: 10 },
  { text: 'Посадити дерево або долучитися до благодійного наставництва', category: 'contribution_spirit' as WishCategory, energy: 8 },
  { text: 'Політати на повітряній кулі над весняними долинами', category: 'experience' as WishCategory, energy: 9 },
  { text: 'Написати свою власну розповідь або створити авторський проєкт', category: 'contribution_spirit' as WishCategory, energy: 9 },
  { text: 'Вільно та впевнено спілкуватися іноземною мовою під час подорожей', category: 'skills_growth' as WishCategory, energy: 9 },
];

export const HundredWishesPractice: React.FC<HundredWishesProps> = ({
  onSavedToJournal,
  onSendToSmartGoal,
}) => {
  const { lang, t } = useThemeLanguage();

  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<WishCategory>('experience');
  const [newEnergy, setNewEnergy] = useState<number>(8);

  const [showGuide, setShowGuide] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterLayer, setFilterLayer] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<HundredWishesData['aiAnalysis'] | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Load from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.wishes)) {
          setWishes(parsed.wishes);
          if (parsed.aiAnalysis) setAiAnalysis(parsed.aiAnalysis);
          return;
        }
      }
    } catch {
      // ignore
    }
    // Default starter template if empty
    const initial: WishItem[] = STARTER_INSPIRATIONS.map((item, idx) => ({
      id: `wish-${Date.now()}-${idx}`,
      number: idx + 1,
      text: item.text,
      category: item.category,
      energyScore: item.energy,
      layer: (idx + 1 <= 30 ? 'social' : idx + 1 <= 70 ? 'personal' : 'deep_subconscious') as WishLayer,
      status: 'pending',
    }));
    setWishes(initial);
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    if (wishes.length > 0) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          wishes,
          aiAnalysis,
          updatedAt: new Date().toISOString(),
        })
      );
    }
  }, [wishes, aiAnalysis]);

  const determineLayer = (num: number): WishLayer => {
    if (num <= 30) return 'social';
    if (num <= 70) return 'personal';
    return 'deep_subconscious';
  };

  const handleAddWish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim()) return;

    const nextNumber = wishes.length + 1;
    const item: WishItem = {
      id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      number: nextNumber,
      text: newText.trim(),
      category: newCategory,
      energyScore: newEnergy,
      layer: determineLayer(nextNumber),
      status: 'pending',
    };

    setWishes((prev) => [...prev, item]);
    setNewText('');
    setNewEnergy(8);
  };

  const handleToggleStatus = (id: string) => {
    setWishes((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const nextStatus =
          w.status === 'pending' ? 'in_progress' : w.status === 'in_progress' ? 'completed' : 'pending';
        return {
          ...w,
          status: nextStatus,
          completedDate: nextStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      })
    );
  };

  const handleDeleteWish = (id: string) => {
    setWishes((prev) => {
      const filtered = prev.filter((w) => w.id !== id);
      return filtered.map((w, idx) => ({
        ...w,
        number: idx + 1,
        layer: determineLayer(idx + 1),
      }));
    });
  };

  const handleUpdateEnergy = (id: string, score: number) => {
    setWishes((prev) =>
      prev.map((w) => (w.id === id ? { ...w, energyScore: score } : w))
    );
  };

  const handleQuickAddInspiration = (item: (typeof STARTER_INSPIRATIONS)[0]) => {
    const nextNumber = wishes.length + 1;
    const wish: WishItem = {
      id: `wish-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      number: nextNumber,
      text: item.text,
      category: item.category,
      energyScore: item.energy,
      layer: determineLayer(nextNumber),
      status: 'pending',
    };
    setWishes((prev) => [...prev, wish]);
  };

  const handleRunAiAnalysis = async () => {
    if (wishes.length < 3) {
      alert(
        lang === 'ru'
          ? 'Пожалуйста, запишите хотя бы 3-5 желаний перед запуском глубокого анализа.'
          : lang === 'en'
          ? 'Please add at least 3-5 desires before running deep AI analysis.'
          : 'Будь ласка, запишіть хоча б 3-5 бажань перед запуском глибинного аналізу.'
      );
      return;
    }
    setIsAnalyzing(true);
    try {
      const analysis = await requestHundredWishesAnalysis(wishes);
      setAiAnalysis(analysis);
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToJournal = () => {
    const user = getUserProfile();
    const data: HundredWishesData = {
      id: `hw-${Date.now()}`,
      title: `${lang === 'ru' ? 'Практика 100 Желаний' : lang === 'en' ? '100 Desires Practice' : 'Практика 100 Бажань'} (${wishes.length}/100)`,
      date: new Date().toISOString(),
      wishes,
      aiAnalysis: aiAnalysis || undefined,
    };

    saveJournalEntry({
      id: data.id,
      type: 'hundredWishes',
      title: data.title,
      date: data.date,
      summary: `${lang === 'ru' ? 'Записано' : lang === 'en' ? 'Recorded' : 'Записано'}: ${wishes.length}/100 | ${lang === 'ru' ? 'Высокая энергия' : lang === 'en' ? 'High Energy' : 'Висока енергія'}: ${wishes.filter((w) => w.energyScore >= 8).length} | ${lang === 'ru' ? 'Исполнено' : lang === 'en' ? 'Completed' : 'Здійснено'}: ${wishes.filter((w) => w.status === 'completed').length}`,
      data,
      userId: user?.id,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (onSavedToJournal) onSavedToJournal();
  };

  // Filtered list
  const filteredWishes = wishes.filter((w) => {
    const matchesCat = filterCategory === 'all' || w.category === filterCategory;
    const matchesLayer = filterLayer === 'all' || w.layer === filterLayer;
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    const matchesSearch =
      !searchQuery.trim() || w.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesLayer && matchesStatus && matchesSearch;
  });

  const completedCount = wishes.filter((w) => w.status === 'completed').length;
  const inProgressCount = wishes.filter((w) => w.status === 'in_progress').length;
  const highEnergyCount = wishes.filter((w) => w.energyScore >= 8).length;

  return (
    <div id="hundred-wishes-container" className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-linear-to-br from-stone-50 via-teal-50/20 to-amber-50/20 dark:from-stone-900 dark:via-teal-950/20 dark:to-amber-950/20 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === 'ru'
                ? 'Коучинговая методика РАС & Снятие Внутренней Цензуры'
                : lang === 'en'
                ? 'RAS Coaching & Subconscious Desires Activation'
                : 'Коучингова методика РАС & Зняття Внутрішньої Цензури'}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {lang === 'ru'
                ? 'Практика 100 Желаний'
                : lang === 'en'
                ? '100 Desires Practice'
                : 'Практика 100 Бажань'}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {lang === 'ru'
                ? 'Глубинная практика пробуждения истинных стремлений. Первые 30 желаний — социальные, 31–70 — личностные, а 71–100 — чистые мечты Внутреннего Ребёнка.'
                : lang === 'en'
                ? 'Unlock authentic aspirations through the 3 psychological layers: social conditioning (1–30), mature goals (31–70), and pure subconscious dreams (71–100).'
                : 'Глибинна практика пробудження справжніх прагнень. Перші 30 бажань — соціальні «треба», 31–70 — зрілі особистісні цілі, а 71–100 — чисті мрії Внутрішнього Дитяти.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="hw-guide-toggle-btn"
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 transition hover:bg-stone-100 dark:hover:bg-stone-700 shadow-xs cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>{lang === 'ru' ? 'Рекомендации к заполнению' : lang === 'en' ? 'Guidelines & Tips' : 'Рекомендації до заповнення'}</span>
              {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <button
              id="hw-save-journal-btn"
              type="button"
              onClick={handleSaveToJournal}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600 px-3.5 py-2 text-xs font-bold text-white dark:text-stone-950 transition shadow-xs cursor-pointer active:scale-95"
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>{isSaved ? (lang === 'ru' ? 'Сохранено!' : 'Збережено!') : (lang === 'ru' ? 'В Журнал' : 'В Журнал')}</span>
            </button>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="mt-6 pt-5 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
              <span>{lang === 'ru' ? 'Прогресс наполнения:' : 'Прогрес наповнення:'}</span>
              <span className="text-teal-600 dark:text-teal-400 text-sm font-extrabold font-mono">
                {wishes.length} / 100
              </span>
            </div>
            <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> {completedCount} {lang === 'ru' ? 'сбылось' : 'здійснено'}
              </span>
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <Clock className="h-3.5 w-3.5" /> {inProgressCount} {lang === 'ru' ? 'в процессе' : 'у процесі'}
              </span>
              <span className="flex items-center gap-1 text-rose-500 font-semibold">
                <Flame className="h-3.5 w-3.5" /> {highEnergyCount} {lang === 'ru' ? 'огонь (8-10)' : 'вогонь (8-10)'}
              </span>
            </div>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
            <div
              className="h-full bg-linear-to-r from-teal-500 via-amber-500 to-rose-500 transition-all duration-500"
              style={{ width: `${Math.min(100, (wishes.length / 100) * 100)}%` }}
            />
          </div>

          {/* 3 Psychological Layers Labels */}
          <div className="mt-2 grid grid-cols-3 text-[11px] font-medium text-stone-500 dark:text-stone-400 text-center">
            <div className={`py-1 rounded-sm ${wishes.length >= 1 ? 'text-teal-600 dark:text-teal-400 font-bold' : ''}`}>
              1–30: {lang === 'ru' ? 'Социальный слой' : 'Соціальний шар'}
            </div>
            <div className={`py-1 rounded-sm ${wishes.length >= 31 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
              31–70: {lang === 'ru' ? 'Личностный слой' : 'Особистісний шар'}
            </div>
            <div className={`py-1 rounded-sm ${wishes.length >= 71 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
              71–100: {lang === 'ru' ? 'Глубинные мечты' : 'Глибинні мрії'}
            </div>
          </div>
        </div>

        {/* Detailed Coaching Guide / Instructions Accordion */}
        {showGuide && (
          <div className="mt-5 rounded-xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/30 p-4 sm:p-5 text-stone-800 dark:text-stone-200 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300 text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>
                {lang === 'ru'
                  ? 'Золотые правила и психологические секреты практики «100 Желаний»'
                  : lang === 'en'
                  ? 'Golden Rules & Psychological Insights for the 100 Desires Practice'
                  : 'Золоті правила та психологічні секрети практики «100 Бажань»'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-teal-700 dark:text-teal-400">
                  1. {lang === 'ru' ? 'Включите режим «Если бы всё было возможно»' : 'Вимкніть цензора «Якби все було можливо»'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Главная ошибка — думать о деньгах, времени или реалистичности в момент записи. Записывайте как материальные вещи (автомобиль, кофеварка), так и ощущения (встретить рассвет на скале, погладить кита).'
                    : 'Головна пастка — оцінювати реалістичність або вартість на етапі запису. Пишіть абсолютно все: від дрібних щоденних радощів до найсміливіших космічних фантазій.'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-amber-700 dark:text-amber-400">
                  2. {lang === 'ru' ? 'Формулировка в настоящем времени' : 'Формулювання в теперішньому часі та без частки «НЕ»'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Мозг не воспринимает отрицание. Вместо «Не болеть» пишите «Я чувствую бодрость и лёгкость в теле». Вместо «Избавиться от долгов» — «Я свободно зарабатываю от $5000 в месяц».'
                    : 'Підсвідомість не зчитує заперечення. Замість «Не хворіти» пишіть «Я маю витривале, здорове та гнучке тіло». Замість «Не сваритися» — «Я будую довірливі та ніжні стосунки».'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-rose-700 dark:text-rose-400">
                  3. {lang === 'ru' ? 'Преодоление «Стены затыка» (на 35–45 желании)' : 'Подолання кризи на 35–45 бажанні'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Почти каждый человек останавливается на 30–40 желаниях, когда иссякают поверхностные стереотипы. Именно здесь начинается глубинная работа! Задайте себе вопросы: «О чём я мечтал(а) в 7 лет?», «Чему хочу научиться?», «Кому я хочу подарить радость?»'
                    : 'Майже кожен відчуває ступор після 30–40 пунктів, коли поверхневі «треба» закінчуються. Не здавайтеся! Запитайте себе: «Що приносить мені дитяче захоплення?», «Який досвід я хочу пережити хоча б раз у житті?»'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-purple-700 dark:text-purple-400">
                  4. {lang === 'ru' ? 'Тест на внутренний огонь (шкала 1-10)' : 'Енергетичний тест на істинність (1-10)'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Оцените каждое желание: если при мысли о нём сердце замирает или появляется мурашки — это ваш истинный 10-бальный огонь. Такие желания имеют высший приоритет для переноса в SMART-цели.'
                    : 'Оцініть, чи виникає тілесний відгук і трепет у грудях від цього пункту. Бажання з балом 9-10 — це ваш головний драйвер, який варто негайно декомпозувати у SMART-цілі.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Form for adding a new wish */}
      <form
        onSubmit={handleAddWish}
        className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-teal-500" />
            {lang === 'ru' ? `Добавить желание #${wishes.length + 1}` : `Додати бажання #${wishes.length + 1}`}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
            {determineLayer(wishes.length + 1) === 'social'
              ? (lang === 'ru' ? 'Слой: Социальный (1–30)' : 'Шар: Соціальний (1–30)')
              : determineLayer(wishes.length + 1) === 'personal'
              ? (lang === 'ru' ? 'Слой: Личностный (31–70)' : 'Шар: Особистісний (31–70)')
              : (lang === 'ru' ? 'Слой: Глубинный (71–100)' : 'Шар: Глибинний (71–100)')}
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'Например: Встретить закат на яхте в Средиземном море...'
                : lang === 'en'
                ? 'e.g., Learn to play handpan drum, visit Kyoto in spring...'
                : 'Наприклад: Зустріти світанок на вершині Говерли з горнятком чаю...'
            }
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-4 py-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500 pr-12"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <VoiceInputButton onTranscript={(txt) => setNewText((prev) => (prev ? `${prev} ${txt}` : txt))} />
          </div>
        </div>

        {/* Categories & Energy Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(CATEGORY_CONFIG) as WishCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isSelected = newCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                    isSelected
                      ? `${cfg.badge} font-bold shadow-xs`
                      : 'border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {cfg.labelUk}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-rose-500" />
              {lang === 'ru' ? 'Энергия:' : 'Енергія:'}
            </span>
            <div className="flex items-center gap-1">
              {[1, 3, 5, 7, 8, 9, 10].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNewEnergy(val)}
                  className={`h-6 w-6 rounded-md text-[11px] font-extrabold transition cursor-pointer ${
                    newEnergy === val
                      ? 'bg-rose-600 text-white shadow-xs scale-105'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!newText.trim()}
              className="flex items-center gap-1 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:pointer-events-none px-4 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer ml-2"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{lang === 'ru' ? 'Добавить' : 'Додати'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Quick Starter Inspiration Chips */}
      {wishes.length < 20 && (
        <div className="rounded-xl border border-stone-200/80 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-900/60 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
            <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
            <span>{lang === 'ru' ? 'Нужна искра вдохновения? Нажмите, чтобы добавить:' : 'Потрібна іскра натхнення? Натисніть для додавання:'}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_INSPIRATIONS.filter((s) => !wishes.some((w) => w.text === s.text))
              .slice(0, 4)
              .map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAddInspiration(item)}
                  className="flex items-center gap-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-xs text-stone-700 dark:text-stone-300 hover:border-teal-500/50 hover:bg-teal-50/30 dark:hover:bg-teal-950/30 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                  <span>{item.text}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-hidden"
          >
            <option value="all">{lang === 'ru' ? 'Все категории' : 'Всі категорії'}</option>
            {(Object.keys(CATEGORY_CONFIG) as WishCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_CONFIG[cat].labelUk}
              </option>
            ))}
          </select>

          {/* Layer Filter */}
          <select
            value={filterLayer}
            onChange={(e) => setFilterLayer(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-hidden"
          >
            <option value="all">{lang === 'ru' ? 'Все 3 слоя' : 'Всі 3 шари'}</option>
            <option value="social">{lang === 'ru' ? '1–30: Социальный слой' : '1–30: Соціальний шар'}</option>
            <option value="personal">{lang === 'ru' ? '31–70: Личностный слой' : '31–70: Особистісний шар'}</option>
            <option value="deep_subconscious">{lang === 'ru' ? '71–100: Глубинные мечты' : '71–100: Глибинні мрії'}</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5 text-xs font-medium text-stone-800 dark:text-stone-200 focus:outline-hidden"
          >
            <option value="all">{lang === 'ru' ? 'Все статусы' : 'Всі статуси'}</option>
            <option value="pending">{lang === 'ru' ? 'Новые' : 'Нові'}</option>
            <option value="in_progress">{lang === 'ru' ? 'В процессе' : 'У процесі'}</option>
            <option value="completed">{lang === 'ru' ? 'Здійснено!' : 'Здійснено!'}</option>
          </select>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск желания...' : 'Пошук бажання...'}
            className="w-36 sm:w-48 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden"
          />
        </div>

        {/* AI Analysis Action */}
        <button
          type="button"
          onClick={handleRunAiAnalysis}
          disabled={isAnalyzing || wishes.length === 0}
          className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 disabled:opacity-50 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isAnalyzing ? (lang === 'ru' ? 'ШИ анализирует...' : 'ШІ аналізує...') : (lang === 'ru' ? 'Глубинный ШИ-Анализ' : 'Глибинний ШІ-Аналіз')}</span>
        </button>
      </div>

      {/* Wishes List */}
      <div className="space-y-2.5">
        {filteredWishes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 p-8 text-center text-stone-500">
            <p className="text-sm">
              {lang === 'ru'
                ? 'Желания по выбранным фильтрам не найдены. Добавьте новое желание выше!'
                : 'Бажань за обраними фільтрами не знайдено. Додайте нове бажання у формі вгорі!'}
            </p>
          </div>
        ) : (
          filteredWishes.map((item) => {
            const catCfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.experience;
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';

            return (
              <div
                key={item.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 sm:p-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 text-stone-500'
                    : isInProgress
                    ? 'border-amber-500/40 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-teal-500/40'
                }`}
              >
                {/* Left side: Number, Checkbox, Text */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item.id)}
                    title={
                      isCompleted
                        ? 'Позначити як нове'
                        : isInProgress
                        ? 'Позначити як здійснене!'
                        : 'Взяти у процес'
                    }
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition cursor-pointer ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                        : isInProgress
                        ? 'border-amber-500 bg-amber-500/20 text-amber-600'
                        : 'border-stone-300 dark:border-stone-700 hover:border-teal-500'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : isInProgress ? (
                      <Clock className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <span className="text-[11px] font-mono text-stone-400 font-bold">
                        {item.number}
                      </span>
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-400">
                        #{item.number}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catCfg.badge}`}>
                        {catCfg.labelUk}
                      </span>
                      {item.energyScore >= 8 && (
                        <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                          <Flame className="h-3 w-3" /> {item.energyScore}/10
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium leading-snug break-words ${
                        isCompleted
                          ? 'line-through text-stone-400 dark:text-stone-500'
                          : 'text-stone-900 dark:text-stone-100'
                      }`}
                    >
                      {item.text}
                    </p>
                  </div>
                </div>

                {/* Right side: Energy, Send to SMART, Delete */}
                <div className="flex items-center justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800">
                  {/* Energy Score selector */}
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-lg">
                    <Flame className="h-3 w-3 text-rose-500" />
                    <select
                      value={item.energyScore}
                      onChange={(e) => handleUpdateEnergy(item.id, Number(e.target.value))}
                      className="bg-transparent text-xs font-bold text-stone-700 dark:text-stone-300 focus:outline-hidden cursor-pointer"
                      title="Енергетичний заряд (1-10)"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} б.
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Send to SMART Goal button */}
                  {onSendToSmartGoal && !isCompleted && (
                    <button
                      type="button"
                      onClick={() => onSendToSmartGoal(item.text, item.category)}
                      className="flex items-center gap-1 rounded-lg border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 px-2 py-1 text-xs font-semibold text-teal-700 dark:text-teal-300 transition cursor-pointer"
                      title="Трансформувати це бажання у SMART-ціль"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">SMART</span>
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteWish(item.id)}
                    className="p-1.5 text-stone-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                    title="Видалити"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Deep Coaching Analysis Result Block */}
      {aiAnalysis && (
        <div className="rounded-2xl border border-teal-500/40 bg-linear-to-br from-teal-50/50 via-white to-indigo-50/40 dark:from-teal-950/40 dark:via-stone-900 dark:to-indigo-950/40 p-5 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-teal-500/20 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {lang === 'ru'
                  ? 'Глубинный психологический срез 100 Желаний'
                  : lang === 'en'
                  ? 'Subconscious Desire Architecture & Coaching Insights'
                  : 'Глибинний психологічний зріз 100 Бажань'}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300">
              ICF Coaching Framework
            </span>
          </div>

          <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">
            {aiAnalysis.summary}
          </p>

          {/* Category Distribution with coach notes */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              {lang === 'ru' ? 'Распределение по 5 векторам жизни:' : 'Розподіл за 5 життєвими векторами:'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiAnalysis.balanceByCategory.map((cat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-3 space-y-1.5 shadow-xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-stone-800 dark:text-stone-200">{cat.category}</span>
                    <span className="text-teal-600 dark:text-teal-400 font-mono font-extrabold">{cat.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${Math.min(100, cat.percentage)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
                    {cat.coachComment}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dominant Layer & Subconscious breakthroughs */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-1.5">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Award className="h-4 w-4" />
              {lang === 'ru' ? 'Прорыв внутреннего цензора (3 слоя):' : 'Прорив внутрішнього цензора (3 шари):'}
            </h4>
            <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {aiAnalysis.dominantLayerInsight}
            </p>
          </div>

          {/* Top High Energy Picks */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-rose-500" />
              {lang === 'ru' ? 'ТОП желаний с наивысшим энергетическим зарядом:' : 'ТОП бажань з найвищим енергетичним зарядом:'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {aiAnalysis.topHighEnergyPicks.map((pick, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20 p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-mono text-xs font-bold text-rose-500">#{pick.number}</span>
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{pick.text}</p>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug">{pick.rationale}</p>
                  </div>
                  {onSendToSmartGoal && (
                    <button
                      type="button"
                      onClick={() => onSendToSmartGoal(pick.text, 'experience')}
                      className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-teal-600 dark:bg-teal-500 px-2.5 py-1.5 text-xs font-bold text-white dark:text-stone-950 hover:opacity-90 transition cursor-pointer"
                    >
                      <span>{lang === 'ru' ? 'В SMART-цель' : 'У SMART-ціль'}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Themes & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-2">
              <h5 className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {lang === 'ru' ? 'Притоки и скрытые темы:' : 'Приховані психологічні теми:'}
              </h5>
              <ul className="list-disc list-inside text-xs text-stone-600 dark:text-stone-400 space-y-1">
                {aiAnalysis.hiddenThemes.map((theme, i) => (
                  <li key={i}>{theme}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-2">
              <h5 className="text-xs font-bold text-teal-700 dark:text-teal-400">
                {lang === 'ru' ? 'Коучинговые шаги трансформации:' : 'Коучингові кроки трансформації:'}
              </h5>
              <ul className="list-disc list-inside text-xs text-stone-600 dark:text-stone-400 space-y-1">
                {aiAnalysis.coachingRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
