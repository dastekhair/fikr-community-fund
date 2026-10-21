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
          <div className="bg-white dark:bg-[#131713] border border-[#e0e4dd] dark:border-[#1f261f] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[#0e0f0c] dark:text-[#f4f6f3]">
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
            <div className="flex rounded-full bg-[#e8ebe6] dark:bg-[#181d18] p-1">
              <button
                onClick={() => setSelectedType('reminder')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  selectedType === 'reminder'
                    ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs'
                    : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
                }`}
              >
                Weekly Reminder
              </button>
              <button
                onClick={() => setSelectedType('summary')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  selectedType === 'summary'
                    ? 'bg-[#0e0f0c] dark:bg-white text-white dark:text-[#0e0f0c] shadow-xs'
                    : 'text-[#454745] dark:text-[#a3aba1] hover:text-[#0e0f0c]'
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
              <div className="p-3.5 rounded-xl bg-[#e8ebe6]/50 dark:bg-[#181d18] border border-[#e0e4dd] dark:border-[#1f261f] font-mono text-xs text-[#0e0f0c] dark:text-[#f4f6f3] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {currentMessage}
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
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
