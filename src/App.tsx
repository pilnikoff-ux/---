import React, { useState, useEffect, useRef } from 'react';
import { Navbar, TabType } from './components/Navbar';
import { ConsiliumNavigator } from './components/ConsiliumNavigator';
import { JungianArchetypes } from './components/JungianArchetypes';
import { ValuesMotivationDiagnostic } from './components/ValuesMotivationDiagnostic';
import { BeliefPatterningTool } from './components/BeliefPatterningTool';
import { SixteenAssociationsTool } from './components/SixteenAssociationsTool';
import { DescartesSquareTool } from './components/DescartesSquareTool';
import { FiveWhysTool } from './components/FiveWhysTool';
import { CbtThoughtDiary } from './components/CbtThoughtDiary';
import { GoalMakersGame } from './components/GoalMakersGame';
import { GoalMakersBoardGame } from './components/GoalMakersBoardGame';
import { NvcEqTrainer } from './components/NvcEqTrainer';
import { WheelOfBalance } from './components/WheelOfBalance';
import { DailyAffirmations } from './components/DailyAffirmations';
import { HundredWishesPractice } from './components/HundredWishesPractice';
import { SelfReflectionTool } from './components/SelfReflectionTool';
import { SmartGoalsTool } from './components/SmartGoalsTool';
import { FeedbackSystem } from './components/FeedbackSystem';
import { KnowledgeBase } from './components/KnowledgeBase';
import { MyJournal } from './components/MyJournal';
import { UserAuthAndStatsModal } from './components/UserAuthAndStatsModal';
import { SomaticGroundingModal } from './components/SomaticGroundingModal';
import { PracticeReminderModal } from './components/PracticeReminderModal';
import { NotificationBanner } from './components/NotificationBanner';
import { Footer } from './components/Footer';
import { getJournalEntries } from './services/storageService';
import { getUserProfile, isProfileComplete } from './services/userStatsService';
import {
  getReminderConfig,
  playSereneChime,
  sendBrowserNotification,
} from './services/reminderService';
import { useThemeLanguage } from './context/ThemeLanguageContext';

export function App() {
  const { theme, lang } = useThemeLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('consilium');
  const [isSomaticOpen, setIsSomaticOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [journalCount, setJournalCount] = useState(0);

  // Active notification banner state
  const [activeBanner, setActiveBanner] = useState<{
    title: string;
    message: string;
    tab: TabType;
  } | null>(null);

  // Transfer data from Consilium to Goal Makers
  const [goalMakersInitialData, setGoalMakersInitialData] = useState<{
    title?: string;
    pointA?: string;
    pointB?: string;
    action24h?: string;
  } | undefined>(undefined);

  // Transfer data from 100 Wishes to SMART Goals
  const [smartGoalInitialData, setSmartGoalInitialData] = useState<{
    title: string;
    category: string;
  } | undefined>(undefined);

  const handleSendWishToSmartGoal = (wishText: string, category: string) => {
    setSmartGoalInitialData({ title: wishText, category });
    setActiveTab('smartGoals');
  };

  const lastTriggeredMinuteRef = useRef<string>('');

  const updateJournalCount = () => {
    const entries = getJournalEntries();
    setJournalCount(entries.length);
  };

  useEffect(() => {
    updateJournalCount();
    // In a new browser or first visit, if mandatory profile fields are not completed, open modal immediately
    const profile = getUserProfile();
    if (!isProfileComplete(profile)) {
      setIsProfileModalOpen(true);
    }
  }, []);

  // Background reminder scheduler
  useEffect(() => {
    const checkReminderTime = async () => {
      const config = getReminderConfig();
      if (!config.enabled || !config.time) return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // Check if current time matches scheduled time and hasn't fired in this minute
      if (currentTimeStr === config.time && lastTriggeredMinuteRef.current !== currentTimeStr) {
        lastTriggeredMinuteRef.current = currentTimeStr;

        const practiceMap: Record<string, { titleUk: string; titleEn: string; tab: TabType }> = {
          affirmations: {
            titleUk: 'Афірмація Дня',
            titleEn: 'Daily Affirmation',
            tab: 'affirmations',
          },
          grounding: {
            titleUk: 'SOS Заземлення & Дихання',
            titleEn: 'SOS Grounding & Breathing',
            tab: 'consilium',
          },
          cbt: {
            titleUk: 'КПТ Щоденник Думок',
            titleEn: 'CBT Thought Diary',
            tab: 'cbt',
          },
          consilium: {
            titleUk: 'Консиліум: Розбір ситуації',
            titleEn: 'Consilium: Dilemma Analysis',
            tab: 'consilium',
          },
          archetypes: {
            titleUk: '12 Архетипів & Тінь Юнга',
            titleEn: '12 Jungian Archetypes',
            tab: 'archetypes',
          },
          values: {
            titleUk: 'Цінності & Мотивація',
            titleEn: 'Values & Motivation',
            tab: 'values',
          },
          beliefs: {
            titleUk: 'Патеринг Переконань',
            titleEn: 'Belief Patterning',
            tab: 'beliefs',
          },
          goalMakersBoard: {
            titleUk: 'Goal MAker$: Настільна гра-тренінг',
            titleEn: 'Goal MAker$: Board Game Session',
            tab: 'goalMakersBoard',
          },
          goalMakers: {
            titleUk: 'Мета Героя: Стратегія та Крок',
            titleEn: "Hero's Goal: Strategy & Action",
            tab: 'goalMakers',
          },
          wheelOfBalance: {
            titleUk: 'Колесо Балансу',
            titleEn: 'Wheel of Balance',
            tab: 'wheelOfBalance',
          },
        };

        const currentPrac = practiceMap[config.practiceType] || practiceMap.affirmations;
        const bannerTitle =
          lang === 'en'
            ? `🔔 Practice Time: ${currentPrac.titleEn}`
            : `🔔 Час для практики: ${currentPrac.titleUk}`;
        const bannerMessage =
          config.customMessage ||
          (lang === 'en'
            ? 'Take a mindful pause and reconnect with your inner balance.'
            : 'Зробіть усвідомлену паузу для емоційного відновлення та ясності.');

        if (config.soundEnabled) {
          playSereneChime();
        }

        if (config.browserNotificationsEnabled) {
          await sendBrowserNotification(bannerTitle, bannerMessage);
        }

        setActiveBanner({
          title: bannerTitle,
          message: bannerMessage,
          tab: currentPrac.tab,
        });
      }
    };

    // Check immediately and every 20 seconds
    checkReminderTime();
    const interval = setInterval(checkReminderTime, 20000);
    return () => clearInterval(interval);
  }, [lang]);

  const handleSendToGoalMakers = (data: {
    title: string;
    pointA: string;
    pointB: string;
    action24h: string;
  }) => {
    setGoalMakersInitialData(data);
    setActiveTab('goalMakers');
  };

  const handleSavedToJournal = () => {
    updateJournalCount();
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 ${
        theme === 'dark'
          ? 'bg-stone-950 text-stone-100 selection:bg-teal-500/30 selection:text-teal-200'
          : 'bg-stone-100 text-stone-900 selection:bg-teal-500/30 selection:text-teal-900'
      }`}
    >
      {/* Top Header Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenGrounding={() => setIsSomaticOpen(true)}
        onOpenReminders={() => setIsRemindersOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        journalCount={journalCount}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-10 pt-3 px-2 sm:px-4">
        {activeTab === 'consilium' && (
          <ConsiliumNavigator
            onSendToGoalMakers={handleSendToGoalMakers}
            onSelectTab={setActiveTab}
            onOpenGrounding={() => setIsSomaticOpen(true)}
            onSavedToJournal={handleSavedToJournal}
          />
        )}

        {activeTab === 'hundredWishes' && (
          <HundredWishesPractice
            onSavedToJournal={handleSavedToJournal}
            onSendToSmartGoal={handleSendWishToSmartGoal}
          />
        )}

        {activeTab === 'selfReflection' && (
          <SelfReflectionTool
            onSavedToJournal={handleSavedToJournal}
          />
        )}

        {activeTab === 'smartGoals' && (
          <SmartGoalsTool
            initialGoalTitle={smartGoalInitialData?.title}
            initialCategory={smartGoalInitialData?.category}
            onSavedToJournal={handleSavedToJournal}
          />
        )}

        {activeTab === 'archetypes' && (
          <JungianArchetypes onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'values' && (
          <ValuesMotivationDiagnostic onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'beliefs' && (
          <BeliefPatterningTool onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'affirmations' && (
          <DailyAffirmations onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'associations16' && (
          <SixteenAssociationsTool onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'descartes' && (
          <DescartesSquareTool onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'fiveWhys' && (
          <FiveWhysTool onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'cbt' && (
          <CbtThoughtDiary onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'nvcEq' && (
          <NvcEqTrainer onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'wheelOfBalance' && (
          <WheelOfBalance onSavedToJournal={handleSavedToJournal} />
        )}

        {activeTab === 'goalMakersBoard' && (
          <GoalMakersBoardGame />
        )}

        {activeTab === 'goalMakers' && (
          <GoalMakersGame
            initialData={goalMakersInitialData}
            onSavedToJournal={handleSavedToJournal}
          />
        )}

        {activeTab === 'feedback' && (
          <FeedbackSystem />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBase onNavigateToTool={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'journal' && (
          <MyJournal
            onNavigateToTool={(tab) => setActiveTab(tab)}
            onOpenProfileModal={() => setIsProfileModalOpen(true)}
          />
        )}
      </main>

      {/* App Footer: Studio branding, Release version & Telegram contact */}
      <Footer />

      {/* User Profile & Mandatory Registration Modal */}
      <UserAuthAndStatsModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          const p = getUserProfile();
          if (isProfileComplete(p)) {
            setIsProfileModalOpen(false);
          }
        }}
        isMandatoryOnboarding={!isProfileComplete(getUserProfile())}
        onProfileSaved={() => {
          updateJournalCount();
          setIsProfileModalOpen(false);
        }}
      />

      {/* Somatic SOS Modal */}
      <SomaticGroundingModal
        isOpen={isSomaticOpen}
        onClose={() => setIsSomaticOpen(false)}
      />

      {/* Practice Reminders & Notifications Modal */}
      <PracticeReminderModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
        onNavigateToPractice={(tab) => {
          setActiveTab(tab);
        }}
        onTriggerNotificationBanner={(title, message, tab) => {
          setActiveBanner({ title, message, tab });
        }}
      />

      {/* Notification Banner when triggered */}
      {activeBanner && (
        <NotificationBanner
          title={activeBanner.title}
          message={activeBanner.message}
          tab={activeBanner.tab}
          onOpenPractice={(tab) => {
            setActiveTab(tab);
          }}
          onClose={() => setActiveBanner(null)}
        />
      )}
    </div>
  );
}

export default App;
