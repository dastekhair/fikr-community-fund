import React, { useState } from 'react';
import { Share2, MessageCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from './Button';
import { WHATSAPP_TEMPLATES } from '../../lib/constants';
import { useData } from '../../context/DataContext';
import { generateWhatsAppUrl } from '../../lib/utils';

export const WhatsAppActions: React.FC = () => {
  const { fundStats } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'reminder' | 'summary'>('reminder');
  const [copied, setCopied] = useState(false);

  const getMessageText = () => {
    if (selectedType === 'reminder') {
      return WHATSAPP_TEMPLATES.weeklyReminder();
    }
    return WHATSAPP_TEMPLATES.fundSummary({
      totalCollected: fundStats.totalCollected,
      totalReleased: fundStats.totalReleased,
      currentBalance: fundStats.currentBalance,
      casesHelped: fundStats.casesHelped
    });
  };

  const currentMessage = getMessageText();
  const shareUrl = generateWhatsAppUrl(currentMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedType('reminder');
            setModalOpen(true);
          }}
          icon={<MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        >
          Send Weekly Reminder
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedType('summary');
            setModalOpen(true);
          }}
          icon={<Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        >
          Send Fund Summary
        </Button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                  WhatsApp Group Share
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm font-medium"
              >
                ✕
              </button>
            </div>

            {/* Template Selector Tabs */}
            <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-800/60 p-1">
              <button
                onClick={() => setSelectedType('reminder')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedType === 'reminder'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Weekly Reminder
              </button>
              <button
                onClick={() => setSelectedType('summary')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedType === 'summary'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                Live Fund Summary
              </button>
            </div>

            {/* Message Preview Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>Message Preview</span>
                <span className="text-[11px] text-neutral-400">Opens in WhatsApp</span>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 font-mono text-xs text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {currentMessage}
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 leading-normal">
              Clicking below opens your WhatsApp with the message pre-filled. You can choose the group and review before tapping send.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleCopy}
                icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copied ? 'Copied to Clipboard' : 'Copy Text'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleOpenWhatsApp}
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open WhatsApp
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
