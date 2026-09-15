import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Star,
  Sparkles,
  Send,
  CheckCircle,
  ThumbsUp,
  AlertCircle,
  Cpu,
  RefreshCw,
  Sliders,
  Award,
  Zap,
  TrendingUp,
  Smile,
  Shield,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  saveUserFeedback,
  getUserFeedbacks,
  getSelfLearningSettings,
  updateSelfLearningSettings,
  logUserActivity,
} from '../services/userStatsService';
import { requestSelfLearningAdaptation } from '../services/geminiService';
import { UserFeedback, SelfLearningSettings } from '../types';
import { VoiceInputButton } from './VoiceInputButton';

const ASPECT_OPTIONS_UA = [
  'Точність аналізу ШІ',
  'Зручність інтерфейсу',
  'Глибина психологічних підходів',
  'Швидкість роботи',
  'Практичність порад',
  'Робота голосового введення',
  'Підтримка та емпатія',
];

const ASPECT_OPTIONS_RU = [
  'Точность анализа ИИ',
  'Удобство интерфейса',
  'Глубина психологических подходов',
  'Скорость работы',
  'Практичность рекомендаций',
  'Работа голосового ввода',
  'Поддержка и эмпатия',
];

const ASPECT_OPTIONS_EN = [
  'AI Analysis Accuracy',
  'Interface Usability',
  'Depth of Psychological Frameworks',
  'Processing Speed',
  'Actionable Practical Steps',
  'Voice Input Reliability',
  'Empathy & Supportive Tone',
];

const DIFFICULTY_OPTIONS_UA = [
  'Забагато тексту у відповідях',
  'Складні терміни',
  'Незручно з телефону',
  'Хотілося б більше конкретних кроків',
  'Технічні затримки',
];

const DIFFICULTY_OPTIONS_RU = [
  'Слишком много текста в ответах',
  'Сложные термины',
  'Неудобно с телефона',
  'Хотелось бы больше конкретных шагов',
  'Технические задержки',
];

const DIFFICULTY_OPTIONS_EN = [
  'Too much text in responses',
  'Complex terminology',
  'Hard to use on mobile',
  'Need more concrete steps',
  'Technical delays',
];

export const FeedbackSystem: React.FC = () => {
  const { lang, t } = useThemeLanguage();

  const aspectOptions = lang === 'ru' ? ASPECT_OPTIONS_RU : lang === 'en' ? ASPECT_OPTIONS_EN : ASPECT_OPTIONS_UA;
  const difficultyOptions = lang === 'ru' ? DIFFICULTY_OPTIONS_RU : lang === 'en' ? DIFFICULTY_OPTIONS_EN : DIFFICULTY_OPTIONS_UA;

  const [rating, setRating] = useState<number>(5);
  const [likedAspects, setLikedAspects] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [featureSuggestions, setFeatureSuggestions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [learningSettings, setLearningSettings] = useState<SelfLearningSettings>(getSelfLearningSettings());
  const [adaptingAi, setAdaptingAi] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = getUserFeedbacks();
    setFeedbacks(list);
    setLearningSettings(getSelfLearningSettings());
  };

  const toggleAspect = (item: string) => {
    setLikedAspects((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleDifficulty = (item: string) => {
    setDifficulties((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && likedAspects.length === 0 && difficulties.length === 0) return;

    setSubmitting(true);
    const newFeedback: UserFeedback = {
      id: `fb_${Date.now()}`,
      date: new Date().toISOString(),
      rating,
      likedAspects,
      difficulties,
      comment: comment.trim(),
      featureSuggestions: featureSuggestions.trim(),
    };

    saveUserFeedback(newFeedback);

    logUserActivity({
      tab: 'feedback',
      toolName: 'Зворотній звʼязок та самонавчання',
      querySummary: `Оцінка: ${rating} зірок. Коментар: ${comment.slice(0, 60)}`,
      category: 'Feedback',
    });

    setSubmittedSuccess(true);
    setComment('');
    setFeatureSuggestions('');
    setLikedAspects([]);
    setDifficulties([]);
    loadData();

    // Trigger self-learning AI calibration in background
    setTimeout(async () => {
      try {
        setAdaptingAi(true);
        const adaptation = await requestSelfLearningAdaptation({
          feedbacks: getUserFeedbacks(),
          currentSettings: getSelfLearningSettings(),
        });
        updateSelfLearningSettings(adaptation);
        setLearningSettings(getSelfLearningSettings());
      } catch (err) {
        console.error('Self-learning adaptation err', err);
      } finally {
        setAdaptingAi(false);
        setSubmitting(false);
      }
    }, 800);
  };

  const handleManualAdapt = async () => {
    setAdaptingAi(true);
    try {
      const adaptation = await requestSelfLearningAdaptation({
        feedbacks: getUserFeedbacks(),
        currentSettings: getSelfLearningSettings(),
      });
      updateSelfLearningSettings(adaptation);
      setLearningSettings(getSelfLearningSettings());
    } catch (err) {
      console.error(err);
    } finally {
      setAdaptingAi(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-2 sm:px-4 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/70 via-indigo-950/70 to-slate-900 border border-blue-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {lang === 'ru'
                  ? 'Обратная связь & Самообучаемый Навигатор'
                  : lang === 'en'
                  ? 'Feedback & Self-Learning Engine'
                  : 'Зворотній звʼязок & Самонавчальний Навігатор'}
              </h1>
              <p className="text-blue-200/80 text-sm mt-1">
                {lang === 'ru'
                  ? 'Ваши отзывы напрямую обучают ИИ: система адаптирует тон, глубину анализа и фокус коучинга'
                  : 'Ваші відгуки безпосередньо навчають ШІ: система адаптує тон, глибину аналізу та фокус коучингу'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-950/80 border border-indigo-700/60 px-3 py-1.5 rounded-xl text-xs text-indigo-200">
            <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>
              {lang === 'ru'
                ? `Самообучение: ${learningSettings.feedbackCount} отзывов интегрировано`
                : lang === 'en'
                ? `Self-Learning: ${learningSettings.feedbackCount} feedbacks integrated`
                : `Самонавчання: ${learningSettings.feedbackCount} відгуків інтегровано`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Feedback Submission Form */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              {lang === 'ru'
                ? 'Оставить отзыв или предложение'
                : lang === 'en'
                ? 'Leave Feedback or Suggestions'
                : 'Залишити відгук чи пропозицію'}
            </h2>

            {/* Star Rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {lang === 'ru'
                  ? 'Общая оценка работы Навигатора:'
                  : lang === 'en'
                  ? 'Overall Navigator Rating:'
                  : 'Загальна оцінка роботи Навігатора:'}
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-300 ml-2">
                  {rating === 5
                    ? lang === 'ru'
                      ? '⭐️⭐️⭐️⭐️⭐️ Безупречно'
                      : lang === 'en'
                      ? '⭐️⭐️⭐️⭐️⭐️ Flawless'
                      : '⭐️⭐️⭐️⭐️⭐️ Бездоганно'
                    : rating === 4
                    ? lang === 'ru'
                      ? '⭐️⭐️⭐️⭐️ Хорошо'
                      : lang === 'en'
                      ? '⭐️⭐️⭐️⭐️ Good'
                      : '⭐️⭐️⭐️⭐️ Добре'
                    : rating === 3
                    ? lang === 'ru'
                      ? '⭐️⭐️⭐️ Нормально'
                      : lang === 'en'
                      ? '⭐️⭐️⭐️ Neutral'
                      : '⭐️⭐️⭐️ Нормально'
                    : lang === 'ru'
                    ? 'Требуются улучшения'
                    : lang === 'en'
                    ? 'Needs improvement'
                    : 'Потрібні покращення'}
                </span>
              </div>
            </div>

            {/* Liked Aspects Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                {lang === 'ru'
                  ? 'Что вам больше всего понравилось?'
                  : lang === 'en'
                  ? 'What did you like most?'
                  : 'Що вам найбільше сподобалося?'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {aspectOptions.map((item) => {
                  const active = likedAspects.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleAspect(item)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulties Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {lang === 'ru'
                  ? 'Что вызвало трудности или стоит улучшить?'
                  : lang === 'en'
                  ? 'Any friction points or room for improvement?'
                  : 'Що викликало труднощі або варто покращити?'}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {difficultyOptions.map((item) => {
                  const active = difficulties.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleDifficulty(item)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  {lang === 'ru'
                    ? 'Ваш подробный комментарий:'
                    : lang === 'en'
                    ? 'Your Detailed Feedback:'
                    : 'Ваш детальний коментар:'}
                </label>
                <VoiceInputButton
                  onTranscript={(text) => setComment((prev) => (prev ? `${prev} ${text}` : text))}
                  className="p-1"
                />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Напишите ваши впечатления, что помогло, а что показалось лишним...'
                    : lang === 'en'
                    ? 'Write your observations, what helped most, or what felt redundant...'
                    : 'Напишіть ваші враження, що допомогло, а що здалося зайвим...'
                }
                rows={3}
                className="w-full text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl p-3 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Feature Suggestions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                {lang === 'ru'
                  ? 'Какие функции или темы добавить в Навигатор?'
                  : lang === 'en'
                  ? 'What features or topics would you like added?'
                  : 'Які функції чи теми додати в Навігатор?'}
              </label>
              <input
                type="text"
                value={featureSuggestions}
                onChange={(e) => setFeatureSuggestions(e.target.value)}
                placeholder={
                  lang === 'ru'
                    ? 'Например: Больше телесных практик, анализ сновидений...'
                    : lang === 'en'
                    ? 'E.g.: More somatic practices, dream analysis...'
                    : 'Наприклад: Більше тілесних практик, аналіз сновидінь...'
                }
                className="w-full text-xs bg-slate-950/80 border border-slate-700/80 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>
                    {lang === 'ru'
                      ? 'Интеграция отзыва в ИИ...'
                      : lang === 'en'
                      ? 'Integrating Feedback into AI...'
                      : 'Інтеграція відгуку в ШІ...'}
                  </span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>
                    {lang === 'ru'
                      ? 'Отправить отзыв и обновить ИИ'
                      : lang === 'en'
                      ? 'Send Feedback & Calibrate AI'
                      : 'Надіслати відгук та оновити ШІ'}
                  </span>
                </>
              )}
            </button>

            {submittedSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {lang === 'ru'
                    ? 'Спасибо! Ваш отзыв успешно сохранен и передан в модуль самообучения Навигатора.'
                    : lang === 'en'
                    ? 'Thank you! Your feedback has been saved and transferred to the self-learning model.'
                    : 'Дякуємо! Ваш відгук успішно збережено та передано в модуль самонавчання Навігатора.'}
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Real-time Self-Learning Engine Status */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/90 border border-indigo-900/50 rounded-2xl p-6 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-indigo-400" />
                {lang === 'ru'
                  ? 'Модуль самообучения ИИ'
                  : lang === 'en'
                  ? 'AI Self-Learning Engine'
                  : 'Модуль самонавчання ШІ'}
              </h3>
              <button
                onClick={handleManualAdapt}
                disabled={adaptingAi}
                className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 transition-colors cursor-pointer"
                title={lang === 'ru' ? 'Обновить обучение' : lang === 'en' ? 'Refresh calibration' : 'Оновити навчання'}
              >
                <RefreshCw className={`w-4 h-4 ${adaptingAi ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Evolution Summary */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-800/40 space-y-2">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                {lang === 'ru'
                  ? 'Текущий вектор развития системы:'
                  : lang === 'en'
                  ? 'Current system evolution vector:'
                  : 'Поточний вектор розвитку системи:'}
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {learningSettings.coachingFocusEvolution}
              </p>
            </div>

            {/* Learned Tone Adjustments */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">
                {lang === 'ru'
                  ? 'Усвоенные настройки тона ответа:'
                  : lang === 'en'
                  ? 'Learned response tone adjustments:'
                  : 'Засвоєні налаштування тону відповіді:'}
              </span>
              <div className="space-y-1.5">
                {learningSettings.learnedToneAdjustments?.map((tone, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{tone}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Directives */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase">
                {lang === 'ru'
                  ? 'Активные системные директивы коучинга:'
                  : lang === 'en'
                  ? 'Active coaching system directives:'
                  : 'Активні системні директиви коучингу:'}
              </span>
              <div className="space-y-1.5">
                {learningSettings.updatedPromptDirectives?.map((dir, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{dir}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent feedback list */}
            {feedbacks.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase">
                  {lang === 'ru'
                    ? `Последние отзывы (${feedbacks.length}):`
                    : lang === 'en'
                    ? `Recent feedbacks (${feedbacks.length}):`
                    : `Останні збережені відгуки (${feedbacks.length}):`}
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {feedbacks.slice(-3).reverse().map((fb) => (
                    <div key={fb.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400 font-bold">{'★'.repeat(fb.rating)}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(fb.date).toLocaleDateString()}
                        </span>
                      </div>
                      {fb.comment && <p className="text-slate-300">{fb.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSystem;
