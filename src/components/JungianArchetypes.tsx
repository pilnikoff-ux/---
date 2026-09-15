import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  Sparkles,
  Shield,
  Crown,
  Heart,
  Lightbulb,
  Zap,
  Feather,
  BookOpen,
  Smile,
  Users,
  Target,
  RefreshCw,
  CheckCircle,
  Save,
  Flame,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { requestArchetypesDeepInsight } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { logUserActivity } from '../services/userStatsService';
import { JungianArchetypeScore, JungianArchetypeProfile } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

interface ArchetypeDef {
  id: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  cardinalMottoUk: string;
  cardinalMottoRu: string;
  cardinalMottoEn: string;
  coreDesireUk: string;
  goalUk: string;
  fearUk: string;
  strategyUk: string;
  weaknessUk: string;
  talentUk: string;
  shadowUk: string;
  color: string;
  icon: any;
  testQuestions: { qUk: string; qRu: string; qEn: string }[];
}

const ARCHETYPES_CATALOG: ArchetypeDef[] = [
  {
    id: 'creator',
    nameUk: 'Творець',
    nameRu: 'Творец',
    nameEn: 'Creator',
    cardinalMottoUk: '«Якщо це можна уявити, це можна створити»',
    cardinalMottoRu: '«Если это можно вообразить, это можно создать»',
    cardinalMottoEn: '«If you can imagine it, it can be created»',
    coreDesireUk: 'Створити речі, які мають вічну цінність та красу',
    goalUk: 'Втілити своє бачення в унікальну форму',
    fearUk: 'Посередність, відсутність натхнення, неоригінальність',
    strategyUk: 'Розвиток артистичного бачення та художньої майстерності',
    weaknessUk: 'Перфекціонізм, самокритика, прокрастинація через страх неідеальності',
    talentUk: 'Креативність, уява, здатність створювати нові світи',
    shadowUk: 'Нарцисичний деміург: знецінення того, що зроблено іншими; постійне незадоволення своїми роботами',
    color: 'from-amber-500 to-orange-600',
    icon: Sparkles,
    testQuestions: [
      { qUk: 'Я відчуваю глибоку потребу створювати нові ідеї, проекти або твори мистецтва.', qRu: 'Я чувствую глубокую потребность создавать новые идеи, проекты или произведения искусства.', qEn: 'I feel a deep need to create new ideas, projects, or works of art.' },
      { qUk: 'Мене дратує шаблонність і копіювання чужих ідей.', qRu: 'Меня раздражает шаблонность и копирование чужих идей.', qEn: 'I am annoyed by clichés and copying others\' ideas.' },
    ],
  },
  {
    id: 'hero',
    nameUk: 'Герой / Воїн',
    nameRu: 'Герой / Воин',
    nameEn: 'Hero / Warrior',
    cardinalMottoUk: '«Де є воля, там є шлях»',
    cardinalMottoRu: '«Где есть воля, там есть путь»',
    cardinalMottoEn: '«Where there\'s a will, there\'s a way»',
    coreDesireUk: 'Довести свою спроможність через мужні вчинки',
    goalUk: 'Здобути майстерність та перемогти труднощі',
    fearUk: 'Слабкість, вразливість, поразка, капітуляція',
    strategyUk: 'Ставати сильнішим, компетентнішим та дисциплінованішим',
    weaknessUk: 'Зарозумілість, невміння відпочивати, потреба завжди з кимось боротися',
    talentUk: 'Компетентність, мужність, рішучість, захист слабких',
    shadowUk: 'Тиран або безжалісний завойовник: сприйняття світу як вічної війни; зневага до спокою',
    color: 'from-rose-500 to-red-600',
    icon: Shield,
    testQuestions: [
      { qUk: 'Виклики та труднощі мотивують мене діяти з подвійною енергією.', qRu: 'Вызовы и трудности мотивируют меня действовать с удвоенной энергией.', qEn: 'Challenges and difficulties motivate me to act with double energy.' },
      { qUk: 'Для мене критично важливо долати власні обмеження та перемагати.', qRu: 'Для меня критически важно преодолевать собственные ограничения и побеждать.', qEn: 'It is critical for me to overcome my limits and win.' },
    ],
  },
  {
    id: 'sage',
    nameUk: 'Мудрець / Філософ',
    nameRu: 'Мудрец / Философ',
    nameEn: 'Sage / Thinker',
    cardinalMottoUk: '«Істина зробить вас вільними»',
    cardinalMottoRu: '«Истина сделает вас свободными»',
    cardinalMottoEn: '«The truth will set you free»',
    coreDesireUk: 'Знайти істину, зрозуміти закони всесвіту і людської психіки',
    goalUk: 'Використовувати інтелект для осягнення світу',
    fearUk: 'Бути обдуреним, невігластво, ілюзії',
    strategyUk: 'Пошук інформації, самоаналіз, глибоке дослідження фактів',
    weaknessUk: 'Відрив від реальності, нескінченне вивчення без конкретних дій',
    talentUk: 'Мудрість, аналітичний розум, здатність бачити глибинні закономірності',
    shadowUk: 'Холодний цинік: знецінення емоцій, інтелектуальний снобізм, параліч аналізом',
    color: 'from-blue-500 to-indigo-600',
    icon: BookOpen,
    testQuestions: [
      { qUk: 'Я завжди прагну докопатися до суті та першопричин будь-якого явища.', qRu: 'Я всегда стремлюсь докопаться до сути и первопричин любого явления.', qEn: 'I always seek to get to the root cause of any phenomenon.' },
      { qUk: 'Знання, логіка та обʼєктивність для мене важливіші за імпульсивні емоції.', qRu: 'Знания, логика и объективность для меня важнее импульсивных эмоций.', qEn: 'Knowledge, logic, and objectivity are more important than impulses.' },
    ],
  },
  {
    id: 'explorer',
    nameUk: 'Шукач / Мандрівник',
    nameRu: 'Искатель / Странник',
    nameEn: 'Explorer / Seeker',
    cardinalMottoUk: '«Не обмежуй мене»',
    cardinalMottoRu: '«Не ограничивай меня»',
    cardinalMottoEn: '«Don\'t fence me in»',
    coreDesireUk: 'Свобода досліджувати світ, щоб пізнати себе',
    goalUk: 'Автентичне, насичене пригодами життя',
    fearUk: 'Рутина, обмеження, застрягання у конформізмі',
    strategyUk: 'Подорожі, пошук нового досвіду, втеча від одноманітності',
    weaknessUk: 'Бродяжництво, нездатність пустити коріння чи взяти довгострокові зобовʼязання',
    talentUk: 'Автономія, відкритість до нового, вірність своїй внутрішній правді',
    shadowUk: 'Вічний утікач: нездатність до близькості, втеча від реальних викликів у нові декорації',
    color: 'from-emerald-500 to-teal-600',
    icon: Compass,
    testQuestions: [
      { qUk: 'Свобода та можливість відкривати нове для мене дорожчі за передбачуваний комфорт.', qRu: 'Свобода и возможность открывать новое для меня дороже предсказуемого комфорта.', qEn: 'Freedom and exploring new paths are more valuable to me than comfort.' },
      { qUk: 'Я відчуваю задуху, коли потрапляю в жорсткі рамки та одноманітну рутину.', qRu: 'Я задыхаюсь, когда попадаю в жесткие рамки и однообразную рутину.', qEn: 'I feel suffocated in rigid boundaries and repetitive routines.' },
    ],
  },
  {
    id: 'ruler',
    nameUk: 'Правитель / Лідер',
    nameRu: 'Правитель / Лидер',
    nameEn: 'Ruler / Leader',
    cardinalMottoUk: '«Влада — це не все, це єдине»',
    cardinalMottoRu: '«Власть — это не все, это единственное»',
    cardinalMottoEn: '«Power isn\'t everything, it\'s the only thing»',
    coreDesireUk: 'Контроль, порядок, процвітання сімʼї чи організації',
    goalUk: 'Створити успішну, стабільну структуру',
    fearUk: 'Хаос, втрата контролю, повалення авторитету',
    strategyUk: 'Встановлення правил, делегування, лідерство',
    weaknessUk: 'Авторитаризм, небажання делегувати контроль, гіперопіка',
    talentUk: 'Відповідальність, організаторські здібності, системне бачення',
    shadowUk: 'Деспот: параноя втрати влади, придушення ініціативи підлеглих або близьких',
    color: 'from-yellow-500 to-amber-700',
    icon: Crown,
    testQuestions: [
      { qUk: 'Я природно беру на себе відповідальність за порядок та організацію процесів.', qRu: 'Я естественно беру на себя ответственность за порядок и организацию процессов.', qEn: 'I naturally take responsibility for order and structure.' },
      { qUk: 'Мене дратує безлад і некерованість ситуації.', qRu: 'Меня раздражает беспорядок и неуправляемость ситуации.', qEn: 'I get annoyed by chaos and unmanaged situations.' },
    ],
  },
  {
    id: 'rebel',
    nameUk: 'Бунтар / Руйнівник',
    nameRu: 'Бунтарь / Разрушитель',
    nameEn: 'Rebel / Outlaw',
    cardinalMottoUk: '«Правила створені для того, щоб їх порушувати»',
    cardinalMottoRu: '«Правила созданы, чтобы их нарушать»',
    cardinalMottoEn: '«Rules are made to be broken»',
    coreDesireUk: 'Революція, руйнування застарілого, визволення',
    goalUk: 'Знищити те, що більше не працює',
    fearUk: 'Безсилля, підпорядкування несправедливій системі',
    strategyUk: 'Шокувати, руйнувати застарілі догми',
    weaknessUk: 'Схильність до саморуйнування або марного протесту',
    talentUk: 'Сміливість, радикальна чесність, здатність оновлювати світ',
    shadowUk: 'Руйнівник заради руйнування: токсичний нігілізм, спалення мостів',
    color: 'from-slate-600 to-zinc-900',
    icon: Zap,
    testQuestions: [
      { qUk: 'Я відчуваю пристрасть ламати застарілі правила та ставити авторитети під сумнів.', qRu: 'Я чувствую страсть ломать устаревшие правила и подвергать авторитеты сомнению.', qEn: 'I feel a drive to challenge rigid conventions and outdated authorities.' },
      { qUk: 'Коли всі йдуть в один бік, мені хочеться піти в протилежний.', qRu: 'Когда все идут в одну сторону, мне хочется пойти в противоположную.', qEn: 'When everyone moves in one direction, I instinctively want to go the opposite.' },
    ],
  },
  {
    id: 'magician',
    nameUk: 'Маг / Трансформатор',
    nameRu: 'Маг / Трансформатор',
    nameEn: 'Magician / Alchemist',
    cardinalMottoUk: '«Я роблю так, щоб речі траплялися»',
    cardinalMottoRu: '«Я делаю так, чтобы вещи случались»',
    cardinalMottoEn: '«I make things happen»',
    coreDesireUk: 'Зрозуміти фундаментальні закони змін та квантових переходів',
    goalUk: 'Втілювати мрії в реальність, зцілювати та трансформувати',
    fearUk: 'Непередбачувані негативні наслідки, маніпуляція',
    strategyUk: 'Розвиток інтуїції, бачення прихованих звʼязків',
    weaknessUk: 'Маніпулятивність, відрив від практичної землі',
    talentUk: 'Знаходження нестандартних рішень Win-Win, каталізатор змін',
    shadowUk: 'Чорний маг: маніпулювання іншими заради особистої вигоди під маскою допомоги',
    color: 'from-purple-600 to-violet-800',
    icon: Flame,
    testQuestions: [
      { qUk: 'Я вірю в синхронічність і здатність змінювати реальність через зміну стану свідомості.', qRu: 'Я верю в синхроничность и способность менять реальность через изменение состояния сознания.', qEn: 'I believe in synchronicity and changing reality through mindset shifts.' },
      { qUk: 'Люди часто звертаються до мене за трансформацією та виходом з глухих кутів.', qRu: 'Люди часто обращаются ко мне за трансформацией и выходом из тупиков.', qEn: 'People often come to me for transformation and breaking through bottlenecks.' },
    ],
  },
  {
    id: 'lover',
    nameUk: 'Коханець / Естет',
    nameRu: 'Любовник / Эстет',
    nameEn: 'Lover / Sensualist',
    cardinalMottoUk: '«Я бачу тебе тільки серцем»',
    cardinalMottoRu: '«Я вижу тебя только сердцем»',
    cardinalMottoEn: '«You\'re the only one for me»',
    coreDesireUk: 'Інтимність, досвід краси, глибокий чуттєвий звʼязок',
    goalUk: 'Бути в гармонійних стосунках з людьми, роботою та світом',
    fearUk: 'Бути відкинутим, самотність, байдужість',
    strategyUk: 'Ставати дедалі більш привабливим, чуйним та естетичним',
    weaknessUk: 'Втрата власного Я заради догоджання іншим',
    talentUk: 'Пристрасть, вдячність, тонке естетичне чуття, теплота',
    shadowUk: 'Залежний спокусник: ревнощі, емоційна одержимість, розчинення в партнері',
    color: 'from-pink-500 to-rose-600',
    icon: Heart,
    testQuestions: [
      { qUk: 'Естетика, краса, теплота людських стосунків та любов є головним сенсом мого життя.', qRu: 'Эстетика, красота, теплота отношений и любовь — главный смысл моей жизни.', qEn: 'Aesthetics, warmth in relationships, and love are the essence of my life.' },
      { qUk: 'Я глибоко переживаю холодність чи емоційну відстороненість близьких людей.', qRu: 'Я глубоко переживаю холодность или эмоциональную отстраненность близких людей.', qEn: 'I deeply feel emotional coldness or detachment from close ones.' },
    ],
  },
  {
    id: 'caregiver',
    nameUk: 'Турботливий / Опікун',
    nameRu: 'Заботливый / Опекун',
    nameEn: 'Caregiver / Altruist',
    cardinalMottoUk: '«Люби ближнього, як самого себе»',
    cardinalMottoRu: '«Возлюби ближнего, как самого себя»',
    cardinalMottoEn: '«Love your neighbor as yourself»',
    coreDesireUk: 'Захищати людей від шкоди, дарувати підтримку',
    goalUk: 'Допомагати іншим та піклуватися про їхнє благополуччя',
    fearUk: 'Невдячність, егоїзм, безпорадність близьких',
    strategyUk: 'Робити добро іншим, жертвувати власним комфортом',
    weaknessUk: 'Синдром мученика, самовиснаження, нездатність сказати «ні»',
    talentUk: 'Співчуття, щедрість, надійність',
    shadowUk: 'Токсичний рятівник: маніпуляція почуттям провини («Я для тебе все віддав!»)',
    color: 'from-emerald-400 to-green-600',
    icon: Feather,
    testQuestions: [
      { qUk: 'Для мене природно піклуватися про потреби інших, іноді навіть забуваючи про себе.', qRu: 'Для меня естественно заботиться о потребностях других, порой забывая о себе.', qEn: 'It is natural for me to care for others\' needs, sometimes putting myself second.' },
      { qUk: 'Я відчуваю щиру радість, коли можу допомогти комусь подолати біду.', qRu: 'Я чувствую искреннюю радость, когда могу помочь кому-то преодолеть беду.', qEn: 'I feel genuine joy when helping someone overcome hardship.' },
    ],
  },
  {
    id: 'jester',
    nameUk: 'Блазень / Трикстер',
    nameRu: 'Шут / Трикстер',
    nameEn: 'Jester / Trickster',
    cardinalMottoUk: '«Якщо ти не можеш сміятися, ти не можеш жити»',
    cardinalMottoRu: '«Если ты не можешь смеяться, ты не можешь жить»',
    cardinalMottoEn: '«If I can\'t dance, I don\'t want to be in your revolution»',
    coreDesireUk: 'Жити в моменті з повною радістю, знімати надмірну серйозність',
    goalUk: 'Гарно проводити час і дарувати сміх',
    fearUk: 'Нудьга або бути занудою',
    strategyUk: 'Гра, жарти, легкість сприйняття життя',
    weaknessUk: 'Марнування часу, нездатність до серйозності у критичні моменти',
    talentUk: 'Гумор, оптимізм, руйнування фальшивої пихи через сміх',
    shadowUk: 'Злий пересмішник: цинічний сарказм, втеча від справжніх почуттів за маскою сміху',
    color: 'from-amber-400 to-yellow-500',
    icon: Smile,
    testQuestions: [
      { qUk: 'Гумор та ігрова легкість допомагають мені розряджати найважчі конфлікти.', qRu: 'Юмор и игровая легкость помогают мне разряжать самые тяжелые конфликты.', qEn: 'Humor and playful lightness help me defuse heavy conflicts.' },
      { qUk: 'Я не терплю пафосу та надмірної трагічної серйозності.', qRu: 'Я не терплю пафоса и чрезмерной трагической серьезности.', qEn: 'I dislike excessive pomposity and grim seriousness.' },
    ],
  },
  {
    id: 'everyman',
    nameUk: 'Славний Малий / Реаліст',
    nameRu: 'Славный Малый / Реалист',
    nameEn: 'Everyman / Citizen',
    cardinalMottoUk: '«Усі люди народжені рівними»',
    cardinalMottoRu: '«Все люди рождены равными»',
    cardinalMottoEn: '«All men and women are created equal»',
    coreDesireUk: 'Належати до спільноти, бути прийнятим',
    goalUk: 'Бути частиною команди, мати надійних друзів',
    fearUk: 'Бути відкинутим або виділятися як біла ворона',
    strategyUk: 'Розвивати звичайні людські чесноти, бути простим і надійним',
    weaknessUk: 'Конформізм, страх проявити індивідуальність',
    talentUk: 'Реалізм, емпатія, чесність, рівність',
    shadowUk: 'Жертва натовпу: знецінення видатних особистостей через заздрість',
    color: 'from-stone-500 to-stone-700',
    icon: Users,
    testQuestions: [
      { qUk: 'Для мене важливо бути частиною дружнього колективу та відчувати рівність без пихи.', qRu: 'Для меня важно быть частью дружного коллектива и чувствовать равенство без высокомерия.', qEn: 'It is important to feel part of a genuine community without arrogance.' },
      { qUk: 'Я ціную чесну працю, надійність та простий людський контакт.', qRu: 'Я ценю честный труд, надежность и простой человеческий контакт.', qEn: 'I value honest work, dependability, and down-to-earth human contact.' },
    ],
  },
  {
    id: 'innocent',
    nameUk: 'Невинний / Оптиміст',
    nameRu: 'Невинный / Оптимист',
    nameEn: 'Innocent / Idealist',
    cardinalMottoUk: '«Вільний бути собою і довіряти світу»',
    cardinalMottoRu: '«Свободен быть собой и доверять миру»',
    cardinalMottoEn: '«Free to be you and me»',
    coreDesireUk: 'Відчути рай на землі, бути щасливим і чистим',
    goalUk: 'Бути щасливим і в безпеці',
    fearUk: 'Зробити щось погане або бути покараним',
    strategyUk: 'Робити все правильно, зберігати віру та чистоту',
    weaknessUk: 'Наївність, уникнення конфліктів, сліпа довіра',
    talentUk: 'Віра, оптимізм, натхнення, чистота намірів',
    shadowUk: 'Заперечення реальності: заплющування очей на зло і труднощі',
    color: 'from-sky-400 to-cyan-500',
    icon: Lightbulb,
    testQuestions: [
      { qUk: 'Я щиро вірю у вроджену доброту людей і сподіваюся на найкраще.', qRu: 'Я искренне верю во врожденную доброту людей и надеюсь на лучшее.', qEn: 'I genuinely believe in people\'s inherent goodness and hope for the best.' },
      { qUk: 'Я прагну зберігати внутрішню чистоту і уникати токсичності та підлості.', qRu: 'Я стремлюсь сохранять внутреннюю чистоту и избегать токсичности и подлости.', qEn: 'I strive to maintain inner purity and avoid malice and toxicity.' },
    ],
  },
];

interface JungianArchetypesProps {
  onSavedToJournal?: () => void;
}

export const JungianArchetypes: React.FC<JungianArchetypesProps> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [userContext, setUserContext] = useState('');
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [profile, setProfile] = useState<JungianArchetypeProfile | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>('creator');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleScoreChange = (qKey: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [qKey]: score }));
  };

  const calculateArchetypes = (): {
    primary: JungianArchetypeScore;
    secondary: JungianArchetypeScore;
    shadow: JungianArchetypeScore;
    all: JungianArchetypeScore[];
  } => {
    const scores: JungianArchetypeScore[] = ARCHETYPES_CATALOG.map((arch) => {
      const q1 = answers[`${arch.id}_0`] || 3;
      const q2 = answers[`${arch.id}_1`] || 3;
      const avg = ((q1 + q2) / 10) * 100;
      return {
        id: arch.id,
        nameUk: arch.nameUk,
        nameRu: arch.nameRu,
        nameEn: arch.nameEn,
        score: Math.round(avg),
        cardinalMottoUk: arch.cardinalMottoUk,
        cardinalMottoRu: arch.cardinalMottoRu,
        cardinalMottoEn: arch.cardinalMottoEn,
        coreDesire: arch.coreDesireUk,
        goal: arch.goalUk,
        greatestFear: arch.fearUk,
        strategy: arch.strategyUk,
        weakness: arch.weaknessUk,
        talent: arch.talentUk,
        shadowAspect: arch.shadowUk,
        color: arch.color,
        iconName: arch.id,
      };
    });

    scores.sort((a, b) => b.score - a.score);

    const primary = scores[0];
    const secondary = scores[1];
    // Shadow is either the lowest scored conscious archetype or the archetype with the deepest unacknowledged potential
    const shadow = scores[scores.length - 1];

    return { primary, secondary, shadow, all: scores };
  };

  const runDeepAiAnalysis = async () => {
    setAnalyzingAi(true);
    const { primary, secondary, shadow, all } = calculateArchetypes();

    try {
      const aiResult = await requestArchetypesDeepInsight({
        primaryArchetype: primary.nameUk,
        secondaryArchetype: secondary.nameUk,
        shadowArchetype: shadow.nameUk,
        userContext: userContext.trim() || undefined,
      });

      const newProfile: JungianArchetypeProfile = {
        id: `arch_prof_${Date.now()}`,
        date: new Date().toISOString(),
        primaryArchetype: primary,
        secondaryArchetype: secondary,
        shadowArchetype: shadow,
        allScores: all,
        aiAnalysis: aiResult,
      };

      setProfile(newProfile);

      // Log user activity
      logUserActivity({
        tab: 'archetypes',
        toolName: 'Діагностика 12 архетипів Юнга',
        querySummary: `Провідний: ${primary.nameUk}, Допоміжний: ${secondary.nameUk}, Тінь: ${shadow.nameUk}`,
        category: 'Archetypes',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSaveToJournal = () => {
    if (!profile) return;
    saveJournalEntry({
      type: 'archetypes',
      title: `Юнгіанські Архетипи: ${profile.primaryArchetype.nameUk} & Тінь (${profile.shadowArchetype.nameUk})`,
      summary: profile.aiAnalysis?.synthesisTitle || `Провідний: ${profile.primaryArchetype.nameUk}`,
      data: profile,
    });
    setSavedFeedback(true);
    if (onSavedToJournal) onSavedToJournal();
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const currentDef = ARCHETYPES_CATALOG.find((a) => a.id === selectedCardId) || ARCHETYPES_CATALOG[0];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/70 via-indigo-950/70 to-slate-900/80 border border-purple-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                <Crown className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {lang === 'ru' ? '12 Архетипов Юнга & Тень' : lang === 'en' ? '12 Jungian Archetypes & Shadow' : '12 Архетипів Юнга & Тінь'}
                </h1>
                <p className="text-purple-200/80 text-sm mt-1">
                  {lang === 'ru'
                    ? 'Глубинная диагностика структуры Эго, вытесненной Тени и пути Индивидуации'
                    : lang === 'en'
                    ? 'Deep diagnostic of Ego structure, repressed Shadow, and the Individuation path'
                    : 'Глибинна діагностика структури Его, витісненої Тіні та шляху Індивідуації'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              // Quick auto-populate for testing
              const filled: Record<string, number> = {};
              ARCHETYPES_CATALOG.forEach((a) => {
                filled[`${a.id}_0`] = Math.floor(Math.random() * 4) + 2;
                filled[`${a.id}_1`] = Math.floor(Math.random() * 4) + 2;
              });
              filled['creator_0'] = 5;
              filled['creator_1'] = 5;
              filled['sage_0'] = 4;
              filled['sage_1'] = 5;
              setAnswers(filled);
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-700/50 text-purple-300 transition-colors"
          >
            🎲 {lang === 'ru' ? 'Заполнить демо-ответы' : lang === 'en' ? 'Fill demo scores' : 'Заповнити демо-відповіді'}
          </button>
        </div>
      </div>

      {/* Main Grid: Test on Left/Top, Detailed Explorer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 12 Archetypes Express Test */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Compass className="w-5 h-5 text-indigo-400" />
              {lang === 'ru'
                ? 'Экспресс-диагностика архетипов (Оцените от 1 до 5)'
                : lang === 'en'
                ? 'Express Archetype Assessment (Rate 1 to 5)'
                : 'Експрес-діагностика архетипів (Оцініть від 1 до 5)'}
            </h2>

            <div className="space-y-4 max-h-[560px] overflow-y-auto pr-2 custom-scrollbar">
              {ARCHETYPES_CATALOG.map((arch) => {
                const IconComponent = arch.icon;
                return (
                  <div
                    key={arch.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${arch.color} text-white`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-200 text-sm">
                          {lang === 'ru' ? arch.nameRu : lang === 'en' ? arch.nameEn : arch.nameUk}
                        </span>
                      </div>
                      <span className="text-xs text-indigo-300/80 italic hidden sm:inline">
                        {lang === 'ru' ? arch.cardinalMottoRu : lang === 'en' ? arch.cardinalMottoEn : arch.cardinalMottoUk}
                      </span>
                    </div>

                    <div className="space-y-2.5 mt-2">
                      {arch.testQuestions.map((q, qIdx) => {
                        const key = `${arch.id}_${qIdx}`;
                        const currentVal = answers[key] || 3;
                        return (
                          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <span className="text-slate-300 flex-1">
                              {lang === 'ru' ? q.qRu : lang === 'en' ? q.qEn : q.qUk}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-700/60">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleScoreChange(key, val)}
                                  className={`w-6 h-6 rounded-md font-semibold text-xs transition-all ${
                                    currentVal === val
                                      ? 'bg-indigo-600 text-white shadow-sm scale-110'
                                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                  }`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Situation context */}
            <div className="mt-5 space-y-2">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>
                  {lang === 'ru'
                    ? 'Ваш текущий запрос или дилемма (по желанию):'
                    : lang === 'en'
                    ? 'Your current dilemma or question (optional):'
                    : 'Ваш поточний запит або дилема (за бажанням):'}
                </span>
                <VoiceInputButton
                  onTranscript={(text) => setUserContext((prev) => (prev ? `${prev} ${text}` : text))}
                  className="p-1"
                />
              </label>
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Опишите, в какой сфере жизни сейчас больше всего сомнений или напряжения...'
                    : lang === 'en'
                    ? 'Describe which life area holds the most doubt or tension right now...'
                    : 'Опишіть, у якій сфері життя зараз найбільше сумнівів або напруження...'
                }
                rows={2}
                className="w-full text-xs bg-slate-950/70 border border-slate-700/70 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Submit AI Button */}
            <div className="mt-5">
              <button
                onClick={runDeepAiAnalysis}
                disabled={analyzingAi}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {analyzingAi ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{t('loading_ai')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    <span>
                      {lang === 'ru'
                        ? 'Рассчитать архетипы и синтезировать Тень через ИИ'
                        : lang === 'en'
                        ? 'Calculate Archetypes & Synthesize Shadow via AI'
                        : 'Розрахувати архетипи та синтезувати Тінь через ШІ'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Archetype Radar / Selected Info */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card Selector Pills */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              {lang === 'ru' ? 'Каталог 12 архетипов' : lang === 'en' ? 'Catalog of 12 Archetypes' : 'Каталог 12 архетипів'}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {ARCHETYPES_CATALOG.map((arch) => {
                const isSelected = selectedCardId === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => setSelectedCardId(arch.id)}
                    className={`text-left p-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? `bg-gradient-to-r ${arch.color} text-white shadow-md`
                        : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="truncate">
                      {lang === 'ru' ? arch.nameRu : lang === 'en' ? arch.nameEn : arch.nameUk}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Archetype Deep Card */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${currentDef.color} text-white`}>
                  {React.createElement(currentDef.icon, { className: 'w-6 h-6' })}
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">
                    {lang === 'ru' ? currentDef.nameRu : lang === 'en' ? currentDef.nameEn : currentDef.nameUk}
                  </h4>
                  <p className="text-xs text-indigo-300 italic">
                    {lang === 'ru' ? currentDef.cardinalMottoRu : lang === 'en' ? currentDef.cardinalMottoEn : currentDef.cardinalMottoUk}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Головне прагнення:</span>
                  <p className="text-slate-200 mt-0.5">{currentDef.coreDesireUk}</p>
                </div>
                <div>
                  <span className="text-rose-400 font-medium">Головний страх:</span>
                  <p className="text-slate-200 mt-0.5">{currentDef.fearUk}</p>
                </div>
                <div>
                  <span className="text-emerald-400 font-medium">Суперсила та талант:</span>
                  <p className="text-slate-200 mt-0.5">{currentDef.talentUk}</p>
                </div>
                <div>
                  <span className="text-amber-400 font-medium">Сліпа зона (Слабкість):</span>
                  <p className="text-slate-200 mt-0.5">{currentDef.weaknessUk}</p>
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-xs">
                <span className="text-purple-300 font-bold flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  Тіньовий прояв (Shadow):
                </span>
                <p className="text-purple-100/90 mt-1">{currentDef.shadowUk}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Synthesis & Profile Results */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-purple-800/50 rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-purple-400 tracking-wider">
                {lang === 'ru' ? 'Результаты глубинного анализа' : lang === 'en' ? 'Deep Analysis Results' : 'Результати глибинного аналізу'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {profile.aiAnalysis?.synthesisTitle || `${profile.primaryArchetype.nameUk} & ${profile.secondaryArchetype.nameUk}`}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToJournal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md"
              >
                {savedFeedback ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{savedFeedback ? t('saved_successfully') : t('save_to_journal')}</span>
              </button>
            </div>
          </div>

          {/* Triad of Archetypes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40">
              <span className="text-xs font-bold text-indigo-400 uppercase">Провідний архетип (Его)</span>
              <h4 className="text-lg font-bold text-white mt-1">{profile.primaryArchetype.nameUk}</h4>
              <p className="text-xs text-indigo-200 mt-2">{profile.primaryArchetype.talent}</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/60 to-slate-900 border border-blue-500/40">
              <span className="text-xs font-bold text-blue-400 uppercase">Допоміжний архетип (Ресурс)</span>
              <h4 className="text-lg font-bold text-white mt-1">{profile.secondaryArchetype.nameUk}</h4>
              <p className="text-xs text-blue-200 mt-2">{profile.secondaryArchetype.strategy}</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/70 to-slate-900 border border-purple-500/50">
              <span className="text-xs font-bold text-purple-400 uppercase">Тіньовий архетип (Shadow)</span>
              <h4 className="text-lg font-bold text-white mt-1">{profile.shadowArchetype.nameUk}</h4>
              <p className="text-xs text-purple-200 mt-2">{profile.shadowArchetype.shadowAspect}</p>
            </div>
          </div>

          {/* AI Insights Details */}
          {profile.aiAnalysis && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-amber-400 uppercase mb-2">Діагностика стану свідомого Его</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{profile.aiAnalysis.egoStateDiagnosis}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-rose-400 uppercase mb-2">Архетипова полярність і напруга</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{profile.aiAnalysis.archetypalTension}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
                <h5 className="text-xs font-bold text-purple-300 uppercase mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Інструкція з інтеграції Тіні (Individuation Leap)
                </h5>
                <p className="text-xs text-purple-100 leading-relaxed">{profile.aiAnalysis.shadowIntegrationAdvice}</p>
              </div>

              {profile.aiAnalysis.growthActionPlan?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-emerald-400 uppercase mb-3">План дій для особистісного зростання</h5>
                  <div className="space-y-2">
                    {profile.aiAnalysis.growthActionPlan.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default JungianArchetypes;
