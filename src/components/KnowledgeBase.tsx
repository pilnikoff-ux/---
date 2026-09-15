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

interface KnowledgeBaseProps {
  onNavigateToTool: (tab: TabType) => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onNavigateToTool }) => {
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
        return { label: 'Відкрити КПТ Щоденник Думок', tab: 'cbt' };
      case 'natural_approach':
      case 'natural_ontologies':
      case 'natural_dialectic':
      case 'natural_event_matrix':
      case 'natural_transformation_protocols':
        return { label: 'Розбір ситуації за Природним підходом', tab: 'consilium' };
      case 'psychodynamics':
        return { label: 'Пройти тест 16 асоціацій Юнга', tab: 'associations16' };
      case 'coaching_grow':
      case 'goal_makers_game':
        return { label: 'Перейти в трекер «Мета Героя»', tab: 'goalMakers' };
      case 'goal_makers_confinement':
        return { label: 'Грати в гру «Goal MAker$»', tab: 'goalMakersBoard' };
      default:
        return { label: 'Запустити Консиліум', tab: 'consilium' };
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3 py-1 text-xs font-semibold text-teal-400">
          <BookOpen className="h-3.5 w-3.5" />
          База Знань & «Вспалахи Вічної Філософії» Олега Линецького
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-100 sm:text-3xl font-serif">
          Енциклопедія Психології, Психотерапії та Природного Підходу
        </h1>
        <p className="text-sm text-stone-400 max-w-3xl leading-relaxed">
          Структурований довідник та інтерактивні онтологічні схеми: від класичних шкіл психотерапії до енергетичної діалектики розривів, 108 бусин подій та протоколів перетворень.
        </p>
      </div>

      {/* Main Switcher: Articles vs Visual Schemas */}
      <div className="flex border-b border-stone-800 pb-2 gap-3">
        <button
          onClick={() => setActiveSubTab('encyclopedia')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'encyclopedia'
              ? 'bg-teal-600/20 text-teal-300 border border-teal-500/50'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Статті та Концепції ({filteredTopics.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('visual_schemas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'visual_schemas'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Інтерактивні Схеми & Матриця 108 Бусин</span>
        </button>
      </div>

      {activeSubTab === 'visual_schemas' ? (
        /* VISUAL SCHEMAS VIEW */
        <div className="space-y-6">
          {/* Subtabs for schemas */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'matrix9', label: '📊 Матриця 9 класів запитів (3x3)' },
              { id: 'paradigms', label: '☯️ Подійна vs Об\'єктна парадигма' },
              { id: 'dialectic', label: '⚖️ Іманентна vs Трансцендентна діалектика' },
              { id: 'worlds', label: '🌌 Світ Душі vs Світ Особистості' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setActiveSchemaTab(st.id as any)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
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
                  Схема 119: 9-клітинна Матриця Подійного Запиту (108 Бусин)
                </span>
                <p className="text-xs text-stone-400">
                  Класифікація будь-якого психологічного та життєвого запиту за сферою уваги (Емоції, Увага, Бажання) та стадією процесу (Зародження, Підтримання, Завершення).
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-800 text-left text-stone-400">
                      <th className="p-3">Стадія \ Сфера</th>
                      <th className="p-3 text-sky-300">💙 Емоції & Почуття</th>
                      <th className="p-3 text-teal-300">👁️ Увага & Розриви</th>
                      <th className="p-3 text-amber-300">🔥 Бажання & Потяги</th>
                      <th className="p-3 text-purple-300">Фокус рефлексії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    <tr className="bg-stone-950/40">
                      <td className="p-3 font-bold text-stone-200">1. Зародження (Нове)</td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-sky-300 block">Від апатії до пожвавлення</strong>
                        Початок гри, вміння співучасті
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-teal-300 block">Від туги до здивування</strong>
                        Поява інтересу, торкання
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-amber-300 block">Від нудьги до захоплення</strong>
                        Початок задуму, спокуса
                      </td>
                      <td className="p-3 font-semibold text-purple-300">Екзистенційний фокус</td>
                    </tr>
                    <tr className="bg-stone-950/20">
                      <td className="p-3 font-bold text-stone-200">2. Підтримання (Процес)</td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-sky-300 block">Від обурення до прийняття</strong>
                        Відстоювання кордонів, опір
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-teal-300 block">Від відволікання до присутності</strong>
                        Збереження фокусу, зосередження
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-amber-300 block">Від виклику до визнання</strong>
                        Здобуття перемоги, змагання
                      </td>
                      <td className="p-3 font-semibold text-purple-300">Гуманістичний фокус</td>
                    </tr>
                    <tr className="bg-stone-950/40">
                      <td className="p-3 font-bold text-stone-200">3. Завершення (Підсумок)</td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-sky-300 block">Від втоми до полегшення</strong>
                        Завершення драми, співпереживання
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-teal-300 block">Від сум'яття до прояснення</strong>
                        Внесення ясності, со-віднесення
                      </td>
                      <td className="p-3 text-stone-300">
                        <strong className="text-amber-300 block">Від пристрасті до володіння</strong>
                        Укладання союзу, співпраця
                      </td>
                      <td className="p-3 font-semibold text-purple-300">Психодинамічний фокус</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-stone-900 border-t border-stone-800 text-[11px] text-stone-400 font-semibold">
                      <td className="p-3">Метод допомоги:</td>
                      <td className="p-3 text-sky-400">Терапія почуттів</td>
                      <td className="p-3 text-teal-400">Mindfulness / Присутність</td>
                      <td className="p-3 text-amber-400">Коучинг дій</td>
                      <td className="p-3 text-purple-400">Інтегральний синтез</td>
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
                  Подійна парадигма (Світ Розривів)
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li><strong className="text-stone-100">Одиниця мислення:</strong> Зміни у часі, розриви дійсності.</li>
                  <li><strong className="text-stone-100">Що досліджується:</strong> Події, відкриття спонтанні.</li>
                  <li><strong className="text-stone-100">Ключові питання:</strong> «Що трапляється? Що в цьому вражає? Як із цим бути?»</li>
                  <li><strong className="text-stone-100">Сприйняття:</strong> Розмикання свідомості до вторгнення буття. Вільний розщеплений розум.</li>
                  <li><strong className="text-stone-100">Категорії:</strong> Енергія, Хвилі, Пустота, Становлення, Постмодерн, Тантра.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-sky-500/30 bg-sky-950/20 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <Compass className="h-4 w-4" />
                  Об'єктна парадигма (Світ Феноменів)
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li><strong className="text-stone-100">Одиниця мислення:</strong> Явища поза часом, цілісні сутності.</li>
                  <li><strong className="text-stone-100">Що досліджується:</strong> Властивості об'єктів, сценарії випадкові.</li>
                  <li><strong className="text-stone-100">Ключові питання:</strong> «Що помічається? Як це зрозуміти та застосувати?»</li>
                  <li><strong className="text-stone-100">Сприйняття:</strong> Замикання свідомості на предметах сущого. Спрямований розум, цілісність.</li>
                  <li><strong className="text-stone-100">Категорії:</strong> Об'єкти, Частинки, Форми, Існування, Модерн, Сутра.</li>
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
                  Іманентна діалектика (Заглиблення)
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li><strong className="text-stone-100">Завдання:</strong> Бути зрозумілим іншим.</li>
                  <li><strong className="text-stone-100">Джерело істини:</strong> Істина приходить зсередини (Критерій — почуття справедливості).</li>
                  <li><strong className="text-stone-100">Методологія (Етика):</strong> Розрізнення та зв'язування. Від конфлікту до згоди.</li>
                  <li><strong className="text-stone-100">Питання:</strong> «У чому справа? Що заважає?» (Політика рівності прав).</li>
                  <li><strong className="text-stone-100">Практика:</strong> Шаматха (Дерево життя) • Чутливість: зростання розрізнюючої здатності.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Трансцендентна діалектика (Розширення)
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li><strong className="text-stone-100">Завдання:</strong> Бути розуміючим масштаб цілого.</li>
                  <li><strong className="text-stone-100">Джерело істини:</strong> Істина приходить ззовні (Критерій — почуття натхнення).</li>
                  <li><strong className="text-stone-100">Методологія (Естетика):</strong> Перевершення та включення. Від плутанини до цілісності.</li>
                  <li><strong className="text-stone-100">Питання:</strong> «У чому сенс? Для чого це?» (Ідеологія та вбудовування у своє місце).</li>
                  <li><strong className="text-stone-100">Практика:</strong> Віпаш'яна (Дерево пізнання) • Бачення: зростання комплексності уявлень.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Schema 4: World of Soul vs World of Personality (Page 118) */}
          {activeSchemaTab === 'worlds' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  🌊 Світ Душі (Недвойственна природа)
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li><strong className="text-stone-100">Стан:</strong> Афіційованість, напружене незнання, опора на зачепленість.</li>
                  <li><strong className="text-stone-100">Довіра:</strong> Довіра подійному потоку. Необхідність співвідносити життя з Творінням.</li>
                  <li><strong className="text-stone-100">Суб'єкт:</strong> Дивід (подільний, розщеплений суб'єкт). Потреба в інтеграції.</li>
                  <li><strong className="text-stone-100">Режим:</strong> Психоаналіз, вивільнення від блокувань, почуття совісті.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-stone-800 bg-stone-900 p-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  🎯 Світ Особистості (Двойственна природа)
                </span>
                <ul className="space-y-2 text-xs text-stone-300">
                  <li><strong className="text-stone-100">Стан:</strong> Інтенціональність, захоплююче бажання, опора на амбіції.</li>
                  <li><strong className="text-stone-100">Довіра:</strong> Довіра суб'єктивній волі. Свобода самому визначати сенс та цілі.</li>
                  <li><strong className="text-stone-100">Суб'єкт:</strong> Індивід (неподільний, автономний суб'єкт). Прагнення до щастя.</li>
                  <li><strong className="text-stone-100">Режим:</strong> Психотерапія, утвердження власного бачення, категорії Добра і Зла.</li>
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
                { id: 'all', label: 'Усі розділи' },
                { id: 'theoretical', label: 'Фундаментальна психологія' },
                { id: 'therapy', label: 'Психотерапевтичні школи' },
                { id: 'natural_approach', label: 'Природний підхід Линецького' },
                { id: 'coaching', label: 'Коучинг & Мета Героя' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
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
                placeholder="Пошук теми, авторів, термінів..."
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
                    className="w-full flex items-center justify-between p-5 text-left transition-colors"
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
                          {topic.category === 'theoretical' && 'Теорія'}
                          {topic.category === 'therapy' && 'Психотерапія'}
                          {topic.category === 'natural_approach' && 'Природний підхід'}
                          {topic.category === 'coaching' && 'Коучинг'}
                        </span>
                        <h3 className="text-base font-bold text-stone-100">{topic.title}</h3>
                      </div>
                      <p className="text-xs text-stone-400">{topic.subtitle}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-teal-400 hidden sm:inline">
                        {isExpanded ? 'Згорнути' : 'Докладніше →'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="p-6 border-t border-stone-800 space-y-5 text-xs bg-stone-950/50">
                      {/* Key Figures */}
                      <div className="flex items-center gap-2 text-stone-400">
                        <User className="h-4 w-4 text-teal-400" />
                        <span className="font-semibold text-stone-300">Ключові постаті / Автори:</span>
                        <span>{topic.keyFigures.join(', ')}</span>
                      </div>

                      {/* Core Concepts */}
                      <div className="space-y-2">
                        <strong className="text-stone-200 block text-xs uppercase font-semibold text-teal-400">
                          Базові поняття та механізми:
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
                          Як цей підхід допомагає вийти з кризи та сумнівів:
                        </strong>
                        <p className="text-stone-200 leading-relaxed">{topic.howItHelpsInCrisis}</p>
                      </div>

                      {/* Practical Example */}
                      <div className="rounded-xl border border-stone-800 bg-stone-900 p-4 space-y-1">
                        <strong className="text-stone-300 block font-semibold flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                          Приклад із реального життя:
                        </strong>
                        <p className="text-stone-400 leading-relaxed">{topic.practicalExample}</p>
                      </div>

                      {/* Key Question */}
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-1">
                        <strong className="text-amber-300 block font-semibold flex items-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5" />
                          Ключове трансформаційне запитання:
                        </strong>
                        <p className="text-stone-100 font-serif italic text-sm">{topic.keyQuestion}</p>
                      </div>

                      {/* Action link */}
                      {toolAction && (
                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => onNavigateToTool(toolAction.tab)}
                            className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-semibold text-stone-950 hover:bg-teal-500 transition-all shadow-md"
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
