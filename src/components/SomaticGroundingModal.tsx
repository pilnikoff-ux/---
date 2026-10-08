import React, { useState, useEffect } from 'react';
import { X, Wind, Eye, Hand, Volume2, Sparkles, Activity, CheckCircle } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface SomaticGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SomaticGroundingModal: React.FC<SomaticGroundingModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useThemeLanguage();
  const [activeTab, setActiveTab] = useState<'breathing' | 'sensory' | 'linetsky' | 'body_scan'>('breathing');

  // Breathing state
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);
  const [breathTechnique, setBreathTechnique] = useState<'box' | 'relax478' | 'calm'>('relax478');
  const [isBreathingActive, setIsBreathingActive] = useState(true);

  // 5-4-3-2-1 Sensory state
  const [sensoryStep, setSensoryStep] = useState(0);

  // Breathing animation cycle
  useEffect(() => {
    if (!isOpen || !isBreathingActive || activeTab !== 'breathing') return;

    let timer: NodeJS.Timeout;
    const runCycle = () => {
      if (breathTechnique === 'relax478') {
        // 4s Inhale -> 7s Hold -> 8s Exhale
        setBreathPhase('inhale');
        setBreathSeconds(4);
        timer = setTimeout(() => {
          setBreathPhase('hold');
          setBreathSeconds(7);
          timer = setTimeout(() => {
            setBreathPhase('exhale');
            setBreathSeconds(8);
            timer = setTimeout(runCycle, 8000);
          }, 7000);
        }, 4000);
      } else if (breathTechnique === 'box') {
        // 4s Inhale -> 4s Hold -> 4s Exhale -> 4s Pause
        setBreathPhase('inhale');
        setBreathSeconds(4);
        timer = setTimeout(() => {
          setBreathPhase('hold');
          setBreathSeconds(4);
          timer = setTimeout(() => {
            setBreathPhase('exhale');
            setBreathSeconds(4);
            timer = setTimeout(() => {
              setBreathPhase('pause');
              setBreathSeconds(4);
              timer = setTimeout(runCycle, 4000);
            }, 4000);
          }, 4000);
        }, 4000);
      } else {
        // Calm: 4s Inhale -> 6s Exhale
        setBreathPhase('inhale');
        setBreathSeconds(4);
        timer = setTimeout(() => {
          setBreathPhase('exhale');
          setBreathSeconds(6);
          timer = setTimeout(runCycle, 6000);
        }, 4000);
      }
    };

    runCycle();
    return () => clearTimeout(timer);
  }, [isOpen, isBreathingActive, breathTechnique, activeTab]);

  if (!isOpen) return null;

  const sensorySteps = [
    {
      title:
        lang === 'en'
          ? '5 Things You Can See Around You'
          : lang === 'ru'
          ? '5 Вещей, которые вы видите вокруг'
          : '5 Речей, які ти бачиш навколо',
      description:
        lang === 'en'
          ? 'Slowly glance around the room. Spot 5 specific items: cup color, wall shadow, desk texture...'
          : lang === 'ru'
          ? 'Медленно оглядите комнату. Найдите 5 конкретных предметов: цвет кружки, тень на стене, текстуру стола...'
          : 'Повільно обведи поглядом кімнату. Знайди 5 конкретних предметів: колір чашки, тінь на стіні, текстуру столу...',
      icon: Eye,
      color: 'text-sky-400',
    },
    {
      title:
        lang === 'en'
          ? '4 Physical Touch Sensations'
          : lang === 'ru'
          ? '4 Ощущения прикосновения'
          : '4 Відчуття дотику',
      description:
        lang === 'en'
          ? 'Notice 4 physical sensations: feet weight on the floor, clothes touching shoulders, warmth of hands, coolness of air...'
          : lang === 'ru'
          ? 'Почувствуйте 4 физические вещи: вес стоп на полу, касание одежды к плечам, тепло ладоней, прохладу воздуха...'
          : 'Відчуй 4 фізичні речі: вагу стоп на підлозі, дотик одягу до плечей, тепло долонь, прохолоду повітря...',
      icon: Hand,
      color: 'text-teal-400',
    },
    {
      title:
        lang === 'en'
          ? '3 Sounds You Can Hear'
          : lang === 'ru'
          ? '3 Звука, которые вы слышите'
          : '3 Звуки, які ти чуєш',
      description:
        lang === 'en'
          ? 'Listen to the background: fan hum, distant street noise, your own gentle breathing...'
          : lang === 'ru'
          ? 'Прислушайтесь к фону: шум вентилятора, эхо за окном, собственное тихое дыхание...'
          : 'Прислухайся до фону: шум вентилятора, відлуння за вікном, власне тихе дихання...',
      icon: Volume2,
      color: 'text-amber-400',
    },
    {
      title:
        lang === 'en'
          ? '2 Scents in the Air'
          : lang === 'ru'
          ? '2 Запаха вокруг'
          : '2 Запахи навколо',
      description:
        lang === 'en'
          ? 'Notice coffee aroma, fresh air from a window, fabric, or hand cream...'
          : lang === 'ru'
          ? 'Уловите аромат кофе, свежего воздуха из окна или ткани...'
          : 'Відчуй аромат кави, свіжого повітря з вікна чи тканини...',
      icon: Sparkles,
      color: 'text-purple-400',
    },
    {
      title:
        lang === 'en'
          ? '1 Taste or Mindful Sip of Water'
          : lang === 'ru'
          ? '1 Вкус во рту или глоток воды'
          : '1 Смак у роті або ковток води',
      description:
        lang === 'en'
          ? 'Notice any remaining aftertaste or take one slow, mindful sip of water.'
          : lang === 'ru'
          ? 'Обратите внимание на послевкусие или сделайте один осознанный глоток воды.'
          : 'Зверни увагу на післясмак або зроби один усвідомлений ковток води.',
      icon: Activity,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-stone-800 bg-stone-900 text-stone-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100">
                {lang === 'en'
                  ? 'SOS Somatic Grounding & Serenity'
                  : lang === 'ru'
                  ? 'SOS Соматическое Заземление и Покой'
                  : 'SOS Соматичне Заземлення та Спокій'}
              </h2>
              <p className="text-xs text-stone-400">
                {lang === 'en'
                  ? 'Rapid vagus nerve stabilization & autonomic nervous balance'
                  : lang === 'ru'
                  ? 'Быстрая физиологическая стабилизация блуждающего нерва'
                  : 'Швидка фізіологічна стабілізація блукаючого нерва'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors cursor-pointer"
            title={lang === 'en' ? 'Close' : lang === 'ru' ? 'Закрыть' : 'Закрити'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/50 px-6">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'breathing'
                ? 'border-teal-400 text-teal-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'en' ? 'Breathing Rhythm' : lang === 'ru' ? 'Дыхательный Ритм' : 'Дихальний Ритм'}
          </button>
          <button
            onClick={() => setActiveTab('sensory')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'sensory'
                ? 'border-teal-400 text-teal-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'en' ? '5-4-3-2-1 Technique' : lang === 'ru' ? 'Техника 5-4-3-2-1' : 'Техніка 5-4-3-2-1'}
          </button>
          <button
            onClick={() => setActiveTab('linetsky')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'linetsky'
                ? 'border-teal-400 text-teal-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'en' ? 'Acceptance of "As Is"' : lang === 'ru' ? 'Согласие с «Как Есть»' : 'Згода з «Як Є»'}
          </button>
          <button
            onClick={() => setActiveTab('body_scan')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'body_scan'
                ? 'border-teal-400 text-teal-400 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {lang === 'en' ? 'Muscle Armor Release' : lang === 'ru' ? 'Сброс Мышечного Панциря' : 'Скидання М’язового Панцира'}
          </button>
        </div>

        {/* Tab 1: Breathing */}
        {activeTab === 'breathing' && (
          <div className="p-6 text-center space-y-6">
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setBreathTechnique('relax478')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  breathTechnique === 'relax478'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {lang === 'en' ? '4-7-8 (Deep Relax)' : lang === 'ru' ? '4-7-8 (Глубокий релакс)' : '4-7-8 (Глибокий релакс)'}
              </button>
              <button
                onClick={() => setBreathTechnique('box')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  breathTechnique === 'box'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {lang === 'en' ? 'Box 4-4-4-4 (Focus)' : lang === 'ru' ? 'Квадрат 4-4-4-4 (Фокус)' : 'Квадрат 4-4-4-4 (Фокус)'}
              </button>
              <button
                onClick={() => setBreathTechnique('calm')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  breathTechnique === 'calm'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {lang === 'en' ? '4-6 (Gentle Calm)' : lang === 'ru' ? '4-6 (Мягкое успокоение)' : '4-6 (М’яке заспокоєння)'}
              </button>
            </div>

            {/* Visual breathing sphere */}
            <div className="flex flex-col items-center justify-center py-6">
              <div
                className={`relative flex h-48 w-48 items-center justify-center rounded-full border-2 transition-all duration-1000 ${
                  breathPhase === 'inhale'
                    ? 'scale-115 border-teal-400 bg-teal-500/15 shadow-lg shadow-teal-500/20'
                    : breathPhase === 'hold'
                    ? 'scale-115 border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/20'
                    : breathPhase === 'exhale'
                    ? 'scale-85 border-sky-400 bg-sky-500/10'
                    : 'scale-85 border-stone-600 bg-stone-800/40'
                }`}
              >
                <div className="text-center">
                  <Wind className="mx-auto mb-2 h-7 w-7 text-stone-200 animate-pulse" />
                  <div className="text-lg font-bold tracking-wider text-stone-100 uppercase">
                    {breathPhase === 'inhale' && (lang === 'en' ? 'Inhale through nose' : lang === 'ru' ? 'Вдох через нос' : 'Вдих через ніс')}
                    {breathPhase === 'hold' && (lang === 'en' ? 'Hold breath' : lang === 'ru' ? 'Задержка' : 'Затримка')}
                    {breathPhase === 'exhale' && (lang === 'en' ? 'Slow exhale' : lang === 'ru' ? 'Медленный выдох' : 'Повільний видих')}
                    {breathPhase === 'pause' && (lang === 'en' ? 'Pause' : lang === 'ru' ? 'Пауза' : 'Пауза')}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    {breathSeconds} {lang === 'en' ? 'sec' : lang === 'ru' ? 'сек' : 'сек'}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-400 max-w-md mx-auto">
              {lang === 'en'
                ? 'Prolonged exhalation activates the parasympathetic nervous system via the vagus nerve, reducing heart rate and cortisol in under 90 seconds.'
                : lang === 'ru'
                ? 'Удлиненный выдох активирует парасимпатическую нервную систему через блуждающий нерв, снижая пульс и уровень кортизола за 90 секунд.'
                : 'Подовжений видих активує парасимпатичну нервову систему через блукаючий нерв, знижуючи пульс і рівень кортизолу за 90 секунд.'}
            </p>
          </div>
        )}

        {/* Tab 2: 5-4-3-2-1 Sensory Grounding */}
        {activeTab === 'sensory' && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-stone-950/60 p-4 rounded-xl border border-stone-800">
              {sensorySteps.map((s, idx) => {
                const isCurrent = sensoryStep === idx;
                const isPassed = sensoryStep > idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSensoryStep(idx)}
                    className={`flex flex-col items-center gap-1 text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'text-teal-400 font-bold scale-105'
                        : isPassed
                        ? 'text-emerald-400'
                        : 'text-stone-500'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs ${
                        isCurrent
                          ? 'border-teal-400 bg-teal-500/20 font-bold'
                          : isPassed
                          ? 'border-emerald-500 bg-emerald-500/20'
                          : 'border-stone-700 bg-stone-800'
                      }`}
                    >
                      {isPassed ? '✓' : 5 - idx}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active sensory card */}
            <div className="rounded-xl border border-stone-800 bg-stone-950/80 p-6 text-center space-y-4">
              {React.createElement(sensorySteps[sensoryStep].icon, {
                className: `mx-auto h-12 w-12 ${sensorySteps[sensoryStep].color}`,
              })}
              <h3 className="text-lg font-semibold text-stone-100">
                {sensorySteps[sensoryStep].title}
              </h3>
              <p className="text-sm text-stone-300 leading-relaxed max-w-lg mx-auto">
                {sensorySteps[sensoryStep].description}
              </p>

              <div className="pt-4 flex justify-center gap-3">
                {sensoryStep > 0 && (
                  <button
                    onClick={() => setSensoryStep((prev) => prev - 1)}
                    className="rounded-lg border border-stone-700 px-4 py-2 text-xs font-medium text-stone-300 hover:bg-stone-800 cursor-pointer"
                  >
                    {lang === 'en' ? 'Back' : lang === 'ru' ? 'Назад' : 'Назад'}
                  </button>
                )}
                {sensoryStep < sensorySteps.length - 1 ? (
                  <button
                    onClick={() => setSensoryStep((prev) => prev + 1)}
                    className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-stone-950 hover:bg-teal-500 cursor-pointer transition-all"
                  >
                    {lang === 'en' ? 'I noticed this → Next step' : lang === 'ru' ? 'Я зафиксировал это → Следующий шаг' : 'Я зафіксував це → Наступний крок'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSensoryStep(0);
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-stone-950 hover:bg-emerald-500 cursor-pointer transition-all"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {lang === 'en' ? 'Complete Grounding (I feel better)' : lang === 'ru' ? 'Завершить заземление (Чувствую себя лучше)' : 'Завершити заземлення (Почуваюся краще)'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Linetsky Natural Flow */}
        {activeTab === 'linetsky' && (
          <div className="p-6 space-y-5 text-stone-200">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 space-y-3">
              <span className="inline-block rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                {lang === 'en'
                  ? 'Oleg Linetsky: Natural Flow Approach'
                  : lang === 'ru'
                  ? 'Естественный подход Олега Линецкого'
                  : 'Природний підхід Олега Линецького'}
              </span>
              <h3 className="text-base font-semibold text-amber-100">
                {lang === 'en'
                  ? '«Dissolving Secondary Tension: Acknowledging Fact Without Resistance»'
                  : lang === 'ru'
                  ? '«Снятие вторичного напряжения: Признание факта без сопротивления»'
                  : '«Зняття вторинної напруги: Визнання факту без опору»'}
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                {lang === 'en'
                  ? 'When distress or doubt arrives, the mind immediately creates inner friction: "This shouldn\'t be happening! I shouldn\'t feel so scared!". This war against reality drains 90% of our vital energy.'
                  : lang === 'ru'
                  ? 'Когда происходит стресс или сомнение, наш ум моментально порождает сопротивление: «Этого не должно было произойти! Я не должен так бояться!». Эта борьба с реальностью сжигает 90% наших сил.'
                  : 'Коли трапляється стрес або сумнів, наш розум моментально породжує опір: «Цього не повинно було статися! Я не повинен так боятися!». Ця боротьба з реальністю спалює 90% наших сил.'}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3 rounded-lg border border-stone-800 bg-stone-950/60 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">1</span>
                <div>
                  <strong className="text-stone-100 block mb-1">
                    {lang === 'en'
                      ? 'Notice the inner "No!" to reality'
                      : lang === 'ru'
                      ? 'Заметьте внутреннее «Нет!» реальности'
                      : 'Поміть внутрішнє «Ні!» реальності'}
                  </strong>
                  <span>
                    {lang === 'en'
                      ? 'What exactly are you arguing with right now that has ALREADY occurred or is already felt?'
                      : lang === 'ru'
                      ? 'В чем именно вы сейчас пытаетесь спорить с тем, что УЖЕ произошло или уже ощущается?'
                      : 'У чому саме ти зараз намагаєшся сперечатися з тим, що ВЖЕ сталося або вже відчувається?'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-stone-800 bg-stone-950/60 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">2</span>
                <div>
                  <strong className="text-stone-100 block mb-1">
                    {lang === 'en'
                      ? 'Give permission for the feeling to occupy the body'
                      : lang === 'ru'
                      ? 'Дайте разрешение эмоции побыть в теле'
                      : 'Дай дозвіл емоції побути в тілі'}
                  </strong>
                  <span>
                    {lang === 'en'
                      ? 'Do not rush to "urgently calm down". Say to yourself: "I see this anxiety. It has the right to flow through me right now."'
                      : lang === 'ru'
                      ? 'Не пытайтесь «срочно стать спокойным». Скажите себе: «Я вижу эту тревогу. Она имеет право сейчас протекать сквозь меня».'
                      : 'Не намагайся «терміново стати спокійним». Скажи собі: «Я бачу цю тривогу. Вона має право зараз протікати крізь мене».'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-stone-800 bg-stone-950/60 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">3</span>
                <div>
                  <strong className="text-stone-100 block mb-1">
                    {lang === 'en'
                      ? 'Action from serene presence'
                      : lang === 'ru'
                      ? 'Действие из чистого покоя'
                      : 'Дія з чистого покою'}
                  </strong>
                  <span>
                    {lang === 'en'
                      ? 'Once resistance ceases, the mind turns crystal clear, and the natural resolution surfaces effortlessly.'
                      : lang === 'ru'
                      ? 'Когда сопротивление прекращается, ум становится кристально ясным, и верное решение приходит естественно.'
                      : 'Коли опір припиняється, розум стає кришталево ясним, і правильне рішення приходить природно.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Body Scan */}
        {activeTab === 'body_scan' && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-stone-400">
              {lang === 'en'
                ? 'Sequentially observe 4 primary stress somatic zones (Wilhelm Reich & Alexander Lowen bioenergetics):'
                : lang === 'ru'
                ? 'Последовательно обратите внимание на 4 главные зоны накопления стресса (Вильгельм Райх & Александр Лоуэн):'
                : 'Послідовно зверни увагу на 4 головних зони накопичення стресу за Вільгельмом Райхом та Олександром Лоуеном:'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">
                  {lang === 'en' ? '1. Jaw & Tongue' : lang === 'ru' ? '1. Челюсть и язык' : '1. Щелепа та язик'}
                </div>
                <div className="text-stone-400">
                  {lang === 'en'
                    ? 'Unclench your teeth, let the lower jaw drop loose. Relax the root of the tongue.'
                    : lang === 'ru'
                    ? 'Разомкните зубы, позвольте нижней челюсти опуститься. Расслабьте корень языка.'
                    : 'Розтули зуби, дозволь нижній щелепі опуститися. Розслаб корінь язика.'}
                </div>
              </div>
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">
                  {lang === 'en' ? '2. Shoulders & Trapezius' : lang === 'ru' ? '2. Плечи и трапеции' : '2. Плечі та трапеції'}
                </div>
                <div className="text-stone-400">
                  {lang === 'en'
                    ? 'Raise shoulders to your ears on inhale, squeeze for 3 seconds — and drop down heavily on exhale.'
                    : lang === 'ru'
                    ? 'Поднимите плечи к ушам на вдохе, сожмите на 3 секунды — и резко сбросьте вниз на выдохе.'
                    : 'Підніми плечі до вух на вдиху, стисни на 3 секунди — і різко кинь униз на видиху.'}
                </div>
              </div>
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">
                  {lang === 'en' ? '3. Solar Plexus & Diaphragm' : lang === 'ru' ? '3. Солнечное сплетение & Диафрагма' : '3. Сонячне сплетіння & Діафрагма'}
                </div>
                <div className="text-stone-400">
                  {lang === 'en'
                    ? 'Place a warm palm on your belly center, breathe deeply "into the stomach", letting it inflate like a soft balloon.'
                    : lang === 'ru'
                    ? 'Положите теплую ладонь на центр живота, сделайте вдох «в живот», надувая его как мягкий шар.'
                    : 'Поклади теплу долоню на центр живота, зроби вдих «у живіт», надуваючи його як кульку.'}
                </div>
              </div>
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">
                  {lang === 'en' ? '4. Feet & Pelvis' : lang === 'ru' ? '4. Стопы и таз' : '4. Стопи та таз'}
                </div>
                <div className="text-stone-400">
                  {lang === 'en'
                    ? 'Feel gravity. Let the full weight of your body sink effortlessly into the chair or ground.'
                    : lang === 'ru'
                    ? 'Почувствуйте гравитацию. Позвольте весу всего тела полностью стечь в кресло или пол.'
                    : 'Відчуй гравітацію. Дозволь вазі всього тіла повністю стекти в крісло або підлогу.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-stone-800 bg-stone-950/50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-stone-200 hover:bg-stone-700 transition-colors cursor-pointer"
          >
            {lang === 'en' ? 'Close Panel' : lang === 'ru' ? 'Закрыть панель' : 'Закрити панель'}
          </button>
        </div>
      </div>
    </div>
  );
};
