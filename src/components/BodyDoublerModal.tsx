import React from 'react';
import { BodyDoublerTool } from './BodyDoublerTool';

interface BodyDoublerModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  sourceContext?: string;
  timeframe?: '15' | '25' | '45' | '60';
  onNavigateToTab?: (tab: any) => void;
  onSavedToJournal?: () => void;
}

export const BodyDoublerModal: React.FC<BodyDoublerModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  sourceContext,
  timeframe = '25',
  onNavigateToTab,
  onSavedToJournal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl bg-stone-50 dark:bg-stone-900 border border-indigo-500/40 shadow-2xl animate-in fade-in zoom-in-95">
        <BodyDoublerTool
          initialTask={taskTitle}
          sourceContext={sourceContext}
          initialTimeframe={timeframe}
          isModal={true}
          onCloseModal={onClose}
          onNavigateToTab={(tab) => {
            onClose();
            if (onNavigateToTab) onNavigateToTab(tab);
          }}
          onSavedToJournal={onSavedToJournal}
        />
      </div>
    </div>
  );
};

export default BodyDoublerModal;
