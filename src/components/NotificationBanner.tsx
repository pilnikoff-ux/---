import React from 'react';
import { Bell, X, ArrowRight, Sparkles } from 'lucide-react';
import { TabType } from './Navbar';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

interface NotificationBannerProps {
  title: string;
  message: string;
  tab?: TabType;
  onOpenPractice?: (tab: TabType) => void;
  onClose: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  title,
  message,
  tab = 'consilium',
  onOpenPractice,
  onClose,
}) => {
  const { lang } = useThemeLanguage();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] rounded-2xl border border-teal-500/40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
          <Bell className="h-5 w-5 animate-bounce" />
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 font-serif truncate">
              {title}
            </h4>
            <button
              type="button"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-2">
            {message}
          </p>
          <div className="flex items-center gap-2 pt-1.5">
            {onOpenPractice && (
              <button
                type="button"
                onClick={() => {
                  onOpenPractice(tab);
                  onClose();
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-500 shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                <span>{lang === 'en' ? 'Start Practice' : 'Почати практику'}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-200 dark:border-stone-800 px-2.5 py-1 text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              {lang === 'en' ? 'Later' : 'Пізніше'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
