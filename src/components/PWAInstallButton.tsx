import React, { useState } from 'react';
import { Download, Smartphone, X, Share, PlusSquare, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { lang } = useThemeLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  // If already running as an installed standalone PWA, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowAndroidGuide(true);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowAndroidGuide(true);
    }
  };

  const label =
    lang === 'ru'
      ? 'Установить как приложение'
      : lang === 'en'
      ? 'Install as App'
      : 'Встановити як додаток';

  const shortLabel =
    lang === 'ru'
      ? 'Приложение'
      : lang === 'en'
      ? 'Install App'
      : 'Встановити додаток';

  return (
    <>
      {variant === 'banner' ? (
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-teal-500/30 bg-teal-950/30 text-teal-200 ${className}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                {lang === 'ru'
                  ? 'Установите Навигатор на свой телефон'
                  : lang === 'en'
                  ? 'Install Navigator on your phone'
                  : 'Встановіть Навігатор на свій телефон'}
              </h4>
              <p className="text-[11px] text-stone-300">
                {lang === 'ru'
                  ? 'Работает без интернета, открывается в полноэкранном режиме как мобильное приложение'
                  : lang === 'en'
                  ? 'Works offline and opens in full screen as a native mobile application'
                  : 'Працює без інтернету, відкривається на весь екран як мобільний застосунок'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>{label}</span>
          </button>
        </div>
      ) : variant === 'button' ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-stone-950 px-3.5 py-2 text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Smartphone className="w-4 h-4" />
          <span>{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleInstallClick}
          title={label}
          className={`flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer active:scale-95 shrink-0 ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-500" />
          <span className="hidden md:inline">{shortLabel}</span>
        </button>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-teal-400">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">
                  {lang === 'ru' ? 'Установка на iPhone / iPad' : lang === 'en' ? 'Install on iPhone / iPad' : 'Встановлення на iPhone / iPad'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300 leading-relaxed">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-stone-100">
                    {lang === 'ru' ? 'Шаг 1:' : lang === 'en' ? 'Step 1:' : 'Крок 1:'}
                  </span>{' '}
                  {lang === 'ru'
                    ? 'В браузере Safari нажмите кнопку «Поделиться» (иконка квадрата со стрелкой вверх внизу экрана).'
                    : lang === 'en'
                    ? 'In Safari browser, tap the Share button (square with arrow pointing up at the bottom).'
                    : 'У браузері Safari натисніть кнопку «Поділитися» (іконка квадрата зі стрілкою вгору внизу екрана).'}
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-stone-100">
                    {lang === 'ru' ? 'Шаг 2:' : lang === 'en' ? 'Step 2:' : 'Крок 2:'}
                  </span>{' '}
                  {lang === 'ru'
                    ? 'Прокрутите меню вниз и выберите «На экран „Домой“» (Add to Home Screen).'
                    : lang === 'en'
                    ? 'Scroll down the action sheet and select "Add to Home Screen".'
                    : 'Прокрутіть меню вниз та оберіть «На екран „Додому“» (Add to Home Screen).'}
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-950/60 border border-stone-800">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-stone-100">
                    {lang === 'ru' ? 'Шаг 3:' : lang === 'en' ? 'Step 3:' : 'Крок 3:'}
                  </span>{' '}
                  {lang === 'ru'
                    ? 'Нажмите «Добавить» в правом верхнем углу. Навигатор появится среди ваших приложений!'
                    : lang === 'en'
                    ? 'Tap "Add" in the top right. Navigator is now installed on your home screen!'
                    : 'Натисніть «Додати» у правому верхньому кутку. Навігатор зʼявиться серед ваших додатків!'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs cursor-pointer transition-all"
            >
              {lang === 'ru' ? 'Понятно' : lang === 'en' ? 'Got it' : 'Зрозуміло'}
            </button>
          </div>
        </div>
      )}

      {/* Android / Desktop Installation Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-900 p-5 shadow-2xl text-stone-100 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-teal-400">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">
                  {lang === 'ru' ? 'Установка приложения' : lang === 'en' ? 'Install Application' : 'Встановлення застосунку'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-300 leading-relaxed">
              <p>
                {lang === 'ru'
                  ? 'В браузере Chrome / Edge нажмите меню (три точки в правом верхнем углу) и выберите «Установить приложение» или «Добавить на главный экран».'
                  : lang === 'en'
                  ? 'In Chrome / Edge, open the browser menu (three dots in the upper right) and tap "Install app" or "Add to Home screen".'
                  : 'У браузері Chrome / Edge відкрийте меню (три крапки у верхньому правому кутку) та оберіть «Встановити додаток» або «Додати на головний екран».'}
              </p>
              <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-300 text-[11px]">
                ✨ {lang === 'ru'
                  ? 'Приложение будет запускаться автономно без рамок браузера.'
                  : lang === 'en'
                  ? 'The app will launch independently without browser UI.'
                  : 'Застосунок запускатиметься автономно без рамок браузера.'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs cursor-pointer transition-all"
            >
              {lang === 'ru' ? 'Понятно' : lang === 'en' ? 'Got it' : 'Зрозуміло'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
