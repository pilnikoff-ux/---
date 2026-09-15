import React, { useState, useEffect } from 'react';
import { X, Wind, Eye, Hand, Volume2, Sparkles, Activity, CheckCircle } from 'lucide-react';

interface SomaticGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SomaticGroundingModal: React.FC<SomaticGroundingModalProps> = ({ isOpen, onClose }) => {
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
      title: '5 Речей, які ти бачиш навколо',
      description: 'Повільно обведи поглядом кімнату. Знайди 5 конкретних предметів: колір чашки, тінь на стіні, текстуру столу...',
      icon: Eye,
      color: 'text-sky-400',
    },
    {
      title: '4 Відчуття дотику',
      description: 'Відчуй 4 фізичні речі: вагу стоп на підлозі, дотик одягу до плечей, тепло долонь, прохолоду повітря...',
      icon: Hand,
      color: 'text-teal-400',
    },
    {
      title: '3 Звуки, які ти чуєш',
      description: 'Прислухайся до фону: шум вентилятора, відлуння за вікном, власне тихе дихання...',
      icon: Volume2,
      color: 'text-amber-400',
    },
    {
      title: '2 Запахи навколо',
      description: 'Відчуй аромат кави, свіжого повітря з вікна чи тканини...',
      icon: Sparkles,
      color: 'text-purple-400',
    },
    {
      title: '1 Смак у роті або ковток води',
      description: 'Зверни увагу на післясмак або зроби один усвідомлений ковток води.',
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
              <h2 className="text-base font-semibold text-stone-100">SOS Соматичне Заземлення та Спокій</h2>
              <p className="text-xs text-stone-400">Швидка фізіологічна стабілізація блукаючого нерва</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/50 px-6">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'breathing'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Дихальний Ритм
          </button>
          <button
            onClick={() => setActiveTab('sensory')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'sensory'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Техніка 5-4-3-2-1
          </button>
          <button
            onClick={() => setActiveTab('linetsky')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'linetsky'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Згода з «Як Є» (О. Линецький)
          </button>
          <button
            onClick={() => setActiveTab('body_scan')}
            className={`border-b-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === 'body_scan'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Скидання М’язового Панцира
          </button>
        </div>

        {/* Tab 1: Breathing */}
        {activeTab === 'breathing' && (
          <div className="p-6 text-center space-y-6">
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setBreathTechnique('relax478')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  breathTechnique === 'relax478'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                4-7-8 (Глибокий релакс)
              </button>
              <button
                onClick={() => setBreathTechnique('box')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  breathTechnique === 'box'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                Квадрат 4-4-4-4 (Фокус)
              </button>
              <button
                onClick={() => setBreathTechnique('calm')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  breathTechnique === 'calm'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                4-6 (М’яке заспокоєння)
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
                    {breathPhase === 'inhale' && 'Вдих через ніс'}
                    {breathPhase === 'hold' && 'Затримка'}
                    {breathPhase === 'exhale' && 'Повільний видих'}
                    {breathPhase === 'pause' && 'Пауза'}
                  </div>
                  <div className="text-xs text-stone-400 mt-1">{breathSeconds} сек</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-400 max-w-md mx-auto">
              Подовжений видих активує парасимпатичну нервову систему через блукаючий нерв, знижуючи пульс і рівень кортизолу за 90 секунд.
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
                    className={`flex flex-col items-center gap-1 text-xs transition-all ${
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
                          ? 'border-teal-400 bg-teal-500/20'
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
                    className="rounded-lg border border-stone-700 px-4 py-2 text-xs font-medium text-stone-300 hover:bg-stone-800"
                  >
                    Назад
                  </button>
                )}
                {sensoryStep < sensorySteps.length - 1 ? (
                  <button
                    onClick={() => setSensoryStep((prev) => prev + 1)}
                    className="rounded-lg bg-teal-600 px-5 py-2 text-xs font-semibold text-stone-950 hover:bg-teal-500"
                  >
                    Я зафіксував це → Наступний крок
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSensoryStep(0);
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-stone-950 hover:bg-emerald-500"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Завершити заземлення (Почуваюся краще)
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
                Природний підхід Олега Линецького
              </span>
              <h3 className="text-base font-semibold text-amber-100">
                «Зняття вторинної напруги: Визнання факту без опору»
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                Коли трапляється стрес або сумнів, наш розум моментально породжує опір: <em>«Цього не повинно було статися! Я не повинен так боятися!»</em>. Ця боротьба з реальністю спалює 90% наших сил.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex gap-3 rounded-lg border border-stone-800 bg-stone-950/60 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">1</span>
                <div>
                  <strong className="text-stone-100 block mb-1">Поміть внутрішнє «Ні!» реальності</strong>
                  <span>У чому саме ти зараз намагаєшся сперечатися з тим, що ВЖЕ сталося або вже відчувається?</span>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-stone-800 bg-stone-950/60 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">2</span>
                <div>
                  <strong className="text-stone-100 block mb-1">Дай дозвіл емоції побути в тілі</strong>
                  <span>Не намагайся «терміново стати спокійним». Скажи собі: <em>«Я бачу цю тривогу. Вона має право зараз протікати крізь мене»</em>.</span>
                </div>
              </div>

              <div className="flex gap-3 rounded-lg border border-stone-800 bg-stone-950/60 p-3.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 font-bold">3</span>
                <div>
                  <strong className="text-stone-100 block mb-1">Дія з чистого покою</strong>
                  <span>Коли опір припиняється, розум стає кришталево ясним, і правильне рішення приходить природно.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Body Scan */}
        {activeTab === 'body_scan' && (
          <div className="p-6 space-y-4">
            <p className="text-xs text-stone-400">
              Послідовно зверни увагу на 5 головних зон накопичення стресу за Вільгельмом Райхом та Олександром Лоуеном:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">1. Щелепа та язик</div>
                <div className="text-stone-400">Розтули зуби, дозволь нижній щелепі опуститися. Розслаб корінь язика.</div>
              </div>
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">2. Плечі та трапеції</div>
                <div className="text-stone-400">Підніми плечі до вух на вдиху, стисни на 3 секунди — і різко кинь униз на видиху.</div>
              </div>
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">3. Сонячне сплетіння & Діафрагма</div>
                <div className="text-stone-400">Поклади теплу долоню на центр живота, зроби вдих «у живіт», надуваючи його як кульку.</div>
              </div>
              <div className="rounded-lg border border-stone-800 bg-stone-950/60 p-3">
                <div className="font-semibold text-teal-300 mb-1">4. Стопи та таз</div>
                <div className="text-stone-400">Відчуй гравітацію. Дозволь вазі всього тіла повністю стекти в крісло або підлогу.</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-stone-800 bg-stone-950/50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-medium text-stone-200 hover:bg-stone-700 transition-colors"
          >
            Закрити панель
          </button>
        </div>
      </div>
    </div>
  );
};
