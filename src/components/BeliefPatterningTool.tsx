import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Shield,
  RefreshCw,
  Save,
  CheckCircle,
  Brain,
  Layers,
  ArrowRight,
  HelpCircle,
  Shuffle,
  Lightbulb,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { requestBeliefPatternTransform } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { logUserActivity } from '../services/userStatsService';
import { BeliefPatternReframe } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

interface PresetBelief {
  sphere: string;
  sphereUk: string;
  sphereRu: string;
  beliefUk: string;
  beliefRu: string;
}

const PRESET_BELIEFS: PresetBelief[] = [
  {
    sphere: 'money',
    sphereUk: 'Гроші та бізнес',
    sphereRu: 'Деньги и бизнес',
    beliefUk: 'Великі гроші чесно заробити неможливо, для цього потрібні лише звʼязки.',
    beliefRu: 'Большие деньги честно заработать невозможно, для этого нужны только связи.',
  },
  {
    sphere: 'impostor',
    sphereUk: 'Самооцінка та карʼєра',
    sphereRu: 'Самооценка и карьера',
    beliefUk: 'Я ще недостатньо знаю і не маю права заявляти про себе як експерт.',
    beliefRu: 'Я еще недостаточно знаю и не имею права заявлять о себе как эксперт.',
  },
  {
    sphere: 'relationships',
    sphereUk: 'Стосунки та любов',
    sphereRu: 'Отношения и любовь',
    beliefUk: 'Якщо відкритися іншій людині, вона обовʼязково цим скористається і завдасть болю.',
    beliefRu: 'Если открыться другому человеку, он обязательно этим воспользуется и причинит боль.',
  },
  {
    sphere: 'perfectionism',
    sphereUk: 'Дії та прокрастинація',
    sphereRu: 'Действия и прокрастинация',
    beliefUk: 'Якщо я не можу зробити все бездоганно з першого разу, краще взагалі не починати.',
    beliefRu: 'Если я не могу сделать все безупречно с первого раза, лучше вообще не начинать.',
  },
  {
    sphere: 'age_change',
    sphereUk: 'Вік та зміни',
    sphereRu: 'Возраст и перемены',
    beliefUk: 'Вже запізно кардинально змінювати професію чи починати щось з нуля.',
    beliefRu: 'Уже слишком поздно кардинально менять профессию или начинать что-то с нуля.',
  },
];

interface BeliefPatterningToolProps {
  onSavedToJournal?: () => void;
}

export const BeliefPatterningTool: React.FC<BeliefPatterningToolProps> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();

  const [selectedSphere, setSelectedSphere] = useState('impostor');
  const [limitingBelief, setLimitingBelief] = useState(
    'Я ще недостатньо знаю і не маю права заявляти про себе як експерт.'
  );
  const [context, setContext] = useState('');
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [result, setResult] = useState<BeliefPatternReframe | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSelectPreset = (preset: PresetBelief) => {
    setSelectedSphere(preset.sphere);
    setLimitingBelief(lang === 'ru' ? preset.beliefRu : preset.beliefUk);
  };

  const handleTransform = async () => {
    if (!limitingBelief.trim()) return;
    setAnalyzingAi(true);

    try {
      const res = await requestBeliefPatternTransform({
        limitingBelief: limitingBelief.trim(),
        sphere: selectedSphere,
        context: context.trim() || undefined,
      });

      setResult(res);

      logUserActivity({
        tab: 'beliefPatterning',
        toolName: '14 фокусів мови Роберта Ділтса',
        querySummary: `Трансформація переконання: "${limitingBelief.slice(0, 100)}"`,
        category: 'Beliefs',
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSaveToJournal = () => {
    if (!result) return;
    saveJournalEntry({
      type: 'beliefPatterning',
      title: `Патеринг переконання: "${result.limitingBelief.slice(0, 45)}..."`,
      summary: result.liberatingCoreBelief,
      data: result,
    });
    setSavedFeedback(true);
    if (onSavedToJournal) onSavedToJournal();
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  const SLEIGHT_OF_MOUTH_KEYS: {
    key: keyof BeliefPatternReframe['sleightOfMouthReframes'];
    labelUk: string;
    labelRu: string;
    labelEn: string;
    descUk: string;
    descRu: string;
    descEn: string;
  }[] = [
    {
      key: 'intention',
      labelUk: '1. Намір (Intention)',
      labelRu: '1. Намерение',
      labelEn: '1. Intention',
      descUk: 'Фокус на позитивному захисному намірі переконання',
      descRu: 'Фокус на позитивном защитном намерении убеждения',
      descEn: 'Focus on the positive protective intention behind the belief',
    },
    {
      key: 'redefine',
      labelUk: '2. Перевизначення (Redefine)',
      labelRu: '2. Переопределение',
      labelEn: '2. Redefine',
      descUk: 'Заміна ключових слів на більш ресурсні синоніми',
      descRu: 'Замена ключевых слов на более ресурсные синонимы',
      descEn: 'Swapping critical words with resource-rich synonyms',
    },
    {
      key: 'consequence',
      labelUk: '3. Наслідки (Consequence)',
      labelRu: '3. Последствия',
      labelEn: '3. Consequence',
      descUk: 'До чого призведе утримання цієї думки',
      descRu: 'К чему приведет удержание этой мысли в будущем',
      descEn: 'Direct long-term effects of holding this belief',
    },
    {
      key: 'chunkDown',
      labelUk: '4. Розділення (Chunk Down)',
      labelRu: '4. Разделение на части',
      labelEn: '4. Chunk Down',
      descUk: 'Дроблення на конкретні дрібні елементи',
      descRu: 'Дробление на конкретные мелкие элементы и детали',
      descEn: 'Breaking down into specific actionable micro-elements',
    },
    {
      key: 'chunkUp',
      labelUk: '5. Узагальнення (Chunk Up)',
      labelRu: '5. Обобщение',
      labelEn: '5. Chunk Up',
      descUk: 'Підйом на вищу категорію сенсу',
      descRu: 'Подъем на более высокую категорию смысла и ценности',
      descEn: 'Elevating to a broader category of meaning',
    },
    {
      key: 'analogy',
      labelUk: '6. Аналогія (Metaphor / Analogy)',
      labelRu: '6. Аналогия и метафора',
      labelEn: '6. Metaphor / Analogy',
      descUk: 'Яскравий метафоричний образ із життя чи природи',
      descRu: 'Яркий метафорический образ из жизни или природы',
      descEn: 'Vivid metaphor or parallel from nature/life',
    },
    {
      key: 'changeFrameSize',
      labelUk: '7. Масштаб часу (Change Frame Size)',
      labelRu: '7. Изменение масштаба',
      labelEn: '7. Change Frame Size',
      descUk: 'Погляд у перспективі 5-10 років або іншого масштабу',
      descRu: 'Взгляд в перспективе 5-10 лет или другого масштаба',
      descEn: 'Viewing across a 5-10 year horizon or larger frame',
    },
    {
      key: 'anotherOutcome',
      labelUk: '8. Інший результат (Another Outcome)',
      labelRu: '8. Другой результат',
      labelEn: '8. Another Outcome',
      descUk: 'Перемикання на більш важливу довгострокову мету',
      descRu: 'Переключение на более важную долгосрочную цель',
      descEn: 'Shifting focus to a higher primary goal',
    },
    {
      key: 'modelOfTheWorld',
      labelUk: '9. Модель світу (Model of the World)',
      labelRu: '9. Модель мира',
      labelEn: '9. Model of the World',
      descUk: 'Як на це дивиться інша філософія чи мудра людина',
      descRu: 'Как на это смотрит другая философия или мудрый наставник',
      descEn: 'Viewing through the lens of another philosophy or wise mentor',
    },
    {
      key: 'hierarchyOfCriteria',
      labelUk: '10. Ієрархія критеріїв (Hierarchy of Criteria)',
      labelRu: '10. Иерархия критериев',
      labelEn: '10. Hierarchy of Criteria',
      descUk: 'Що набагато важливіше за це правило',
      descRu: 'Что гораздо важнее этого ограничивающего правила',
      descEn: 'Prioritizing a higher core value over this restriction',
    },
    {
      key: 'applyToSelf',
      labelUk: '11. Застосування до себе (Apply to Self)',
      labelRu: '11. Применение к себе',
      labelEn: '11. Apply to Self',
      descUk: 'Перевірка самого переконання за його ж власним критерієм',
      descRu: 'Проверка самого убеждения по его же собственному критерию',
      descEn: 'Applying the belief rule reflexively to itself',
    },
    {
      key: 'metaFrame',
      labelUk: '12. Мета-фрейм (Meta Frame)',
      labelRu: '12. Мета-фрейм',
      labelEn: '12. Meta Frame',
      descUk: 'Позиція спостерігача: оцінка переконання з висоти',
      descRu: 'Позиция наблюдателя: взгляд на убеждение с высоты',
      descEn: 'Observer perspective evaluating the belief from above',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-rose-950/80 border border-amber-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {lang === 'ru'
                  ? 'Паттеринг убеждений & 14 Фокусов языка Дилтса'
                  : lang === 'en'
                  ? 'Belief Patterning & Dilts 14 Sleight of Mouth'
                  : 'Патеринг переконань & 14 Фокусів мови Роберта Ділтса'}
              </h1>
              <p className="text-amber-200/80 text-sm mt-1">
                {lang === 'ru'
                  ? 'Выявление ограничивающих ментальных установок и их деконструкция через Sleight of Mouth'
                  : 'Виявлення обмежуючих ментальних установок та їхня деконструкція через Sleight of Mouth'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {lang === 'ru' ? 'Типичные паттерны ограничивающих убеждений:' : 'Типові патерни обмежуючих переконань:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_BELIEFS.map((preset) => (
            <button
              key={preset.sphere}
              onClick={() => handleSelectPreset(preset)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-all ${
                selectedSphere === preset.sphere
                  ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {lang === 'ru' ? preset.sphereRu : preset.sphereUk}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-200">
              {lang === 'ru' ? 'Ограничивающее убеждение для разбора:' : 'Обмежуюче переконання для розбору:'}
            </label>
            <VoiceInputButton
              onTranscript={(text) => setLimitingBelief(text)}
              className="p-1"
            />
          </div>
          <input
            type="text"
            value={limitingBelief}
            onChange={(e) => setLimitingBelief(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'Введите мысль или ограничивающее убеждение...'
                : lang === 'en'
                ? 'Enter a limiting belief or thought...'
                : 'Введіть думку або переконання...'
            }
            className="w-full text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              {lang === 'ru'
                ? 'Контекст ситуации (по желанию):'
                : lang === 'en'
                ? 'Situation Context (optional):'
                : 'Контекст ситуації (за бажанням):'}
            </label>
            <VoiceInputButton
              onTranscript={(text) => setContext((prev) => (prev ? `${prev} ${text}` : text))}
              className="p-1"
            />
          </div>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'В какой ситуации эта мысль сильнее всего мешает действовать...'
                : lang === 'en'
                ? 'In what situation does this belief block your actions most...'
                : 'В якій ситуації ця думка найбільше заважає діяти...'
            }
            rows={2}
            className="w-full text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={handleTransform}
          disabled={analyzingAi || !limitingBelief.trim()}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {analyzingAi ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>{t('loading_ai')}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-amber-200" />
              <span>
                {lang === 'ru'
                  ? 'Деконструировать через 14 Фокусов языка'
                  : lang === 'en'
                  ? 'Deconstruct via 14 Sleight of Mouth Reframes'
                  : 'Деконструювати через 14 Фокусів мови'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Reframe Deck Results */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-amber-800/50 rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                {lang === 'ru'
                  ? 'Освобождающее ядро убеждения'
                  : lang === 'en'
                  ? 'Liberating Core Belief'
                  : 'Визвольне ядро переконання'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {result.liberatingCoreBelief}
              </h2>
            </div>
            <button
              onClick={handleSaveToJournal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
            >
              {savedFeedback ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{savedFeedback ? t('saved_successfully') : t('save_to_journal')}</span>
            </button>
          </div>

          {/* Diagnostic Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-bold text-rose-400 uppercase">
                {lang === 'ru'
                  ? 'Тип лингвистического искажения:'
                  : lang === 'en'
                  ? 'Linguistic Distortion Pattern:'
                  : 'Тип лінгвістичного спотворення:'}
              </span>
              <p className="text-xs text-slate-300 mt-1">{result.distortionType}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs font-bold text-emerald-400 uppercase">
                {lang === 'ru'
                  ? 'Скрытое позитивное намерение (Защита):'
                  : lang === 'en'
                  ? 'Hidden Positive Protective Intention:'
                  : 'Прихований позитивний намір (Захист):'}
              </span>
              <p className="text-xs text-slate-300 mt-1">{result.positiveIntention}</p>
            </div>
          </div>

          {/* 12 Sleight of Mouth Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'ru'
                ? '12 Фокусов языка Роберта Дилтса (Трансформационная колода):'
                : lang === 'en'
                ? '12 Dilts Sleight of Mouth Reframes (Transformational Deck):'
                : '12 Фокусів мови Роберта Ділтса (Трансформаційна колода):'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SLEIGHT_OF_MOUTH_KEYS.map((item) => {
                const text = result.sleightOfMouthReframes[item.key] || '';
                return (
                  <div
                    key={item.key}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">
                        {lang === 'ru' ? item.labelRu : lang === 'en' ? item.labelEn : item.labelUk}
                      </span>
                    </div>
                    <span className="block text-[10px] text-slate-400 italic">
                      {lang === 'ru' ? item.descRu : lang === 'en' ? item.descEn : item.descUk}
                    </span>
                    <p className="text-xs text-slate-200 mt-1 leading-relaxed">{text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BeliefPatterningTool;
