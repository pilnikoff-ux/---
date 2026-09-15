import React, { useState } from 'react';
import {
  Sparkles,
  Compass,
  Layers,
  Brain,
  Heart,
  Shield,
  Clock,
  Swords,
  HelpCircle,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  RefreshCw,
  Crown,
  Activity,
  Zap,
  ArrowRight,
  MessageSquareHeart,
  PieChart,
  Target,
  BookOpen,
} from 'lucide-react';
import { ConsiliumAnalysis, ApproachType } from '../types';
import { requestConsiliumAnalysis } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { logUserActivity } from '../services/userStatsService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { VoiceInputButton } from './VoiceInputButton';
import { ActionStepByStepModal } from './ActionStepByStepModal';

interface ConsiliumNavigatorProps {
  onSendToGoalMakers?: (data: { title: string; pointA: string; pointB: string; action24h: string }) => void;
  onSelectTab?: (tab: any) => void;
  onOpenGrounding?: () => void;
  onSavedToJournal?: () => void;
}

const PRESETS_UA = [
  {
    title: 'Страх змін: робота vs власна справа',
    category: 'Кар’єра & Бізнес',
    situation: 'Працюю на стабільній роботі 6 років, але відчуваю повне вигорання. Хочу почати свій проект, але паралізує страх втратити фінансову безпеку та засудження близьких.',
    past: 'Раніше була спроба запуску іншого проекту 3 роки тому, яка провалилася через брак планування.',
    future: 'Мати автономну справу, дохід не менший за поточний, і відчуття сенсу в тому, що роблю.',
    emotions: ['Тривога', 'побоювання/недовіра', 'жаль / скорбота', 'Втома / Вигорання'],
  },
  {
    title: 'Конфлікт у стосунках & Особисті межі',
    category: 'Стосунки',
    situation: 'Коли партнер чи родичі просять про послугу або критикують мої рішення, я не можу сказати «ні», а потім злюся на себе і на них, накопичуючи образу.',
    past: 'У дитинстві за прояв власної думки мене карали бойкотом та відчуженням.',
    future: 'Спокійно і впевнено відстоювати свої межі без почуття провини та руйнування стосунків.',
    emotions: ['жалість до себе', 'засмучення', 'самотність', 'Злість / Роздратування'],
  },
  {
    title: 'Синдром самозванця & Страх публічності',
    category: 'Самооцінка & Лідерство',
    situation: 'Отримав пропозицію стати лідером команди та виступати експертом, але в голові постійно крутиться думка: «Я ще недостатньо знаю, скоро всі зрозуміють, що я шарлатан».',
    past: 'Завжди знецінював свої досягнення, списуючи їх на випадковий збіг обставин.',
    future: 'Відчути внутрішню гідність, професійну опору і сміливо взяти лідерство.',
    emotions: ['побоювання/недовіра', 'Сором', 'жалість до себе'],
  },
  {
    title: 'Емоційне вигорання & Втрата сенсу',
    category: 'Енергія & Стан',
    situation: 'Досяг матеріальних цілей, але прокидаюся без радості та енергії. Звичні справи викликають байдужість або апатію, складно зрозуміти, куди рухатися далі.',
    past: 'Останні 5 років працював по 14 годин на добу в режимі гіперконтролю та постійної мобілізації.',
    future: 'Відновити внутрішній вогонь, смак до життя та гармонію між відпочинком і творчістю.',
    emotions: ['Втома / Вигорання', 'Безсилля', 'самотність', 'засмучення'],
  },
  {
    title: 'Прокрастинація великого проекту & Перфекціонізм',
    category: 'Продуктивність',
    situation: 'Постійно відкладаю запуск важливого авторського продукту, знаходячи дрібні відволікаючі задачі. Внутрішній критик вимагає або ідеального результату, або ніякого.',
    past: 'Були ситуації жорсткої публічної критики в минулому, які закарбували страх помилки.',
    future: 'Легко створювати та випускати проекти за принципом достатньо доброго результату (MVP).',
    emotions: ['Страх вибору', 'Тривога', 'побоювання/недовіра', 'жаль / скорбота'],
  },
  {
    title: 'Фінансова тривога & Стеля доходів',
    category: 'Фінанси & Мислення',
    situation: 'Як тільки дохід перевищує певну планку, починаються непередбачувані витрати або саботаж. Відчуваю підсвідомий страх великих грошей та заздрощів.',
    past: 'У родині була установка, що чесною працею багато не заробиш, а багатство небезпечне.',
    future: 'Спокійно приймати високий дохід, масштабувати діяльність без відчуття провини.',
    emotions: ['Тривога', 'Провина', 'побоювання/недовіра'],
  },
  {
    title: 'Криза життєвого роздоріжжя (FOMO)',
    category: 'Вибір & Рішення',
    situation: 'Маю три різні привабливі напрямки розвитку, але паралізований страхом зробити неправильний вибір і втратити інші можливості.',
    past: 'Часто змінював сфери, боячись остаточного зобов’язання та втрати свободи.',
    future: 'Зробити свідомий цілісний вибір і повністю присвятити себе головному вектору.',
    emotions: ['Страх вибору', 'Тривога', 'жаль / скорбота', 'інтерес / захоплення'],
  },
  {
    title: 'Хронічна самотність & Страх близькості',
    category: 'Стосунки & Близькість',
    situation: 'Прагну глибоких стосунків, але як тільки хтось наближається, починаю шукати недоліки або дистанціюватися, щоб захистити себе від болю.',
    past: 'Болісний досвід зради в минулих тривалих стосунках.',
    future: 'Відкритися довірі, збудувати безпечну емоційну близькість без втрати власної автономії.',
    emotions: ['самотність', 'побоювання/недовіра', 'жалість до себе', 'Надія'],
  },
];

const PRESETS_EN = [
  {
    title: 'Fear of change: 9-to-5 vs Starting a business',
    category: 'Career & Business',
    situation: 'I have worked in a stable job for 6 years but feel completely burned out. I want to launch my own project, but I am paralyzed by the fear of losing financial security and facing judgment.',
    past: 'There was an attempt to launch a project 3 years ago that failed due to lack of planning.',
    future: 'Own an autonomous business, sustain current income, and feel profound meaning in my daily work.',
    emotions: ['Anxiety', 'Apprehension / Distrust', 'Regret / Grief', 'Fatigue / Burnout'],
  },
  {
    title: 'Relationship boundaries & Saying No',
    category: 'Relationships',
    situation: 'When family or partners criticize my decisions or demand favors, I cannot say "no", and later feel resentful toward myself and them.',
    past: 'In childhood, speaking up resulted in silent treatment or emotional withdrawal.',
    future: 'Confidently and peacefully uphold personal boundaries without guilt or relationship breakdown.',
    emotions: ['Self-Pity', 'Distress / Sorrow', 'Loneliness', 'Anger / Resentment'],
  },
  {
    title: 'Imposter syndrome & Public visibility',
    category: 'Self-Worth & Leadership',
    situation: 'Offered to lead a team and speak as an expert, but a recurring thought says: "I don\'t know enough, everyone will soon realize I am a fake".',
    past: 'Always discounted past achievements as lucky coincidences.',
    future: 'Build deep inner dignity, professional grounding, and courage to lead.',
    emotions: ['Apprehension / Distrust', 'Shame', 'Self-Pity'],
  },
  {
    title: 'Emotional Burnout & Loss of Meaning',
    category: 'Energy & State',
    situation: 'Achieved outward milestones, yet wake up without excitement or energy. Routine duties feel empty, and it is hard to discern the next meaningful horizon.',
    past: 'Worked 14-hour days for 5 straight years under hyper-control and constant emergency mode.',
    future: 'Rediscover authentic vitality, joy in daily life, and healthy balance between rest and creation.',
    emotions: ['Fatigue / Burnout', 'Powerlessness', 'Loneliness', 'Distress / Sorrow'],
  },
  {
    title: 'High-Stakes Procrastination & Perfectionism',
    category: 'Productivity',
    situation: 'Constantly postponing the release of my flagship project with micro-distractions. My inner perfectionist demands flawless execution or complete inaction.',
    past: 'Harsh public scrutiny in the past created an unconscious dread of making mistakes.',
    future: 'Create and launch projects with playful ease guided by the "good enough" (MVP) mindset.',
    emotions: ['Fear of Choice', 'Anxiety', 'Apprehension / Distrust', 'Regret / Grief'],
  },
  {
    title: 'Financial Anxiety & Income Ceiling',
    category: 'Wealth & Mindset',
    situation: 'Whenever income passes a certain threshold, unexpected expenses or self-sabotage occur. I feel an underlying unease around wealth and envy.',
    past: 'Family narrative that wealth is dangerous and cannot be earned honorably.',
    future: 'Feel grounded and worthy receiving abundant compensation and scaling impact.',
    emotions: ['Anxiety', 'Guilt', 'Apprehension / Distrust'],
  },
  {
    title: 'Life Crossroads & Decision Paralysis (FOMO)',
    category: 'Decisions & Choices',
    situation: 'Torn between three enticing paths. Fear of choosing the "wrong" option and missing out keeps me frozen in analysis paralysis.',
    past: 'Frequently pivoted domains out of fear of deep commitment and losing freedom.',
    future: 'Make a conscious, grounded decision and commit fully to the core trajectory.',
    emotions: ['Fear of Choice', 'Anxiety', 'Regret / Grief', 'Interest / Fascination'],
  },
  {
    title: 'Chronic Loneliness & Fear of Intimacy',
    category: 'Intimacy & Attachment',
    situation: 'I crave intimate connection, yet the moment someone draws close, I find flaws and pull away to shield myself from potential heartbreak.',
    past: 'Painful betrayal in a previous long-term relationship.',
    future: 'Cultivate emotional safety, vulnerability, and mutual trust without losing sovereignty.',
    emotions: ['Loneliness', 'Apprehension / Distrust', 'Self-Pity', 'Hope'],
  },
];

const PRESETS_RU = [
  {
    title: 'Страх перемен: найм vs собственное дело',
    category: 'Карьера & Бизнес',
    situation: 'Работаю на стабильной работе 6 лет, но чувствую полное выгорание. Хочу начать свой проект, но парализует страх потерять финансовую безопасность и столкнуться с осуждением близких.',
    past: 'Была попытка запуска другого проекта 3 года назад, которая провалилась из-за нехватки планирования.',
    future: 'Иметь автономное дело, доход не меньше текущего и ощущение смысла в том, что делаю каждый день.',
    emotions: ['Тревога', 'Опасения / Недоверие', 'Сожаление / Скорбь', 'Усталость / Выгорание'],
  },
  {
    title: 'Конфликт в отношениях & Личные границы',
    category: 'Отношения',
    situation: 'Когда партнер или родственники просят об услуге или критикуют мои решения, я не могу сказать «нет», а потом злюсь на себя и на них, накапливая обиду.',
    past: 'В детстве за проявление собственного мнения меня наказывали бойкотом и эмоциональным отчуждением.',
    future: 'Спокойно и уверенно отставать свои границы без чувства вины и разрушения отношений.',
    emotions: ['Жалость к себе', 'Огорчение', 'Одиночество', 'Злость / Раздражение'],
  },
  {
    title: 'Синдром самозванца & Страх публичности',
    category: 'Самооценка & Лидерство',
    situation: 'Получил предложение стать лидером команды и выступать экспертом, но в голове постоянно крутится мысль: «Я еще недостаточно знаю, скоро все поймут, что я шарлатан».',
    past: 'Всегда обесценивал свои достижения, списывая их на случайное стечение обстоятельств.',
    future: 'Почувствовать внутреннее достоинство, профессиональную опору и смело взять лидерство.',
    emotions: ['Опасения / Недоверие', 'Стыд', 'Жалость к себе'],
  },
  {
    title: 'Эмоциональное выгорание & Потеря смысла',
    category: 'Энергия & Состояние',
    situation: 'Достиг внешних целей, но просыпаюсь без радости и энергии. Привычные дела вызывают апатию, трудно понять, к чему стремиться дальше.',
    past: 'Последние 5 лет работал по 14 часов в сутки в режиме гиперконтроля и постоянной мобилизации.',
    future: 'Восстановить внутренний огонь, вкус к жизни и баланс между отдыхом и созиданием.',
    emotions: ['Усталость / Выгорание', 'Бессилие', 'Одиночество', 'Огорчение'],
  },
  {
    title: 'Прокрастинация важного проекта & Перфекционизм',
    category: 'Продуктивность',
    situation: 'Постоянно откладываю запуск важного авторского продукта, находя мелкие отвлекающие задачи. Внутренний критик требует идеала либо бездействия.',
    past: 'В прошлом был опыт жесткой публичной критики, закрепивший страх ошибки.',
    future: 'Легко создавать и выпускать проекты по принципу достаточно хорошего результата (MVP).',
    emotions: ['Страх выбора', 'Тревога', 'Опасения / Недоверие', 'Сожаление / Скорбь'],
  },
  {
    title: 'Финансовая тревога & Потолок доходов',
    category: 'Финансы & Мышление',
    situation: 'Как только доход превышает определенную планку, начинаются непредвиденные траты или самосаботаж. Чувствую подсознательный страх больших денег.',
    past: 'В семье была установка, что честным трудом много не заработаешь, а богатство опасно.',
    future: 'Спокойно принимать высокий доход, масштабировать деятельность без чувства вины.',
    emotions: ['Тревога', 'Вина', 'Опасения / Недоверие'],
  },
  {
    title: 'Кризис жизненного распутья (FOMO)',
    category: 'Выбор & Решения',
    situation: 'Есть три привлекательных направления развития, но парализован страхом сделать неправильный выбор и упустить другие возможности.',
    past: 'Часто менял сферы, боясь глубоких обязательств и потери свободы.',
    future: 'Сделать осознанный выбор и посвятить себя главному вектору.',
    emotions: ['Страх выбора', 'Тревога', 'Сожаление / Скорбь', 'Интерес / Увлечение'],
  },
  {
    title: 'Хроническое одиночество & Страх близости',
    category: 'Близость & Привязанность',
    situation: 'Хочу глубоких отношений, но как только кто-то приближается, начинаю искать изъяны и отдаляться, защищая себя от боли.',
    past: 'Болезненный опыт предательства в прошлых длительных отношениях.',
    future: 'Открыть сердце доверию, построить безопасную близость без потери суверенитета.',
    emotions: ['Одиночество', 'Опасения / Недоверие', 'Жалость к себе', 'Надежда'],
  },
];

const EMOTION_TAGS_UA = [
  'радість / натхнення',
  'жалість до себе',
  'самотність',
  'жаль / скорбота',
  'засмучення',
  'побоювання / недовіра',
  'огида',
  'здивування',
  'гордість / задоволення',
  'ейфорія / екстаз',
  'манія',
  'довіра',
  'доброта / дружелюбність',
  'інтерес / захоплення',
  'Тривога',
  'Страх вибору',
  'Провина',
  'Сором',
  'Злість / Роздратування',
  'Втома / Вигорання',
  'Безсилля',
  'Надія',
];

const EMOTION_TAGS_EN = [
  'Joy / Inspiration',
  'Self-Pity',
  'Loneliness',
  'Regret / Grief',
  'Distress / Sorrow',
  'Apprehension / Distrust',
  'Disgust',
  'Surprise / Wonder',
  'Pride / Satisfaction',
  'Euphoria / Ecstasy',
  'Mania / High Activation',
  'Trust / Faith',
  'Kindness / Friendliness',
  'Interest / Fascination',
  'Anxiety',
  'Fear of Choice',
  'Guilt',
  'Shame',
  'Anger / Resentment',
  'Fatigue / Burnout',
  'Powerlessness',
  'Hope',
];

const EMOTION_TAGS_RU = [
  'Радость / Вдохновение',
  'Жалость к себе',
  'Одиночество',
  'Сожаление / Скорбь',
  'Огорчение',
  'Опасения / Недоверие',
  'Отвращение',
  'Удивление / Изумление',
  'Гордость / Удовлетворение',
  'Эйфория / Экстаз',
  'Мания / Высокая активация',
  'Доверие / Вера',
  'Доброта / Дружелюбие',
  'Интерес / Увлечение',
  'Тревога',
  'Страх выбора',
  'Вина',
  'Стыд',
  'Злость / Раздражение',
  'Усталость / Выгорание',
  'Бессилие',
  'Надежда',
];

export const ConsiliumNavigator: React.FC<ConsiliumNavigatorProps> = ({
  onSendToGoalMakers,
  onSelectTab,
  onOpenGrounding,
  onSavedToJournal,
}) => {
  const { lang, t } = useThemeLanguage();
  const [situation, setSituation] = useState('');
  const [pastExperience, setPastExperience] = useState('');
  const [futureGoal, setFutureGoal] = useState('');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedApproach, setSelectedApproach] = useState<ApproachType>('comprehensive');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ConsiliumAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeActionModal, setActiveActionModal] = useState<{
    isOpen: boolean;
    actionText: string;
    timeframe: string;
  }>({
    isOpen: false,
    actionText: '',
    timeframe: '24h',
  });
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theoretical: true,
    jungian: true,
    dilts: true,
    beliefs: true,
    cbt: true,
    linetsky: true,
    gestalt: false,
    psychodynamics: false,
    somatic: false,
    existential: false,
    goalMakers: true,
  });

  const renderInlineToolChips = (text: string) => {
    const textLower = (text || '').toLowerCase();
    const chips: { label: string; onClick: () => void }[] = [];

    if (
      (textLower.includes('заземлен') ||
        textLower.includes('дихан') ||
        textLower.includes('соматик') ||
        textLower.includes('вегетатив')) &&
      onOpenGrounding
    ) {
      chips.push({
        label: lang === 'ru' ? '🌿 Заземление' : '🌿 Заземлення',
        onClick: onOpenGrounding,
      });
    }

    if (
      (textLower.includes('колес') || textLower.includes('баланс') || textLower.includes('сфер')) &&
      onSelectTab
    ) {
      chips.push({
        label: lang === 'ru' ? '🎯 Колесо Баланса' : '🎯 Колесо Балансу',
        onClick: () => onSelectTab('wheelOfBalance'),
      });
    }

    if (
      (textLower.includes('експеримент') || textLower.includes('кпт')) &&
      onSelectTab
    ) {
      chips.push({
        label: lang === 'ru' ? '📝 КПТ Дневник' : '📝 КПТ Щоденник',
        onClick: () => onSelectTab('cbt'),
      });
    }

    if (textLower.includes('цінност') && onSelectTab) {
      chips.push({
        label: lang === 'ru' ? '💎 Ценности' : '💎 Цінності',
        onClick: () => onSelectTab('values'),
      });
    }

    if ((textLower.includes('переконан') || textLower.includes('установк')) && onSelectTab) {
      chips.push({
        label: lang === 'ru' ? '🧠 Убеждения' : '🧠 Переконання',
        onClick: () => onSelectTab('beliefs'),
      });
    }

    if ((textLower.includes('smart') || textLower.includes('дедлайн') || textLower.includes('ціл')) && onSelectTab) {
      chips.push({
        label: lang === 'ru' ? '🎯 SMART Цель' : '🎯 SMART Ціль',
        onClick: () => onSelectTab('smartGoals'),
      });
    }

    if ((textLower.includes('рефлексі') || textLower.includes('стоїц')) && onSelectTab) {
      chips.push({
        label: lang === 'ru' ? '🌌 Рефлексия' : '🌌 Рефлексія',
        onClick: () => onSelectTab('selfReflection'),
      });
    }

    if ((textLower.includes('бажан') || textLower.includes('100')) && onSelectTab) {
      chips.push({
        label: lang === 'ru' ? '✨ 100 Желаний' : '✨ 100 Бажань',
        onClick: () => onSelectTab('hundredWishes'),
      });
    }

    if (!chips.length) return null;

    return (
      <div className="flex flex-wrap gap-1.5 pt-1">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              chip.onClick();
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-white/90 dark:bg-stone-900/90 px-2 py-0.5 text-[10px] font-bold text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer shadow-2xs"
          >
            <span>{chip.label}</span>
            <ArrowRight className="h-2.5 w-2.5 opacity-60" />
          </button>
        ))}
      </div>
    );
  };

  const presets = lang === 'ru' ? PRESETS_RU : lang === 'en' ? PRESETS_EN : PRESETS_UA;
  const emotionTags = lang === 'ru' ? EMOTION_TAGS_RU : lang === 'en' ? EMOTION_TAGS_EN : EMOTION_TAGS_UA;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleEmotion = (tag: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const applyPreset = (p: typeof PRESETS_UA[0]) => {
    setSituation(p.situation);
    setPastExperience(p.past);
    setFutureGoal(p.future);
    setSelectedEmotions(p.emotions);
  };

  const handleAnalyze = async () => {
    if (!situation.trim()) {
      setError(
        lang === 'ru'
          ? 'Пожалуйста, опишите вашу ситуацию или дилемму.'
          : lang === 'en'
          ? 'Please describe your situation or dilemma.'
          : 'Будь ласка, опишіть вашу ситуацію або питання.'
      );
      return;
    }
    setError(null);
    setIsLoading(true);
    setIsSaved(false);

    try {
      const result = await requestConsiliumAnalysis({
        situation,
        pastExperience,
        futureGoal,
        approach: selectedApproach,
        emotions: selectedEmotions,
      });
      setAnalysis(result);

      logUserActivity({
        tab: 'consilium',
        toolName: 'Інтегративний Консиліум ШІ',
        querySummary: situation.slice(0, 120),
        category: 'Consilium',
      });
    } catch (err: any) {
      setError(
        err?.message ||
          (lang === 'ru'
            ? 'Не удалось провести анализ. Попробуйте еще раз.'
            : lang === 'en'
            ? 'Analysis request failed. Please try again.'
            : 'Не вдалося провести аналіз. Спробуйте ще раз.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!analysis) return;
    saveJournalEntry({
      type: 'consilium',
      title: `${lang === 'ru' ? 'Консилиум' : lang === 'en' ? 'Consilium' : 'Консиліум'}: ${situation.slice(0, 45)}...`,
      summary: analysis.summary,
      data: {
        situation,
        pastExperience,
        futureGoal,
        emotions: selectedEmotions,
        approach: selectedApproach,
        analysis,
      },
    });
    setIsSaved(true);
    if (onSavedToJournal) onSavedToJournal();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-2 sm:p-4">
      {/* Hero Intro */}
      <div className="space-y-1.5 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
          <Compass className="h-3.5 w-3.5" />
          {t('consilium_title', 'Мультимодальний Психологічний Консиліум')}
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
          {lang === 'ru'
            ? 'Разбор сложных ситуаций, кризисов и поиск выхода'
            : lang === 'en'
            ? 'Case Resolution, Life Dilemmas & Psychological Consilium'
            : 'Розбір складних ситуацій, криз та пошук виходу'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-3xl leading-relaxed">
          {t('consilium_subtitle')}
        </p>
      </div>

      {/* Situation Form Container */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-6 shadow-sm space-y-5">
        {/* Preset selector dropdown & chips */}
        <div className="space-y-2.5 rounded-xl bg-stone-50/80 dark:bg-stone-950/60 p-3 border border-stone-200/80 dark:border-stone-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
            <span className="flex items-center gap-1.5 font-semibold text-teal-700 dark:text-teal-400">
              <Compass className="w-3.5 h-3.5" />
              {lang === 'ru'
                ? 'Примеры запросов и сценариев для разбора:'
                : lang === 'en'
                ? 'Example queries & life scenarios for analysis:'
                : 'Приклади запитів та сценаріїв для розбору:'}
            </span>
            <span className="text-[11px] text-stone-400">
              {lang === 'ru'
                ? 'Выберите из списка или нажмите кнопку:'
                : lang === 'en'
                ? 'Select from list or click chips:'
                : 'Оберіть зі списку або натисніть кнопку:'}
            </span>
          </div>

          {/* Dropdown list */}
          <div>
            <select
              aria-label={
                lang === 'ru'
                  ? 'Выпадающий список сценариев'
                  : lang === 'en'
                  ? 'Scenarios dropdown'
                  : 'Випадаючий список сценаріїв'
              }
              defaultValue=""
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                if (!isNaN(idx) && presets[idx]) {
                  applyPreset(presets[idx]);
                }
              }}
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs text-stone-800 dark:text-stone-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            >
              <option value="" disabled>
                {lang === 'ru'
                  ? '▼ Выберите готовый сценарий / шаблон запроса...'
                  : lang === 'en'
                  ? '▼ Select a ready-made scenario / template query...'
                  : '▼ Оберіть готовий сценарій / шаблон запиту...'}
              </option>
              {presets.map((p, idx) => (
                <option key={idx} value={idx}>
                  [{p.category}] {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-2.5 py-1 text-[11px] text-stone-700 dark:text-stone-300 transition-all hover:border-teal-500/50 hover:bg-stone-100 dark:hover:bg-stone-800 active:scale-95 text-left cursor-pointer shadow-2xs"
              >
                <span className="text-teal-600 dark:text-teal-400 font-semibold mr-1">[{p.category}]</span>
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Core input: Situation */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200">
              1. {t('situation_label', 'Опишіть вашу ситуацію, сумніви чи конфлікт')} <span className="text-rose-500">*</span>
            </label>
            <VoiceInputButton
              id="voice-input-situation"
              currentValue={situation}
              onTranscript={(text) => setSituation(text)}
              fieldLabel={
                lang === 'ru'
                  ? 'Ситуация / Запрос'
                  : lang === 'en'
                  ? 'Situation / Dilemma'
                  : 'Ситуація / Запит'
              }
            />
          </div>
          <textarea
            rows={4}
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder={t('situation_placeholder')}
            className="w-full rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3.5 py-2.5 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Additional 2 columns: Past experience & Future goal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                2.{' '}
                {lang === 'ru'
                  ? 'Прошлый опыт или предыстория (Опционально)'
                  : lang === 'en'
                  ? 'Past experience & background (Optional)'
                  : 'Минулий досвід чи передісторія (Опціонально)'}
              </label>
              <VoiceInputButton
                id="voice-input-past"
                currentValue={pastExperience}
                onTranscript={(text) => setPastExperience(text)}
                fieldLabel={
                  lang === 'ru' ? 'Прошлый опыт' : lang === 'en' ? 'Past experience' : 'Минулий досвід'
                }
              />
            </div>
            <textarea
              rows={3}
              value={pastExperience}
              onChange={(e) => setPastExperience(e.target.value)}
              placeholder={
                lang === 'ru'
                  ? 'Случалось ли подобное ранее? Какие старые паттерны или реакции вы замечаете?'
                  : lang === 'en'
                  ? 'Did something similar happen before? What old childhood echoes do you notice?'
                  : 'Чи траплялося подібне раніше? Які старі патерни чи реакції ви помічаєте?'
              }
              className="w-full rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                3.{' '}
                {lang === 'ru'
                  ? 'Желаемый результат / Будущие цели (Опционально)'
                  : lang === 'en'
                  ? 'Desired outcome & Future goals (Optional)'
                  : 'Бажаний вихід / Майбутні цілі (Опціонально)'}
              </label>
              <VoiceInputButton
                id="voice-input-future"
                currentValue={futureGoal}
                onTranscript={(text) => setFutureGoal(text)}
                fieldLabel={
                  lang === 'ru'
                    ? 'Желаемый результат'
                    : lang === 'en'
                    ? 'Desired outcome'
                    : 'Бажаний вихід / Цілі'
                }
              />
            </div>
            <textarea
              rows={3}
              value={futureGoal}
              onChange={(e) => setFutureGoal(e.target.value)}
              placeholder={
                lang === 'ru'
                  ? 'Какой результат будет лучшим для вас? Чего бы вы хотели достичь?'
                  : lang === 'en'
                  ? 'What would be the best resolution for you?'
                  : 'Який результат буде найкращим для вас? Чого б ви хотіли досягти?'
              }
              className="w-full rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Emotion Tags */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            4. {t('emotions_tag_label', 'Які емоції ви відчуваєте просто зараз?')}
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-stone-200 dark:border-stone-800 rounded-xl custom-scrollbar">
            {emotionTags.map((tag) => {
              const isSelected = selectedEmotions.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleEmotion(tag)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/50 shadow-xs font-semibold'
                      : 'border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Approach Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            5. {t('approach_focus_label', 'Пріоритетний фокус консиліуму')}
          </label>
          <select
            value={selectedApproach}
            onChange={(e) => setSelectedApproach(e.target.value as ApproachType)}
            className="w-full rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3.5 py-2 text-xs text-stone-900 dark:text-stone-200 focus:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          >
            <option value="comprehensive">✨ {t('focus_all')}</option>
            <option value="cbt">🧠 {t('focus_cbt')}</option>
            <option value="natural_linetsky">🌊 {t('focus_linetsky')}</option>
            <option value="gestalt">👁️ {t('focus_gestalt')}</option>
            <option value="psychodynamic">🗝️ {t('focus_psychodynamics')}</option>
            <option value="client_centered">
              🌱{' '}
              {lang === 'ru'
                ? 'Клиент-центрированная терапия Роджерса (Внутренний авторитет)'
                : lang === 'en'
                ? 'Client-Centered Rogerian Therapy (Inner Locus)'
                : 'Клієнт-центрована терапія Роджерса (Внутрішній авторитет)'}
            </option>
            <option value="somatic">🧘 {t('focus_somatic')}</option>
            <option value="existential">🌌 {t('focus_existential')}</option>
            <option value="coaching_grow">🎯 {t('focus_coaching')}</option>
          </select>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-800 dark:text-rose-200">
            <div className="flex items-start gap-2">
              <span className="text-base">⚠️</span>
              <div className="space-y-0.5">
                <span className="font-semibold block">
                  {lang === 'ru'
                    ? 'Не удалось выполнить запрос анализа'
                    : lang === 'en'
                    ? 'Unable to complete analysis right now'
                    : 'Не вдалося виконати запит аналізу'}
                </span>
                <span className="text-rose-700 dark:text-rose-300 leading-relaxed">{error}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="self-start sm:self-auto shrink-0 rounded-lg bg-rose-600 dark:bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
            >
              {lang === 'ru' ? 'Попробовать снова' : lang === 'en' ? 'Retry Analysis' : 'Спробувати ще раз'}
            </button>
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white dark:text-stone-950 shadow-md hover:bg-teal-500 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t('btn_analyzing', 'Проводимо аналіз...')}</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>{t('btn_analyze_ai', 'Запустити Консиліум AI')}</span>
              </>
            )}
          </button>

          <span className="text-[11px] text-stone-500 dark:text-stone-400">
            {lang === 'ru'
              ? 'Научно выверенные протоколы • Безопасный мультимодальный анализ'
              : lang === 'en'
              ? 'Validated protocols • Safe multimodal analysis'
              : 'Науково вивірені протоколи • Безпечний аналіз'}
          </span>
        </div>
      </div>

      {/* Analysis Results View */}
      {analysis && (
        <div className="space-y-5 pt-2 animate-in fade-in duration-300">
          {/* Top Bar with Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-xs">
            <div>
              <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                {lang === 'ru'
                  ? 'Результаты консилиума готовы'
                  : lang === 'en'
                  ? 'Consilium synthesis ready'
                  : 'Результати консиліуму готові'}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                {lang === 'ru'
                  ? 'Глубинный Интегральный Разбор Ситуации'
                  : lang === 'en'
                  ? 'Deep Integrative Case Diagnosis'
                  : 'Глибинний Інтегральний Розбір Ситуації'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaved}
                className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('btn_saved', 'Збережено!')}</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="h-3.5 w-3.5" />
                    <span>{t('btn_save_to_journal', 'Зберегти в Журнал')}</span>
                  </>
                )}
              </button>
              {onSendToGoalMakers && (
                <button
                  type="button"
                  onClick={() =>
                    onSendToGoalMakers({
                      title: analysis.coreDilemma || situation.slice(0, 40),
                      pointA: situation,
                      pointB:
                        futureGoal ||
                        (lang === 'ru'
                          ? 'Достижение ясности и стабильности'
                          : lang === 'en'
                          ? 'Clarity & psychological stability'
                          : 'Досягнення ясності та стабільності'),
                      action24h: analysis.goalMakersActionPlan.immediate24hStep,
                    })
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 px-3.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
                >
                  <Swords className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t('btn_transfer_to_goals', 'Передати в Goal Makers')}</span>
                </button>
              )}
            </div>
          </div>

          {/* 1. Executive Summary & Core Dilemma */}
          <div className="rounded-2xl border-2 border-teal-500/30 bg-teal-50/40 dark:bg-stone-900 p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
              {lang === 'ru'
                ? 'Интегративный Диагноз и Главная Дилемма'
                : lang === 'en'
                ? 'Integrative Diagnosis & Core Paradox'
                : 'Інтегративний Діагноз та Головна Дилема'}
            </h3>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100 leading-relaxed">
              {analysis.summary}
            </p>
            {analysis.coreDilemma && (
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 text-xs text-stone-800 dark:text-stone-200">
                <span className="font-bold text-teal-900 dark:text-teal-300 block mb-0.5">
                  ⚖️{' '}
                  {lang === 'ru'
                    ? 'Глубинное противоречие:'
                    : lang === 'en'
                    ? 'Core Subconscious Dilemma:'
                    : 'Глибинне протиріччя:'}
                </span>
                {analysis.coreDilemma}
              </div>
            )}
          </div>

          {/* NEW: Analytical Psychology (Jungian Archetype & Shadow Integration) */}
          {analysis.therapeuticPerspectives?.jungianAnalytical && (
            <div className="rounded-2xl border border-purple-800/40 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {lang === 'ru'
                        ? 'Аналитическая психология Карла Юнга: Архетипы, Тень & Самость'
                        : lang === 'en'
                        ? 'Carl Jung’s Analytical Psychology: Archetypes, Shadow & Self'
                        : 'Аналітична психологія Карла Юнга: Архетипи, Тінь & Самість'}
                    </h3>
                    <p className="text-[11px] text-purple-300/80">
                      {lang === 'ru'
                        ? 'Диагностика бессознательных комплексов и путь к Индивидуации'
                        : lang === 'en'
                        ? 'Subconscious complex diagnostics & path to Individuation'
                        : 'Діагностика несвідомих комплексів та шлях до Індивідуації'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-900/50 space-y-1">
                  <span className="text-purple-400 font-bold uppercase text-[11px]">
                    {lang === 'ru' ? 'Активный Архетип:' : lang === 'en' ? 'Active Archetype:' : 'Активний Архетип:'}
                  </span>
                  <p className="text-slate-200 font-medium">
                    {analysis.therapeuticPerspectives.jungianAnalytical.activeArchetype}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-900/50 space-y-1">
                  <span className="text-rose-400 font-bold uppercase text-[11px]">
                    {lang === 'ru' ? 'Теневой Элемент (Shadow):' : lang === 'en' ? 'Shadow Element:' : 'Тіньовий Елемент (Shadow):'}
                  </span>
                  <p className="text-slate-200 font-medium">
                    {analysis.therapeuticPerspectives.jungianAnalytical.shadowElement}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs space-y-1">
                <span className="text-purple-300 font-bold uppercase text-[11px]">
                  {lang === 'ru'
                    ? 'Задача Индивидуации (Ego Growth):'
                    : lang === 'en'
                    ? 'Individuation Task (Ego Growth):'
                    : 'Завдання Індивідуації (Ego Growth):'}
                </span>
                <p className="text-purple-100 leading-relaxed">
                  {analysis.therapeuticPerspectives.jungianAnalytical.individuationTask}
                </p>
              </div>

              {analysis.therapeuticPerspectives.jungianAnalytical.synchronicityOrSymbolPrompt && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-0.5">
                  <span className="text-amber-400 font-bold">
                    {lang === 'ru'
                      ? 'Символ & Синхроничность:'
                      : lang === 'en'
                      ? 'Symbol & Synchronicity:'
                      : 'Символ & Синхронічність:'}
                  </span>
                  <p className="text-slate-300 italic">
                    {analysis.therapeuticPerspectives.jungianAnalytical.synchronicityOrSymbolPrompt}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* NEW: Dilts Logical Levels of Change */}
          {analysis.diltsLogicalLevels && (
            <div className="rounded-2xl border border-indigo-800/40 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ru'
                      ? 'Пирамида логических уровней Роберта Дилтса'
                      : lang === 'en'
                      ? 'Robert Dilts Logical Levels of Change'
                      : 'Піраміда логічних рівнів Роберта Ділтса'}
                  </h3>
                  <p className="text-[11px] text-indigo-300/80">
                    {lang === 'ru'
                      ? 'Уровень проблемы vs Уровень нахождения системного решения'
                      : lang === 'en'
                      ? 'Problem Level vs Systemic Solution Level'
                      : 'Рівень проблеми vs Рівень знаходження системного розвʼязку'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-700/50 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    {lang === 'ru'
                      ? 'Диагностированный уровень проблемы:'
                      : lang === 'en'
                      ? 'Diagnosed problem level:'
                      : 'Діагностований рівень проблеми:'}
                  </span>
                  <strong className="text-rose-400 text-sm">{analysis.diltsLogicalLevels.identifiedProblemLevelName}</strong>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-400 hidden sm:block" />
                <div>
                  <span className="text-slate-400 text-[11px] block">
                    {lang === 'ru'
                      ? 'Рекомендуемый уровень решения:'
                      : lang === 'en'
                      ? 'Recommended solution level:'
                      : 'Рекомендований рівень розвʼязку:'}
                  </span>
                  <strong className="text-emerald-400 text-sm">{analysis.diltsLogicalLevels.recommendedSolutionLevelName}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                {analysis.diltsLogicalLevels.solutionShiftGuidance}
              </p>
            </div>
          )}

          {/* NEW: Belief Patterning & Sleight of Mouth */}
          {analysis.beliefPatterning && (
            <div className="rounded-2xl border border-amber-800/40 bg-slate-900/90 p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ru'
                      ? 'Паттеринг убеждений & Трансформация'
                      : lang === 'en'
                      ? 'Belief Patterning & Sleight of Mouth'
                      : 'Патеринг переконань & Трансформація'}
                  </h3>
                  <p className="text-[11px] text-amber-300/80">
                    {lang === 'ru'
                      ? 'Деконструкция ограничивающей установки и новое освобождающее ядро'
                      : lang === 'en'
                      ? 'Deconstruction of limiting beliefs and liberating core shifts'
                      : 'Деконструкція обмежуючої установки та нове визвольне ядро'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40">
                  <span className="text-rose-400 font-bold block mb-1">
                    {lang === 'ru' ? 'Ограничивающее убеждение:' : lang === 'en' ? 'Limiting belief:' : 'Обмежуюче переконання:'}
                  </span>
                  <p className="text-slate-200">«{analysis.beliefPatterning.limitingBelief}»</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                  <span className="text-emerald-400 font-bold block mb-1">
                    {lang === 'ru' ? 'Освобождающее новое ядро:' : lang === 'en' ? 'Liberating core shift:' : 'Визвольне нове ядро:'}
                  </span>
                  <p className="text-slate-200 font-medium">«{analysis.beliefPatterning.liberatingCoreBelief}»</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Theoretical Perspectives */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('theoretical')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-stone-50 dark:bg-stone-950/40 text-left hover:bg-stone-100 dark:hover:bg-stone-950/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {lang === 'ru'
                    ? 'Общепсихологический и Нейрофизиологический базис'
                    : lang === 'en'
                    ? 'General Psychological & Neuro-Physiological Pillars'
                    : 'Загальнопсихологічний та Нейрофізіологічний базис'}
                </h3>
              </div>
              {expandedSections.theoretical ? (
                <ChevronUp className="h-4 w-4 text-stone-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-500" />
              )}
            </button>

            {expandedSections.theoretical && (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-stone-200 dark:border-stone-800 text-xs">
                <div className="space-y-1">
                  <strong className="text-stone-800 dark:text-stone-200 block text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                    {lang === 'ru'
                      ? 'Общая психология и фокус внимания:'
                      : lang === 'en'
                      ? 'Cognitive & Attentional Focus'
                      : 'Загальна психологія та фокус уваги:'}
                  </strong>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {analysis.theoreticalInsights.generalPsychology}
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-stone-800 dark:text-stone-200 block text-xs font-semibold text-teal-700 dark:text-teal-400">
                    {lang === 'ru'
                      ? 'Возрастная динамика и этап развития:'
                      : lang === 'en'
                      ? 'Developmental Crisis Pattern'
                      : 'Вікова динаміка та етап розвитку:'}
                  </strong>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {analysis.theoreticalInsights.developmentalPattern}
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-stone-800 dark:text-stone-200 block text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {lang === 'ru'
                      ? 'Социальная динамика и интроекты:'
                      : lang === 'en'
                      ? 'Social Context & Introjected Roles'
                      : 'Соціальна динаміка та інтроєкти:'}
                  </strong>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {analysis.theoreticalInsights.socialDynamics}
                  </p>
                </div>
                <div className="space-y-1">
                  <strong className="text-stone-800 dark:text-stone-200 block text-xs font-semibold text-rose-700 dark:text-rose-400">
                    {lang === 'ru'
                      ? 'Психофизиология и вегетативное напряжение:'
                      : lang === 'en'
                      ? 'Psychophysiological & Somatic State'
                      : 'Психофізіологія та вегетативне напруження:'}
                  </strong>
                  <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                    {analysis.theoreticalInsights.psychophysiology}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Natural Approach (Linetsky) */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('linetsky')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-stone-50 dark:bg-stone-950/40 text-left hover:bg-stone-100 dark:hover:bg-stone-950/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Compass className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {lang === 'ru'
                    ? 'Естественный подход (Линецкий): Присутствие & Растворение сопротивления'
                    : lang === 'en'
                    ? 'Natural Approach (Linetsky): Non-Dual Awareness & Presence'
                    : 'Природний підхід (Лінецький): Присутність & Розчинення опору'}
                </h3>
              </div>
              {expandedSections.linetsky ? (
                <ChevronUp className="h-4 w-4 text-stone-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-500" />
              )}
            </button>

            {expandedSections.linetsky && (
              <div className="p-5 space-y-4 border-t border-stone-200 dark:border-stone-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5 space-y-1">
                    <span className="font-semibold text-teal-800 dark:text-teal-300 block">
                      ⚡ {t('linetsky_tension_title', 'Напруга «Як є» vs «Як має бути»:')}
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {analysis.therapeuticPerspectives.naturalApproachLinetsky.isVsShouldBeTension}
                    </p>
                  </div>
                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3.5 space-y-1">
                    <span className="font-semibold text-teal-800 dark:text-teal-300 block">
                      🕊️ {t('effortless_awareness_title', 'Невимушене усвідомлення:')}
                    </span>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {analysis.therapeuticPerspectives.naturalApproachLinetsky.effortlessAwarenessInsight}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. CBT Analysis */}
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('cbt')}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-stone-50 dark:bg-stone-950/40 text-left hover:bg-stone-100 dark:hover:bg-stone-950/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Brain className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {lang === 'ru'
                    ? 'Когнитивно-поведенческая терапия (КПТ): Мысли & Когнитивные искажения'
                    : lang === 'en'
                    ? 'Cognitive Behavioral Therapy (CBT): Thoughts & Distortions'
                    : 'Когнітивно-поведінкова терапія (КПТ): Думки & Помилки мислення'}
                </h3>
              </div>
              {expandedSections.cbt ? (
                <ChevronUp className="h-4 w-4 text-stone-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-500" />
              )}
            </button>

            {expandedSections.cbt && (
              <div className="p-5 space-y-4 border-t border-stone-200 dark:border-stone-800 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="rounded-xl border border-rose-500/20 bg-rose-50 dark:bg-rose-950/10 p-3.5 space-y-2">
                    <span className="font-semibold text-rose-800 dark:text-rose-300 block">
                      ⚠️{' '}
                      {lang === 'ru'
                        ? 'Автоматические мысли & Искажения:'
                        : lang === 'en'
                        ? 'Automatic Thoughts & Distortions:'
                        : 'Автоматичні думки & Спотворення:'}
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-stone-700 dark:text-stone-300">
                      {analysis.therapeuticPerspectives.cbt.automaticThoughts.map((at, i) => (
                        <li key={i}>{at}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/10 p-3.5 space-y-2">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                      🌱{' '}
                      {lang === 'ru'
                        ? 'Рациональные альтернативные убеждения:'
                        : lang === 'en'
                        ? 'Rational Alternative Thoughts:'
                        : 'Раціональні альтернативні переконання:'}
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-stone-700 dark:text-stone-300">
                      {analysis.therapeuticPerspectives.cbt.rationalAlternatives.map((ra, i) => (
                        <li key={i}>{ra}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sky-800 dark:text-sky-300 block">
                      🔬{' '}
                      {lang === 'ru'
                        ? 'Поведенческий эксперимент для проверки реальностью:'
                        : lang === 'en'
                        ? 'Behavioral Experiment:'
                        : 'Поведінковий експеримент для перевірки реальністю:'}
                    </span>
                    {onSelectTab && (
                      <button
                        type="button"
                        onClick={() => onSelectTab('cbt')}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        <span>{lang === 'ru' ? 'КПТ Дневник' : 'КПТ Щоденник'}</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {analysis.therapeuticPerspectives.cbt.behavioralExperiment}
                  </p>
                  {renderInlineToolChips(analysis.therapeuticPerspectives.cbt.behavioralExperiment)}
                  <button
                    type="button"
                    onClick={() =>
                      setActiveActionModal({
                        isOpen: true,
                        actionText: analysis.therapeuticPerspectives.cbt.behavioralExperiment,
                        timeframe: 'experiment',
                      })
                    }
                    className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 px-3 py-1.5 text-[11px] font-bold text-sky-800 dark:text-sky-300 transition-colors cursor-pointer"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'ru'
                        ? 'Как провести эксперимент пошагово'
                        : lang === 'en'
                        ? 'How to conduct experiment step-by-step'
                        : 'Як провести експеримент покроково'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Goal Makers Action Roadmap */}
          <div className="rounded-2xl border-2 border-amber-500/40 bg-white dark:bg-stone-900/95 p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-stone-950 shadow-md">
                  <Swords className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {lang === 'ru'
                      ? 'Коучинговая Стратегия'
                      : lang === 'en'
                      ? 'Action Roadmap'
                      : 'Коучингова Стратегія'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                    {t('action_plan_title', 'Покроковий план дій та дорожня карта')}
                  </h3>
                </div>
              </div>

              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('smartGoals')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 transition-all cursor-pointer"
                >
                  <Target className="h-3.5 w-3.5" />
                  <span>
                    {lang === 'ru'
                      ? 'Оформить по SMART & WOOP'
                      : 'Оформити по SMART & WOOP'}
                  </span>
                  <ArrowRight className="h-3 w-3 opacity-70" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              {/* 24h Action */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-50/60 dark:bg-stone-950/80 p-3.5 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold text-xs">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{t('action_24h', '24 години: Перший мікро-крок')}</span>
                  </div>
                  <p className="text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                    {analysis.goalMakersActionPlan.immediate24hStep}
                  </p>
                  {renderInlineToolChips(analysis.goalMakersActionPlan.immediate24hStep)}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveActionModal({
                      isOpen: true,
                      actionText: analysis.goalMakersActionPlan.immediate24hStep,
                      timeframe: '24h',
                    })
                  }
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-2.5 py-1.5 text-[11px] font-bold text-amber-900 dark:text-amber-300 transition-all cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>{t('how_to_perform_btn', 'Як це виконувати (покрокова інструкція)')}</span>
                </button>
              </div>

              {/* 7d Action */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/80 p-3.5 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs">
                    <Compass className="h-3.5 w-3.5" />
                    <span>{t('action_7d', '7 днів: Закріплення та експеримент')}</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {analysis.goalMakersActionPlan.shortTerm7dMilestone}
                  </p>
                  {renderInlineToolChips(analysis.goalMakersActionPlan.shortTerm7dMilestone)}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveActionModal({
                      isOpen: true,
                      actionText: analysis.goalMakersActionPlan.shortTerm7dMilestone,
                      timeframe: '7d',
                    })
                  }
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 px-2.5 py-1.5 text-[11px] font-bold text-teal-900 dark:text-teal-300 transition-all cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>{t('how_to_perform_btn', 'Як це виконувати (покрокова інструкція)')}</span>
                </button>
              </div>

              {/* 30d Action */}
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/80 p-3.5 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t('action_30d', '30 днів: Системна звичка та інтеграція')}</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {analysis.goalMakersActionPlan.longTerm30dStrategy}
                  </p>
                  {renderInlineToolChips(analysis.goalMakersActionPlan.longTerm30dStrategy)}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveActionModal({
                      isOpen: true,
                      actionText: analysis.goalMakersActionPlan.longTerm30dStrategy,
                      timeframe: '30d',
                    })
                  }
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 px-2.5 py-1.5 text-[11px] font-bold text-sky-900 dark:text-sky-300 transition-all cursor-pointer"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>{t('how_to_perform_btn', 'Як це виконувати (покрокова інструкція)')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-Step Action Guide Modal */}
      <ActionStepByStepModal
        isOpen={activeActionModal.isOpen}
        onClose={() => setActiveActionModal((prev) => ({ ...prev, isOpen: false }))}
        actionText={activeActionModal.actionText}
        timeframe={activeActionModal.timeframe}
        situationContext={situation}
        onSelectTab={onSelectTab}
        onOpenGrounding={onOpenGrounding}
        onSavedToJournal={onSavedToJournal}
      />
    </div>
  );
};

export default ConsiliumNavigator;
