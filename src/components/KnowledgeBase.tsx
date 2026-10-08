import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Compass,
  Brain,
  Flame,
  Swords,
  ArrowRight,
  User,
  HelpCircle,
  Lightbulb,
  Layers,
  Eye,
  Activity,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { PSYCHOLOGY_KNOWLEDGE, KnowledgeTopic } from '../data/psychologyKnowledge';
import { TabType } from './Navbar';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface KnowledgeBaseProps {
  onNavigateToTool: (tab: TabType) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onNavigateToTool }) => {
  const { lang } = useThemeLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'encyclopedia' | 'visual_schemas'>('encyclopedia');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('natural_approach');
  const [activeSchemaTab, setActiveSchemaTab] = useState<'matrix9' | 'paradigms' | 'dialectic' | 'worlds'>('matrix9');

  const filteredTopics = PSYCHOLOGY_KNOWLEDGE.filter((topic) => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesSearch =
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.howItHelpsInCrisis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.keyFigures.some((kf) => kf.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getToolAction = (topicId: string): { label: string; tab: TabType } | null => {
    switch (topicId) {
      case 'cbt':
        return {
          label:
            lang === 'en'
              ? 'Open CBT Thought Diary'
              : lang === 'ru'
              ? 'Открыть КПТ Дневник Мыслей'
              : 'Відкрити КПТ Щоденник Думок',
          tab: 'cbt',
        };
      case 'natural_approach':
      case 'natural_ontologies':
      case 'natural_dialectic':
      case 'natural_event_matrix':
      case 'natural_transformation_protocols':
        return {
          label:
            lang === 'en'
              ? 'Explore in Consilium (Natural Approach)'
              : lang === 'ru'
              ? 'Разбор ситуации по Естественному подходу'
              : 'Розбір ситуації за Природним підходом',
          tab: 'consilium',
        };
      case 'psychodynamics':
        return {
          label:
            lang === 'en'
              ? 'Take Jung 16 Associations Test'
              : lang === 'ru'
              ? 'Пройти тест 16 ассоциаций Юнга'
              : 'Пройти тест 16 асоціацій Юнга',
          tab: 'associations16',
        };
      case 'coaching_grow':
      case 'goal_makers_game':
        return {
          label:
            lang === 'en'
              ? 'Go to Hero’s Goal Tracker'
              : lang === 'ru'
              ? 'Перейти в трекер «Цель Героя»'
              : 'Перейти в трекер «Мета Героя»',
          tab: 'goalMakers',
        };
      case 'goal_makers_confinement':
        return {
          label:
            lang === 'en'
              ? 'Play «Goal MAker$» Game'
              : lang === 'ru'
              ? 'Играть в игру «Goal MAker$»'
              : 'Грати в гру «Goal MAker$»',
          tab: 'goalMakersBoard',
        };
      case 'pre_mortem':
        return {
          label:
            lang === 'en'
              ? 'Open Pre-Mortem Tool'
              : lang === 'ru'
              ? 'Открыть практику Премортем'
              : 'Відкрити практику Премортем',
          tab: 'preMortem',
        };
      case 'body_double':
        return {
          label:
            lang === 'en'
              ? 'Open Body Doubler Practice'
              : lang === 'ru'
              ? 'Открыть практику Боди-дублера'
              : 'Відкрити практику Боді-дублера',
          tab: 'bodyDouble',
        };
      default:
        return {
          label:
            lang === 'en'
              ? 'Launch Consilium'
              : lang === 'ru'
              ? 'Запустить Консилиум'
              : 'Запустити Консиліум',
          tab: 'consilium',
        };
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3 py-1 text-xs font-semibold text-teal-400">
          <BookOpen className="h-3.5 w-3.5" />
          {lang === 'en'
            ? 'Knowledge Base & «Flashes of Perennial Philosophy» Oleg Linetsky'
            : lang === 'ru'
            ? 'База Знаний & «Вспышки Вечной Философии» Олега Линецкого'
            : 'База Знань & «Вспалахи Вічної Філософії» Олега Линецького'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl font-serif">
          {lang === 'en'
            ? 'Encyclopedia of Psychology, Therapy & Natural Approach'
            : lang === 'ru'
            ? 'Энциклопедия Психологии, Психотерапии и Естественного Подхода'
            : 'Енциклопедія Психології, Психотерапії та Природного Підходу'}
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          {lang === 'en'
            ? 'Structured reference guide and interactive ontological schemas: from classical schools of psychotherapy to energetic dialectics of ruptures, 108 beads of events, and transformation protocols.'
            : lang === 'ru'
            ? 'Структурированный справочник и интерактивные онтологические схемы: от классических школ психотерапии до энергетической диалектики разрывов, 108 бусин событий и протоколов преобразований.'
            : 'Структурований довідник та інтерактивні онтологічні схеми: від класичних шкіл психотерапії до енергетичної діалектики розривів, 108 бусин подій та протоколів перетворень.'}
        </p>
      </div>

      {/* Main Switcher: Articles vs Visual Schemas */}
      <div className="flex border-b border-stone-800 pb-2 gap-3">
        <button
          onClick={() => setActiveSubTab('encyclopedia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'encyclopedia'
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/50'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>
            {lang === 'en'
              ? `Articles & Concepts (${filteredTopics.length})`
              : lang === 'ru'
              ? `Статьи и Концепции (${filteredTopics.length})`
              : `Статті та Концепції (${filteredTopics.length})`}
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('visual_schemas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'visual_schemas'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>
            {lang === 'en'
              ? 'Interactive Schemas & 108 Beads Matrix'
              : lang === 'ru'
              ? 'Интерактивные Схемы & Матрица 108 Бусин'
              : 'Інтерактивні Схеми & Матриця 108 Бусин'}
          </span>
        </button>
      </div>

      {activeSubTab === 'visual_schemas' ? (
        /* VISUAL SCHEMAS VIEW */
        <div className="space-y-6">
          {/* Subtabs for schemas */}
          <div className="flex flex-wrap gap-2">
            {[
              {
                id: 'matrix9',
                label:
                  lang === 'en'
                    ? '📊 Matrix of 9 Request Classes (3x3)'
                    : lang === 'ru'
                    ? '📊 Матрица 9 классов запросов (3x3)'
                    : '📊 Матриця 9 класів запитів (3x3)',
              },
              {
                id: 'paradigms',
                label:
                  lang === 'en'
                    ? '☯️ Event vs Object Paradigm'
                    : lang === 'ru'
                    ? '☯️ Событийная vs Объектная парадигма'
                    : '☯️ Подійна vs Об\'єктна парадигма',
              },
              {
                id: 'dialectic',
                label:
                  lang === 'en'
                    ? '⚖️ Immanent vs Transcendent Dialectic'
                    : lang === 'ru'
                    ? '⚖️ Имманентная vs Трансцендентная диалектика'
                    : '⚖️ Іманентна vs Трансцендентна діалектика',
              },
              {
                id: 'worlds',
                label:
                  lang === 'en'
                    ? '🌌 World of Soul vs World of Personality'
                    : lang === 'ru'
                    ? '🌌 Мир Души vs Мир Личности'
                    : '🌌 Світ Душі vs Світ Особистості',
              },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setActiveSchemaTab(st.id as any)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                  activeSchemaTab === st.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Schema 1: 9-cell Matrix of Requests (Page 119) */}
          {activeSchemaTab === 'matrix9' && (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-6 space-y-5">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {lang === 'en'
                    ? 'Schema 119: 9-Cell Event Request Matrix (108 Beads)'
                    : lang === 'ru'
                    ? 'Схема 119: 9-клеточная Матрица Событийного Запроса (108 Бусин)'
                    : 'Схема 119: 9-клітинна Матриця Подійного Запиту (108 Бусин)'}
                </span>
                <p className="text-xs text-stone-400">
                  {lang === 'en'
                    ? 'Classification of any psychological and life request by sphere of attention (Emotions, Attention, Desires) and process stage (Emergence, Maintenance, Completion).'
                    : lang === 'ru'
                    ? 'Классификация любого психологического и жизненного запроса по сфере внимания (Эмоции, Внимание, Желания) и стадии процесса (Зарождение, Поддержание, Завершение).'
                    : 'Класифікація будь-якого психологічного та життєвого запиту за сферою уваги (Емоції, Увага, Бажання) та стадією процесу (Зародження, Підтримання, Завершення).'}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-left text-stone-400">
                      <th className="p-3">
                        {lang === 'en' ? 'Stage \\ Sphere' : lang === 'ru' ? 'Стадия \\ Сфера' : 'Стадія \\ Сфера'}
                      </th>
                      <th className="p-3 text-sky-300">
                        {lang === 'en' ? '💙 Emotions & Feelings' : lang === 'ru' ? '💙 Эмоции & Чувства' : '💙 Емоції & Почуття'}
                      </th>
                      <th className="p-3 text-teal-300">
                        {lang === 'en' ? '👁️ Attention & Ruptures' : lang === 'ru' ? '👁️ Внимание & Разрывы' : '👁️ Увага & Розриви'}
                      </th>
                      <th className="p-3 text-amber-300">
                        {lang === 'en' ? '🔥 Desires & Drives' : lang === 'ru' ? '🔥 Желания & Влечения' : '🔥 Бажання & Потяги'}
                      </th>
                      <th className="p-3 text-purple-300">
                        {lang === 'en' ? 'Reflection Focus' : lang === 'ru' ? 'Фокус рефлексии' : 'Фокус рефлексії'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    <tr className="bg-stone-950/40">
                      <td className="p-3 font-bold text-stone-200">
                        {lang === 'en' ? '1. Emergence (New)' : lang === 'ru' ? '1. Зарождение (Новое)' : '1. Зародження (Нове)'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-sky-300 block">
                          {lang === 'en' ? 'From apathy to liveliness' : lang === 'ru' ? 'От апатии к оживлению' : 'Від апатії до пожвавлення'}
                        </strong>
                        {lang === 'en' ? 'Beginning of the game, empathy skill' : lang === 'ru' ? 'Начало игры, умение соучастия' : 'Початок гри, вміння співучасті'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-teal-300 block">
                          {lang === 'en' ? 'From yearning to wonder' : lang === 'ru' ? 'От тоски к удивлению' : 'Від туги до здивування'}
                        </strong>
                        {lang === 'en' ? 'Arising of interest, touching' : lang === 'ru' ? 'Появление интереса, касание' : 'Поява інтересу, торкання'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-amber-300 block">
                          {lang === 'en' ? 'From boredom to delight' : lang === 'ru' ? 'От скуки к восторгу' : 'Від нудьги до захоплення'}
                        </strong>
                        {lang === 'en' ? 'Beginning of intent, temptation' : lang === 'ru' ? 'Начало замысла, соблазн' : 'Початок задуму, спокуса'}
                      </td>
                      <td className="p-3 font-semibold text-purple-300">
                        {lang === 'en' ? 'Existential focus' : lang === 'ru' ? 'Экзистенциальный фокус' : 'Екзистенційний фокус'}
                      </td>
                    </tr>
                    <tr className="bg-stone-950/20">
                      <td className="p-3 font-bold text-stone-200">
                        {lang === 'en' ? '2. Maintenance (Process)' : lang === 'ru' ? '2. Поддержание (Процесс)' : '2. Підтримання (Процес)'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-sky-300 block">
                          {lang === 'en' ? 'From indignation to acceptance' : lang === 'ru' ? 'От возмущения к принятию' : 'Від обурення до прийняття'}
                        </strong>
                        {lang === 'en' ? 'Boundary defense, resistance' : lang === 'ru' ? 'Отстаивание границ, сопротивление' : 'Відстоювання кордонів, опір'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-teal-300 block">
                          {lang === 'en' ? 'From distraction to presence' : lang === 'ru' ? 'От отвлечения к присутствию' : 'Від відволікання до присутності'}
                        </strong>
                        {lang === 'en' ? 'Maintaining focus, centering' : lang === 'ru' ? 'Сохранение фокуса, сосредоточение' : 'Збереження фокусу, зосередження'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-amber-300 block">
                          {lang === 'en' ? 'From challenge to recognition' : lang === 'ru' ? 'От вызова к признанию' : 'Від виклику до визнання'}
                        </strong>
                        {lang === 'en' ? 'Attaining victory, competition' : lang === 'ru' ? 'Обретение победы, состязание' : 'Здобуття перемоги, змагання'}
                      </td>
                      <td className="p-3 font-semibold text-purple-300">
                        {lang === 'en' ? 'Humanistic focus' : lang === 'ru' ? 'Гуманистический фокус' : 'Гуманістичний фокус'}
                      </td>
                    </tr>
                    <tr className="bg-stone-950/40">
                      <td className="p-3 font-bold text-stone-200">
                        {lang === 'en' ? '3. Completion (Resolution)' : lang === 'ru' ? '3. Завершение (Итог)' : '3. Завершення (Підсумок)'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-sky-300 block">
                          {lang === 'en' ? 'From fatigue to relief' : lang === 'ru' ? 'От усталости к облегчению' : 'Від втоми до полегшення'}
                        </strong>
                        {lang === 'en' ? 'Ending of drama, deep empathy' : lang === 'ru' ? 'Завершение драмы, сопереживание' : 'Завершення драми, співпереживання'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-teal-300 block">
                          {lang === 'en' ? 'From turmoil to clarification' : lang === 'ru' ? 'От смятения к прояснению' : 'Від сум\'яття до прояснення'}
                        </strong>
                        {lang === 'en' ? 'Bringing clarity, co-correlation' : lang === 'ru' ? 'Внесение ясности, со-отнесение' : 'Внесення ясності, со-віднесення'}
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-amber-300 block">
                          {lang === 'en' ? 'From passion to mastery' : lang === 'ru' ? 'От страсти к обладанию' : 'Від пристрасті до володіння'}
                        </strong>
                        {lang === 'en' ? 'Forging alliance, collaboration' : lang === 'ru' ? 'Заключение союза, сотрудничество' : 'Укладання союзу, співпраця'}
                      </td>
                      <td className="p-3 font-semibold text-purple-300">
                        {lang === 'en' ? 'Psychodynamic focus' : lang === 'ru' ? 'Психодинамический фокус' : 'Психодинамічний фокус'}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-900 border-t border-stone-800 text-[11px] text-stone-400 font-semibold">
                      <td className="p-3">
                        {lang === 'en' ? 'Support modality:' : lang === 'ru' ? 'Метод помощи:' : 'Метод допомоги:'}
                      </td>
                      <td className="p-3 text-sky-400">
                        {lang === 'en' ? 'Therapy of Feelings' : lang === 'ru' ? 'Терапия чувств' : 'Терапія почуттів'}
                      </td>
                      <td className="p-3 text-teal-400">
                        {lang === 'en' ? 'Mindfulness / Presence' : lang === 'ru' ? 'Mindfulness / Присутствие' : 'Mindfulness / Присутність'}
                      </td>
                      <td className="p-3 text-amber-400">
                        {lang === 'en' ? 'Action Coaching' : lang === 'ru' ? 'Коучинг действий' : 'Коучинг дій'}
                      </td>
                      <td className="p-3 text-purple-400">
                        {lang === 'en' ? 'Integral Synthesis' : lang === 'ru' ? 'Интегральный синтез' : 'Інтегральний синтез'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Schema 2: Event Paradigm vs Object Paradigm (Page 116) */}
          {activeSchemaTab === 'paradigms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <Flame className="h-4 w-4" />
                  {lang === 'en'
                    ? 'Event Paradigm (World of Ruptures)'
                    : lang === 'ru'
                    ? 'Событийная парадигма (Мир Разрывов)'
                    : 'Подійна парадигма (Світ Розривів)'}
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Unit of thought:' : lang === 'ru' ? 'Единица мышления:' : 'Одиниця мислення:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Changes over time, ruptures of reality.'
                      : lang === 'ru'
                      ? 'Изменения во времени, разрывы действительности.'
                      : 'Зміни у часі, розриви дійсності.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'What is explored:' : lang === 'ru' ? 'Что исследуется:' : 'Що досліджується:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Events, spontaneous discoveries.'
                      : lang === 'ru'
                      ? 'События, спонтанные открытия.'
                      : 'Події, відкриття спонтанні.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Key questions:' : lang === 'ru' ? 'Ключевые вопросы:' : 'Ключові питання:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? '«What happens? What is striking about this? How to be with it?»'
                      : lang === 'ru'
                      ? '«Что случается? Что в этом поражает? Как с этим быть?»'
                      : '«Що трапляється? Що в цьому вражає? Як із цим бути?»'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Perception:' : lang === 'ru' ? 'Восприятие:' : 'Сприйняття:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Unlocking awareness to the invasion of being. Free divided mind.'
                      : lang === 'ru'
                      ? 'Размыкание сознания навстречу вторжению бытия. Свободный расщепленный ум.'
                      : 'Розмикання свідомості до вторгнення буття. Вільний розщеплений розум.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Categories:' : lang === 'ru' ? 'Категории:' : 'Категорії:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Energy, Waves, Emptiness, Becoming, Postmodern, Tantra.'
                      : lang === 'ru'
                      ? 'Энергия, Волны, Пустота, Становление, Постмодерн, Тантра.'
                      : 'Енергія, Хвилі, Пустота, Становлення, Постмодерн, Тантра.'}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <Compass className="h-4 w-4" />
                  {lang === 'en'
                    ? 'Object Paradigm (World of Phenomena)'
                    : lang === 'ru'
                    ? 'Объектная парадигма (Мир Феноменов)'
                    : 'Об\'єктна парадигма (Світ Феноменів)'}
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Unit of thought:' : lang === 'ru' ? 'Единица мышления:' : 'Одиниця мислення:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Phenomena outside time, integral entities.'
                      : lang === 'ru'
                      ? 'Явления вне времени, целостные сущности.'
                      : 'Явища поза часом, цілісні сутності.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'What is explored:' : lang === 'ru' ? 'Что исследуется:' : 'Що досліджується:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Properties of objects, contingent scenarios.'
                      : lang === 'ru'
                      ? 'Свойства объектов, случайные сценарии.'
                      : 'Властивості об\'єктів, сценарії випадкові.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Key questions:' : lang === 'ru' ? 'Ключевые вопросы:' : 'Ключові питання:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? '«What is noticed? How to understand and apply this?»'
                      : lang === 'ru'
                      ? '«Что замечается? Как это понять и применить?»'
                      : '«Що помічається? Як це зрозуміти та застосувати?»'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Perception:' : lang === 'ru' ? 'Восприятие:' : 'Сприйняття:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Locking consciousness onto entities of existents. Directed mind, integrity.'
                      : lang === 'ru'
                      ? 'Замыкание сознания на предметах сущего. Направленный ум, целостность.'
                      : 'Замикання свідомості на предметах сущого. Спрямований розум, цілісність.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Categories:' : lang === 'ru' ? 'Категории:' : 'Категорії:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Objects, Particles, Forms, Existence, Modern, Sutra.'
                      : lang === 'ru'
                      ? 'Объекты, Частицы, Формы, Существование, Модерн, Сутра.'
                      : 'Об\'єкти, Частинки, Форми, Існування, Модерн, Сутра.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Schema 3: Immanent vs Transcendent Dialectic (Page 117) */}
          {activeSchemaTab === 'dialectic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Activity className="h-4 w-4" />
                  {lang === 'en'
                    ? 'Immanent Dialectic (Deepening)'
                    : lang === 'ru'
                    ? 'Имманентная диалектика (Углубление)'
                    : 'Іманентна діалектика (Заглиблення)'}
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Objective:' : lang === 'ru' ? 'Задача:' : 'Завдання:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'To be understood by others.'
                      : lang === 'ru'
                      ? 'Быть понятным другим.'
                      : 'Бути зрозумілим іншим.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Source of truth:' : lang === 'ru' ? 'Источник истины:' : 'Джерело істини:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Truth arrives from within (Criterion — sense of justice).'
                      : lang === 'ru'
                      ? 'Истина приходит изнутри (Критерий — чувство справедливости).'
                      : 'Істина приходить зсередини (Критерій — почуття справедливості).'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Methodology (Ethics):' : lang === 'ru' ? 'Методология (Этика):' : 'Методологія (Етика):'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Discernment and bonding. From conflict to agreement.'
                      : lang === 'ru'
                      ? 'Различение и связывание. От конфликта к согласию.'
                      : 'Розрізнення та зв\'язування. Від конфлікту до згоди.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Questions:' : lang === 'ru' ? 'Вопросы:' : 'Питання:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? '«What is going on? What gets in the way?» (Equal rights politics).'
                      : lang === 'ru'
                      ? '«В чем дело? Что мешает?» (Политика равенства прав).'
                      : '«У чому справа? Що заважає?» (Політика рівності прав).'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Practice:' : lang === 'ru' ? 'Практика:' : 'Практика:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Shamatha (Tree of Life) • Sensitivity: increasing discernment capacity.'
                      : lang === 'ru'
                      ? 'Шаматха (Древо жизни) • Чувствительность: рост различающей способности.'
                      : 'Шаматха (Дерево життя) • Чутливість: зростання розрізнюючої здатності.'}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  {lang === 'en'
                    ? 'Transcendent Dialectic (Expansion)'
                    : lang === 'ru'
                    ? 'Трансцендентная диалектика (Расширение)'
                    : 'Трансцендентна діалектика (Розширення)'}
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Objective:' : lang === 'ru' ? 'Задача:' : 'Завдання:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'To perceive the scale of the whole.'
                      : lang === 'ru'
                      ? 'Быть понимающим масштаб целого.'
                      : 'Бути розуміючим масштаб цілого.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Source of truth:' : lang === 'ru' ? 'Источник истины:' : 'Джерело істини:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Truth arrives from without (Criterion — sense of inspiration).'
                      : lang === 'ru'
                      ? 'Истина приходит извне (Критерий — чувство вдохновения).'
                      : 'Істина приходить ззовні (Критерій — почуття натхнення).'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Methodology (Aesthetics):' : lang === 'ru' ? 'Методология (Эстетика):' : 'Методологія (Естетика):'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Transcendence and inclusion. From confusion to wholeness.'
                      : lang === 'ru'
                      ? 'Превосхождение и включение. От путаницы к целостности.'
                      : 'Перевершення та включення. Від плутанини до цілісності.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Questions:' : lang === 'ru' ? 'Вопросы:' : 'Питання:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? '«What is the meaning? What is it for?» (Ideology & integration into one’s place).'
                      : lang === 'ru'
                      ? '«В чем смысл? Для чего это?» (Идеология и встраивание в свое место).'
                      : '«У чому сенс? Для чого це?» (Ідеологія та вбудовування у своє місце).'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Practice:' : lang === 'ru' ? 'Практика:' : 'Практика:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Vipassana (Tree of Knowledge) • Vision: expanding complexity of representation.'
                      : lang === 'ru'
                      ? 'Випашьяна (Древо познания) • Видение: рост комплексности представлений.'
                      : 'Віпаш\'яна (Дерево пізнання) • Бачення: зростання комплексності уявлень.'}
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Schema 4: World of Soul vs World of Personality (Page 118) */}
          {activeSchemaTab === 'worlds' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  {lang === 'en'
                    ? '🌊 World of Soul (Non-dual Nature)'
                    : lang === 'ru'
                    ? '🌊 Мир Души (Недвойственная природа)'
                    : '🌊 Світ Душі (Недвойственна природа)'}
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'State:' : lang === 'ru' ? 'Состояние:' : 'Стан:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Affection, tense unknowing, relying on being touched.'
                      : lang === 'ru'
                      ? 'Аффицированность, напряженное незнание, опора на затронутость.'
                      : 'Афіційованість, напружене незнання, опора на зачепленість.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Trust:' : lang === 'ru' ? 'Доверие:' : 'Довіра:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Trust in event flow. Necessity of correlating life with Creation.'
                      : lang === 'ru'
                      ? 'Доверие событийному потоку. Необходимость соотносить жизнь с Творением.'
                      : 'Довіра подійному потоку. Необхідність співвідносити життя з Творінням.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Subject:' : lang === 'ru' ? 'Субъект:' : 'Суб\'єкт:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Dividual (divisible, split subject). Need for integration.'
                      : lang === 'ru'
                      ? 'Дивид (делимый, расщепленный субъект). Потребность в интеграции.'
                      : 'Дивід (подільний, розщеплений суб\'єкт). Потреба в інтеграції.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Regime:' : lang === 'ru' ? 'Режим:' : 'Режим:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Psychoanalysis, release from blockages, sense of conscience.'
                      : lang === 'ru'
                      ? 'Психоанализ, высвобождение от блокировок, чувство совести.'
                      : 'Психоаналіз, вивільнення від блокувань, почуття совісті.'}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  {lang === 'en'
                    ? '🎯 World of Personality (Dual Nature)'
                    : lang === 'ru'
                    ? '🎯 Мир Личности (Двойственная природа)'
                    : '🎯 Світ Особистості (Двойственна природа)'}
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'State:' : lang === 'ru' ? 'Состояние:' : 'Стан:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Intentionality, exciting desire, relying on ambition.'
                      : lang === 'ru'
                      ? 'Интенциональность, захватывающее желание, опора на амбиции.'
                      : 'Інтенціональність, захоплююче бажання, опора на амбіції.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Trust:' : lang === 'ru' ? 'Доверие:' : 'Довіра:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Trust in subjective will. Freedom to define own meaning and goals.'
                      : lang === 'ru'
                      ? 'Доверие субъективной воле. Свобода самому определять смысл и цели.'
                      : 'Довіра суб\'єктивній волі. Свобода самому визначати сенс та цілі.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Subject:' : lang === 'ru' ? 'Субъект:' : 'Суб\'єкт:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Individual (indivisible, autonomous subject). Pursuit of happiness.'
                      : lang === 'ru'
                      ? 'Индивид (неделимый, автономный субъект). Стремление к счастью.'
                      : 'Індивід (неподільний, автономний суб\'єкт). Прагнення до щастя.'}
                  </li>
                  <li>
                    <strong className="text-stone-100">
                      {lang === 'en' ? 'Regime:' : lang === 'ru' ? 'Режим:' : 'Режим:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? 'Psychotherapy, asserting own vision, categories of Good and Evil.'
                      : lang === 'ru'
                      ? 'Психотерапия, утверждение собственного видения, категории Добра и Зла.'
                      : 'Психотерапія, утвердження власного бачення, категорії Добра і Зла.'}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ENCYCLOPEDIA ARTICLES VIEW */
        <>
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
              {[
                {
                  id: 'all',
                  label:
                    lang === 'en'
                      ? 'All Sections'
                      : lang === 'ru'
                      ? 'Все разделы'
                      : 'Усі розділи',
                },
                {
                  id: 'theoretical',
                  label:
                    lang === 'en'
                      ? 'Fundamental Psychology'
                      : lang === 'ru'
                      ? 'Фундаментальная психология'
                      : 'Фундаментальна психологія',
                },
                {
                  id: 'therapy',
                  label:
                    lang === 'en'
                      ? 'Psychotherapy Schools'
                      : lang === 'ru'
                      ? 'Психотерапевтические школы'
                      : 'Психотерапевтичні школи',
                },
                {
                  id: 'natural_approach',
                  label:
                    lang === 'en'
                      ? 'Natural Approach (Linetsky)'
                      : lang === 'ru'
                      ? 'Естественный подход Линецкого'
                      : 'Природний підхід Линецького',
                },
                {
                  id: 'coaching',
                  label:
                    lang === 'en'
                      ? 'Coaching & Hero’s Goal'
                      : lang === 'ru'
                      ? 'Коучинг & Цель Героя'
                      : 'Коучинг & Мета Героя',
                },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                      : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Search topics, authors, terms...'
                    : lang === 'ru'
                    ? 'Поиск темы, авторов, терминов...'
                    : 'Пошук теми, авторів, термінів...'
                }
                className="w-full rounded-xl border border-stone-800 bg-stone-900 pl-9 pr-4 py-2 text-xs text-stone-100 placeholder-stone-500 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Topics List */}
          <div className="space-y-4">
            {filteredTopics.map((topic) => {
              const isExpanded = expandedTopicId === topic.id;
              const toolAction = getToolAction(topic.id);

              return (
                <div
                  key={topic.id}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isExpanded
                      ? 'border-teal-500/40 bg-stone-900 shadow-xl'
                      : 'border-stone-800 bg-stone-900/70 hover:border-stone-700'
                  }`}
                >
                  {/* Header card button */}
                  <button
                    onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            topic.category === 'theoretical'
                              ? 'bg-sky-500/20 text-sky-300'
                              : topic.category === 'therapy'
                              ? 'bg-purple-500/20 text-purple-300'
                              : topic.category === 'natural_approach'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {topic.category === 'theoretical' &&
                            (lang === 'en' ? 'Theory' : lang === 'ru' ? 'Теория' : 'Теорія')}
                          {topic.category === 'therapy' &&
                            (lang === 'en' ? 'Psychotherapy' : lang === 'ru' ? 'Психотерапия' : 'Психотерапія')}
                          {topic.category === 'natural_approach' &&
                            (lang === 'en' ? 'Natural Approach' : lang === 'ru' ? 'Естественный подход' : 'Природний підхід')}
                          {topic.category === 'coaching' &&
                            (lang === 'en' ? 'Coaching' : lang === 'ru' ? 'Коучинг' : 'Коучинг')}
                        </span>
                        <h3 className="text-base font-bold text-stone-100">{topic.title}</h3>
                      </div>
                      <p className="text-xs text-stone-400">{topic.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-teal-400 hidden sm:inline">
                        {isExpanded
                          ? lang === 'en'
                            ? 'Collapse'
                            : lang === 'ru'
                            ? 'Свернуть'
                            : 'Згорнути'
                          : lang === 'en'
                          ? 'Details →'
                          : lang === 'ru'
                          ? 'Подробнее →'
                          : 'Докладніше →'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="p-6 border-t border-stone-800 space-y-5 text-xs bg-stone-950/50">
                      {/* Key Figures */}
                      <div className="flex items-center gap-2 text-stone-400">
                        <User className="h-4 w-4 text-teal-400" />
                        <span className="font-semibold text-stone-300">
                          {lang === 'en'
                            ? 'Key figures / Authors:'
                            : lang === 'ru'
                            ? 'Ключевые авторы:'
                            : 'Ключові постаті / Автори:'}
                        </span>
                        <span>{topic.keyFigures.join(', ')}</span>
                      </div>

                      {/* Core Concepts */}
                      <div className="space-y-2">
                        <strong className="text-stone-200 block text-xs uppercase font-semibold text-teal-400">
                          {lang === 'en'
                            ? 'Core concepts & mechanisms:'
                            : lang === 'ru'
                            ? 'Базовые понятия и механизмы:'
                            : 'Базові поняття та механізми:'}
                        </strong>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {topic.coreConcepts.map((cc, i) => (
                            <div key={i} className="rounded-xl border border-stone-800 bg-stone-900 p-3.5 space-y-1">
                              <strong className="text-stone-100 block font-semibold">{cc.name}</strong>
                              <p className="text-stone-400 leading-relaxed">{cc.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* How it helps in crisis */}
                      <div className="rounded-xl border border-teal-500/20 bg-teal-950/20 p-4 space-y-1">
                        <strong className="text-teal-300 block font-semibold flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5" />
                          {lang === 'en'
                            ? 'How this approach resolves crisis & self-doubt:'
                            : lang === 'ru'
                            ? 'Как этот подход помогает выйти из кризиса и сомнений:'
                            : 'Як цей підхід допомагає вийти з кризи та сумнівів:'}
                        </strong>
                        <p className="text-stone-200 leading-relaxed">{topic.howItHelpsInCrisis}</p>
                      </div>

                      {/* Practical Example */}
                      <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 space-y-1">
                        <strong className="text-stone-300 block font-semibold flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                          {lang === 'en'
                            ? 'Real-life practical example:'
                            : lang === 'ru'
                            ? 'Пример из реальной жизни:'
                            : 'Приклад із реального життя:'}
                        </strong>
                        <p className="text-stone-400 leading-relaxed">{topic.practicalExample}</p>
                      </div>

                      {/* Key Question */}
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
                        <strong className="text-amber-300 block font-semibold flex items-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5" />
                          {lang === 'en'
                            ? 'Key transformational question:'
                            : lang === 'ru'
                            ? 'Ключевой трансформационный вопрос:'
                            : 'Ключове трансформаційне запитання:'}
                        </strong>
                        <p className="text-stone-100 font-serif italic text-sm">{topic.keyQuestion}</p>
                      </div>

                      {/* Action link */}
                      {toolAction && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => onNavigateToTool(toolAction.tab)}
                            className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-semibold text-stone-950 hover:bg-teal-500 transition-all shadow-md cursor-pointer"
                          >
                            <span>{toolAction.label}</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
