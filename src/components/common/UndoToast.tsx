import React, { useEffect, useState } from 'react';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';

interface UndoToastProps {
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onClose: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  durationMs = 8000,
  onUndo,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);
      if (remainingPct <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationMs, onClose]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:max-w-md z-50 bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] p-4 rounded-2xl shadow-2xl border border-neutral-700/80 dark:border-neutral-200 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="font-medium truncate">{message}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 dark:bg-black/10 hover:bg-white/30 dark:hover:bg-black/20 text-xs font-bold transition-colors select-none touch-manipulation min-h-[36px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss notification"
            className="p-1 rounded-full text-neutral-400 hover:text-white dark:hover:text-[#0e0f0c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress countdown indicator */}
      <div className="w-full bg-neutral-800 dark:bg-neutral-200 h-1 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
