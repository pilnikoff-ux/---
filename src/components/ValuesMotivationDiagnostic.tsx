import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Compass,
  Heart,
  Sparkles,
  Zap,
  Shield,
  Star,
  Activity,
  Award,
  Layers,
  Save,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { requestValuesMotivationAnalysis } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { logUserActivity } from '../services/userStatsService';
import { ValuesMotivationProfile, ValueItemScore } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

interface ValueDefinition {
  id: string;
  nameUk: string;
  nameRu: string;
  nameEn: string;
  categoryUk: string;
  descriptionUk: string;
  descriptionRu: string;
  descriptionEn: string;
  icon: any;
  color: string;
}

const SCHWARTZ_VALUES_CATALOG: ValueDefinition[] = [
  {
    id: 'self_direction',
    nameUk: 'Самостійність та свобода',
    nameRu: 'Самостоятельность и свобода',
    nameEn: 'Self-Direction & Autonomy',
    categoryUk: 'Відкритість до змін',
    descriptionUk: 'Свобода думок і дій, творчість, дослідження власного потенціалу без зовнішнього примусу.',
    descriptionRu: 'Свобода мыслей и действий, творчество, исследование своего потенциала.',
    descriptionEn: 'Freedom of thought and action, creativity, self-determination.',
    icon: Compass,
    color: 'from-sky-500 to-blue-600',
  },
  {
    id: 'stimulation',
    nameUk: 'Стимуляція та новизна',
    nameRu: 'Стимуляция и новизна',
    nameEn: 'Stimulation & Novelty',
    categoryUk: 'Відкритість до змін',
    descriptionUk: 'Прагнення до хвилювання, викликів, яскравих відчуттів та нових життєвих пригод.',
    descriptionRu: 'Стремление к волнению, вызовам, ярким ощущениям и новизне.',
    descriptionEn: 'Excitement, novelty, and challenge in life.',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'hedonism',
    nameUk: 'Гедонізм та задоволення',
    nameRu: 'Гедонизм и наслаждение',
    nameEn: 'Hedonism & Pleasure',
    categoryUk: 'Відкритість / Самопідсилення',
    descriptionUk: 'Насолода життям, чуттєве задоволення, радість та комфорт тут і зараз.',
    descriptionRu: 'Наслаждение жизнью, чувственное удовольствие, радость и комфорт.',
    descriptionEn: 'Pleasure and sensuous gratification for oneself.',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'achievement',
    nameUk: 'Досягнення та успіх',
    nameRu: 'Достижения и успех',
    nameEn: 'Achievement & Success',
    categoryUk: 'Самопідсилення',
    descriptionUk: 'Особистий успіх через прояв компетентності згідно з високими стандартами.',
    descriptionRu: 'Личный успех через компетентность и высокие стандарты.',
    descriptionEn: 'Personal success through demonstrating competence according to social standards.',
    icon: Award,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'power',
    nameUk: 'Влада та вплив',
    nameRu: 'Власть и статус',
    nameEn: 'Power & Influence',
    categoryUk: 'Самопідсилення',
    descriptionUk: 'Соціальний статус, престиж, контроль над ресурсами та людьми, лідерство.',
    descriptionRu: 'Социальный статус, престиж, лидерство и контроль над ресурсами.',
    descriptionEn: 'Social status and prestige, control or dominance over people and resources.',
    icon: Star,
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'security',
    nameUk: 'Безпека та стабільність',
    nameRu: 'Безопасность и стабильность',
    nameEn: 'Security & Safety',
    categoryUk: 'Збереження',
    descriptionUk: 'Безпека, гармонія та стабільність суспільства, сімʼї та самого себе.',
    descriptionRu: 'Безопасность, гармония и стабильность семьи, общества и себя.',
    descriptionEn: 'Safety, harmony, and stability of society, of relationships, and of self.',
    icon: Shield,
    color: 'from-blue-600 to-cyan-700',
  },
  {
    id: 'conformity',
    nameUk: 'Конформізм та правила',
    nameRu: 'Конформизм и порядок',
    nameEn: 'Conformity & Order',
    categoryUk: 'Збереження',
    descriptionUk: 'Стримування дій, які можуть завдати шкоди іншим або порушити соціальні норми.',
    descriptionRu: 'Сдерживание действий, нарушающих социальные ожидания и нормы.',
    descriptionEn: 'Restraint of actions, inclinations, and impulses likely to upset or harm others.',
    icon: Layers,
    color: 'from-stone-500 to-slate-700',
  },
  {
    id: 'tradition',
    nameUk: 'Традиція та коріння',
    nameRu: 'Традиция и обычаи',
    nameEn: 'Tradition & Heritage',
    categoryUk: 'Збереження',
    descriptionUk: 'Повага, прийняття та дотримання звичаїв та ідей своєї культури чи релігії.',
    descriptionRu: 'Уважение и соблюдение традиций и обычаев своей культуры.',
    descriptionEn: 'Respect, commitment, and acceptance of cultural or religious customs.',
    icon: Activity,
    color: 'from-amber-700 to-stone-800',
  },
  {
    id: 'benevolence',
    nameUk: 'Доброта та турбота',
    nameRu: 'Доброта и забота',
    nameEn: 'Benevolence & Care',
    categoryUk: 'Самотрансцендентність',
    descriptionUk: 'Збереження та підвищення благополуччя близьких людей, вірність, щирість.',
    descriptionRu: 'Забота о благополучии близких людей, верность, искренность.',
    descriptionEn: 'Preserving and enhancing the welfare of those with whom one is in personal contact.',
    icon: Heart,
    color: 'from-rose-500 to-emerald-600',
  },
  {
    id: 'universalism',
    nameUk: 'Універсалізм та справедливість',
    nameRu: 'Универсализм и справедливость',
    nameEn: 'Universalism & Ecology',
    categoryUk: 'Самотрансцендентність',
    descriptionUk: 'Розуміння, терпимість, захист справедливості для всіх людей та турбота про природу.',
    descriptionRu: 'Терпимость, справедливость для всех людей и защита природы.',
    descriptionEn: 'Understanding, appreciation, tolerance, and protection for the welfare of all people and nature.',
    icon: TrendingUp,
    color: 'from-teal-500 to-green-600',
  },
];

interface ValuesMotivationDiagnosticProps {
  onSavedToJournal?: () => void;
}

export const ValuesMotivationDiagnostic: React.FC<ValuesMotivationDiagnosticProps> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();

  // Self-Determination Needs (1-10)
  const [autonomy, setAutonomy] = useState<number>(7);
  const [competence, setCompetence] = useState<number>(8);
  const [relatedness, setRelatedness] = useState<number>(6);

  // Schwartz Values Scores (1-10)
  const [valueScores, setValueScores] = useState<Record<string, number>>({
    self_direction: 9,
    stimulation: 7,
    hedonism: 6,
    achievement: 8,
    power: 5,
    security: 6,
    conformity: 4,
    tradition: 4,
    benevolence: 8,
    universalism: 8,
  });

  const [userSituation, setUserSituation] = useState('');
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [profile, setProfile] = useState<ValuesMotivationProfile | null>(null);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleValueChange = (id: string, score: number) => {
    setValueScores((prev) => ({ ...prev, [id]: score }));
  };

  const handleRunAiAnalysis = async () => {
    setAnalyzingAi(true);

    const allValuesList: ValueItemScore[] = SCHWARTZ_VALUES_CATALOG.map((v) => ({
      id: v.id,
      nameUk: v.nameUk,
      nameRu: v.nameRu,
      nameEn: v.nameEn,
      categoryUk: v.categoryUk,
      score: valueScores[v.id] || 5,
    }));

    allValuesList.sort((a, b) => b.score - a.score);
    const topValues = allValuesList.slice(0, 4);

    try {
      const aiAnalysis = await requestValuesMotivationAnalysis({
        selfDeterminationNeeds: { autonomy, competence, relatedness },
        topValues,
        userSituation: userSituation.trim() || undefined,
      });

      const newProfile: ValuesMotivationProfile = {
        id: `val_prof_${Date.now()}`,
        date: new Date().toISOString(),
        selfDeterminationNeeds: { autonomy, competence, relatedness },
        topValues,
        allValues: allValuesList,
        aiAnalysis,
      };

      setProfile(newProfile);

      logUserActivity({
        tab: 'valuesMotivation',
        toolName: 'Діагностика мотивації та цінностей',
        querySummary: `Автономія: ${autonomy}, Компетентність: ${competence}, Звʼязок: ${relatedness}. Топ: ${topValues.map((v) => v.nameUk).join(', ')}`,
        category: 'Values',
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
      type: 'valuesMotivation',
      title: `Цінності & Мотивація: Топ (${profile.topValues.map((v) => v.nameUk).slice(0, 2).join(', ')})`,
      summary: profile.aiAnalysis?.dominantNeedDiagnosis || 'Діагностика базових потреб та цінностей',
      data: profile,
    });
    setSavedFeedback(true);
    if (onSavedToJournal) onSavedToJournal();
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950/70 via-slate-900 to-indigo-950/80 border border-teal-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Compass className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {lang === 'ru'
                  ? 'Диагностика глубинной мотивации и ценностей'
                  : lang === 'en'
                  ? 'Deep Motivation & Core Values Diagnostic'
                  : 'Діагностика глибинної мотивації та цінностей'}
              </h1>
              <p className="text-teal-200/80 text-sm mt-1">
                {lang === 'ru'
                  ? 'Теория самодетерминации (Деси & Райан) и Карта 10 базовых ценностей Шалома Шварца'
                  : lang === 'en'
                  ? 'Self-Determination Theory & Shalom Schwartz Map of 10 Core Values'
                  : 'Теорія самодетермінації (Десі & Раян) та Карта 10 базових цінностей Шалома Шварца'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Part 1: Self-Determination Needs (3 Sliders) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            {lang === 'ru'
              ? '1. Три базовые психологические потребности (Самодетерминация)'
              : lang === 'en'
              ? '1. Three Basic Psychological Needs (Self-Determination)'
              : '1. Три базові психологічні потреби (Самодетермінація)'}
          </h2>
          <span className="text-xs text-slate-400 italic hidden sm:inline">
            {lang === 'ru' ? 'Оцените текущую наполненность от 1 до 10' : 'Оцініть поточну наповненість від 1 до 10'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Autonomy */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-sky-400">
                {lang === 'ru'
                  ? 'Автономия (Autonomy)'
                  : lang === 'en'
                  ? 'Autonomy'
                  : 'Автономія (Autonomy)'}
              </span>
              <span className="text-base font-bold text-white px-2 py-0.5 rounded bg-sky-950/80 border border-sky-700">
                {autonomy}/10
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ru'
                ? 'Чувство свободы выбора, авторства своих решений и независимости от внешнего давления.'
                : lang === 'en'
                ? 'Sense of freedom of choice, ownership of actions, and independence from coercion.'
                : 'Відчуття свободи вибору, авторства своїх рішень та незалежності від зовнішнього тиску.'}
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={autonomy}
              onChange={(e) => setAutonomy(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Competence */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-emerald-400">
                {lang === 'ru'
                  ? 'Компетентность (Competence)'
                  : lang === 'en'
                  ? 'Competence'
                  : 'Компетентність (Competence)'}
              </span>
              <span className="text-base font-bold text-white px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700">
                {competence}/10
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ru'
                ? 'Уверенность в собственных навыках, чувство мастерства и способность достигать желаемого.'
                : lang === 'en'
                ? 'Confidence in skills, sense of mastery, and ability to achieve desired outcomes.'
                : 'Впевненість у власних навичках, відчуття майстерності та здатність досягати бажаного результату.'}
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={competence}
              onChange={(e) => setCompetence(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Relatedness */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-rose-400">
                {lang === 'ru'
                  ? 'Связанность и близость (Relatedness)'
                  : lang === 'en'
                  ? 'Relatedness'
                  : 'Спорідненість (Relatedness)'}
              </span>
              <span className="text-base font-bold text-white px-2 py-0.5 rounded bg-rose-950/80 border border-rose-700">
                {relatedness}/10
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'ru'
                ? 'Чувство глубокой связи с близкими, принадлежности к сообществу и взаимной заботы.'
                : lang === 'en'
                ? 'Sense of belonging, deep connection with significant others, and mutual care.'
                : 'Відчуття глибокого звʼязку з близькими, приналежності до спільноти та взаємної турботи.'}
            </p>
            <input
              type="range"
              min="1"
              max="10"
              value={relatedness}
              onChange={(e) => setRelatedness(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Part 2: Schwartz 10 Core Values Assessment */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          {lang === 'ru'
            ? '2. Карта 10 базовых ценностей (Шалом Шварц)'
            : lang === 'en'
            ? '2. Map of 10 Core Values (Shalom Schwartz)'
            : '2. Карта 10 базових цінностей (Шалом Шварц)'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCHWARTZ_VALUES_CATALOG.map((val) => {
            const score = valueScores[val.id] || 5;
            const Icon = val.icon;
            return (
              <div
                key={val.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-teal-500/40 transition-colors space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${val.color} text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-slate-200">
                        {lang === 'ru' ? val.nameRu : lang === 'en' ? val.nameEn : val.nameUk}
                      </span>
                      <span className="block text-[11px] text-teal-400/80">{val.categoryUk}</span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    {score} / 10
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'ru' ? val.descriptionRu : lang === 'en' ? val.descriptionEn : val.descriptionUk}
                </p>

                <input
                  type="range"
                  min="1"
                  max="10"
                  value={score}
                  onChange={(e) => handleValueChange(val.id, Number(e.target.value))}
                  className="w-full accent-teal-500 cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        {/* Optional Situation context */}
        <div className="pt-2 space-y-2">
          <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
            <span>
              {lang === 'ru'
                ? 'Опишите текущий жизненный контекст или развилку решений (по желанию):'
                : lang === 'en'
                ? 'Describe your life context or dilemma (optional):'
                : 'Опишіть поточний життєвий контекст або розвилку рішень (за бажанням):'}
            </span>
            <VoiceInputButton
              onTranscript={(text) => setUserSituation((prev) => (prev ? `${prev} ${text}` : text))}
              className="p-1"
            />
          </label>
          <textarea
            value={userSituation}
            onChange={(e) => setUserSituation(e.target.value)}
            placeholder={
              lang === 'ru'
                ? 'Например: Чувствую, что разрываюсь между стабильной работой и желанием начать свой рискованный творческий проект...'
                : lang === 'en'
                ? 'E.g.: Torn between stable corporate career and pursuing a creative endeavor...'
                : 'Наприклад: Відчуваю, що розриваюся між стабільною роботою та бажанням почати свій ризикований творчий проект...'
            }
            rows={2}
            className="w-full text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Analyze AI Button */}
        <button
          onClick={handleRunAiAnalysis}
          disabled={analyzingAi}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 hover:from-teal-500 hover:to-purple-500 text-white font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
                  ? 'Провести глубинный аудит мотивации и ценностных конфликтов'
                  : lang === 'en'
                  ? 'Run Deep Audit on Motivation & Value Alignment'
                  : 'Провести глибинний аудит мотивації та ціннісних конфліктів'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 border border-teal-800/50 rounded-2xl p-6 shadow-2xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs uppercase font-bold text-teal-400 tracking-wider">
                {lang === 'ru'
                  ? 'Результаты аудита мотивации'
                  : lang === 'en'
                  ? 'Motivation Audit Synthesis'
                  : 'Результати аудиту мотивації'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                {profile.aiAnalysis?.dominantNeedDiagnosis}
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

          {/* Top 4 Core Values */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase">
              {lang === 'ru'
                ? 'Ваши 4 ведущие жизненные ценности:'
                : lang === 'en'
                ? 'Your Top 4 Core Life Values:'
                : 'Ваші 4 провідні життєві цінності:'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {profile.topValues.map((val, idx) => (
                <div key={val.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-teal-500/30 space-y-1">
                  <span className="text-[11px] font-bold text-teal-400">
                    {lang === 'ru' ? `#${idx + 1} Ценность` : lang === 'en' ? `#${idx + 1} Value` : `#${idx + 1} Цінність`}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {lang === 'ru' ? val.nameRu : lang === 'en' ? val.nameEn : val.nameUk}
                  </h4>
                  <span className="text-xs text-slate-400">
                    {lang === 'ru' ? `Важность: ${val.score}/10` : lang === 'en' ? `Score: ${val.score}/10` : `Рівень важливості: ${val.score}/10`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          {profile.aiAnalysis && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-amber-400 uppercase mb-2">
                    {lang === 'ru'
                      ? 'Анализ скрытых ценностных конфликтов'
                      : lang === 'en'
                      ? 'Hidden Value Conflicts & Tensions'
                      : 'Аналіз прихованих ціннісних конфліктів'}
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{profile.aiAnalysis.valueConflictAnalysis}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-sky-400 uppercase mb-2">
                    {lang === 'ru'
                      ? 'Баланс внутренней и внешней мотивации'
                      : lang === 'en'
                      ? 'Intrinsic vs. Extrinsic Motivation Balance'
                      : 'Баланс внутрішньої та зовнішньої мотивації'}
                  </h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{profile.aiAnalysis.intrinsicVsExtrinsicBalance}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/40">
                <h5 className="text-xs font-bold text-teal-300 uppercase mb-2">
                  {lang === 'ru'
                    ? 'Стратегия согласования действий с ценностями'
                    : lang === 'en'
                    ? 'Strategic Action-Value Alignment'
                    : 'Стратегія узгодження дій з цінностями'}
                </h5>
                <p className="text-xs text-teal-100 leading-relaxed">{profile.aiAnalysis.alignmentStrategy}</p>
              </div>

              {profile.aiAnalysis.weeklyValuesHabits?.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <h5 className="text-xs font-bold text-emerald-400 uppercase mb-3">
                    {lang === 'ru'
                      ? 'Еженедельные микро-привычки для подпитки ценностей:'
                      : lang === 'en'
                      ? 'Weekly Micro-Habits for Value Nourishment:'
                      : 'Щотижневі мікро-звички для живлення цінностей:'}
                  </h5>
                  <div className="space-y-2">
                    {profile.aiAnalysis.weeklyValuesHabits.map((habit, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{habit}</span>
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

export default ValuesMotivationDiagnostic;
