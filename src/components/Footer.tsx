import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Tag,
  ShieldCheck,
  X,
  Sparkles,
  CheckCircle2,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { APP_CURRENT_VERSION, RELEASES_HISTORY } from '../data/releaseNotes';

export const Footer: React.FC = () => {
  const { lang, theme } = useThemeLanguage();
  const [showChangelogModal, setShowChangelogModal] = useState(false);

  return (
    <>
      <footer
        id="app-footer"
        className="w-full border-t border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-stone-950/80 backdrop-blur-md py-4 px-3 sm:px-6 transition-colors duration-200 mt-auto"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Studio & Rights */}
          <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 text-center sm:text-left flex-wrap justify-center sm:justify-start">
            <span className="font-medium">
              Розроблено —{' '}
              <strong className="font-semibold text-stone-900 dark:text-stone-200">
                Pilnikov Maksym Studio
              </strong>
              . Всі права захищені.
            </span>
          </div>

          {/* Center / Right: Release Versioning & Telegram Contact */}
          <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap justify-center">
            {/* Version Badge & Release History Button */}
            <button
              id="release-version-btn"
              type="button"
              onClick={() => setShowChangelogModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 font-mono font-semibold text-[11px] transition-all cursor-pointer shadow-2xs hover:scale-102"
              title={lang === 'ru' ? 'История релизов и обновлений' : 'Історія релізів та оновлень'}
            >
              <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Версія: {APP_CURRENT_VERSION}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
            </button>

            {/* Telegram Contact Link */}
            <a
              id="telegram-contact-link"
              href="https://t.me/pilnikoff"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30 font-medium text-xs transition-all hover:scale-102 shadow-2xs cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{lang === 'ru' ? 'Связаться с нами:' : 'Звʼязатися з нами:'}</span>
              <strong className="font-semibold text-sky-800 dark:text-sky-300">@pilnikoff</strong>
              <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
            </a>
          </div>
        </div>
      </footer>

      {/* Changelog & Releases Modal */}
      <AnimatePresence>
        {showChangelogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-stone-900 dark:text-stone-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                      <span>{lang === 'ru' ? 'Журнал релизов и обновлений' : 'Журнал релізів та оновлень'}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-mono font-bold">
                        {APP_CURRENT_VERSION}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Pilnikov Maksym Studio • Офіційні версії
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChangelogModal(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Releases List */}
              <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-4">
                {RELEASES_HISTORY.map((rel, idx) => (
                  <div
                    key={rel.version}
                    className={`p-4 rounded-xl border transition-all ${
                      idx === 0
                        ? 'bg-teal-500/5 dark:bg-teal-950/20 border-teal-500/30'
                        : 'bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono font-bold text-xs">
                          {rel.version}
                        </span>
                        {idx === 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500 text-stone-950 font-bold uppercase tracking-wider">
                            {lang === 'ru' ? 'Текущая' : 'Поточна'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3" />
                        {rel.releaseDate}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-200 mb-2">
                      {rel.title}
                    </h4>

                    <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
                      {rel.changes.map((ch, chIdx) => (
                        <li key={chIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                          <span>{ch}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Footer inside modal */}
              <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/80 flex items-center justify-between">
                <a
                  href="https://t.me/pilnikoff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Підтримка та пропозиції в Telegram: @pilnikoff</span>
                </a>
                <button
                  type="button"
                  onClick={() => setShowChangelogModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold hover:bg-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                >
                  Закрити
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Footer;
