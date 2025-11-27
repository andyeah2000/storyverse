import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Film,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { TitlePageData } from '../types';
import { DEFAULT_TITLE_PAGE } from '../constants';

// ============================================
// TYPES
// ============================================

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: (titlePage?: TitlePageData) => void;
  onExportFountain: () => void;
  onExportFDX: () => void;
  initialTitle?: string;
  initialAuthor?: string;
}

// ============================================
// EXPORT MODAL COMPONENT
// ============================================

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportPDF,
  onExportFountain,
  onExportFDX,
  initialTitle = 'Untitled Screenplay',
  initialAuthor = '',
}) => {
  const [step, setStep] = useState<'format' | 'title-page'>('format');
  const [titlePage, setTitlePage] = useState<TitlePageData>({
    ...DEFAULT_TITLE_PAGE,
    title: initialTitle,
    author: initialAuthor,
  });

  if (!isOpen) return null;

  const handleExportWithTitlePage = () => {
    onExportPDF(titlePage);
    onClose();
  };

  const handleExportWithoutTitlePage = () => {
    onExportPDF();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div 
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-6 flex items-center justify-between border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            {step === 'format' ? 'Export Screenplay' : 'Title Page'}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-100 text-stone-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'format' ? (
            <>
              {/* Title & Author Inputs */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Title
                  </label>
                  <input
                    type="text"
                    value={titlePage.title}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none border transition-all bg-stone-50 border-stone-200 text-stone-900 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Author
                  </label>
                  <input
                    type="text"
                    value={titlePage.author}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Your name"
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none border transition-all bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Export Formats */}
              <div className="grid grid-cols-2 gap-4">
                {/* PDF */}
                <button
                  onClick={handleExportWithoutTitlePage}
                  className="p-5 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] group bg-stone-50 border-stone-200 hover:border-red-500/50"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-red-100 text-red-600 group-hover:bg-red-200">
                    <FileText size={24} />
                  </div>
                  <div className="font-semibold text-[15px] text-stone-900">
                    PDF
                  </div>
                  <div className="text-xs mt-1 text-stone-400">
                    Industry standard format
                  </div>
                </button>

                {/* PDF with Title Page */}
                <button
                  onClick={() => setStep('title-page')}
                  className="p-5 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] group bg-stone-50 border-stone-200 hover:border-emerald-500/50"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200">
                    <BookOpen size={24} />
                  </div>
                  <div className="font-semibold text-[15px] flex items-center gap-1 text-stone-900">
                    PDF + Title Page
                    <ChevronRight size={14} />
                  </div>
                  <div className="text-xs mt-1 text-stone-400">
                    Professional cover page
                  </div>
                </button>

                {/* Fountain */}
                <button
                  onClick={() => { onExportFountain(); onClose(); }}
                  className="p-5 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] group bg-stone-50 border-stone-200 hover:border-blue-500/50"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-blue-100 text-blue-600 group-hover:bg-blue-200">
                    <Download size={24} />
                  </div>
                  <div className="font-semibold text-[15px] text-stone-900">
                    Fountain
                  </div>
                  <div className="text-xs mt-1 text-stone-400">
                    Plain text screenplay
                  </div>
                </button>

                {/* Final Draft */}
                <button
                  onClick={() => { onExportFDX(); onClose(); }}
                  className="p-5 rounded-xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] group bg-stone-50 border-stone-200 hover:border-purple-500/50"
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors bg-purple-100 text-purple-600 group-hover:bg-purple-200">
                    <Film size={24} />
                  </div>
                  <div className="font-semibold text-[15px] text-stone-900">
                    Final Draft
                  </div>
                  <div className="text-xs mt-1 text-stone-400">
                    .fdx format
                  </div>
                </button>
              </div>
            </>
          ) : (
            /* Title Page Form */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Title
                  </label>
                  <input
                    type="text"
                    value={titlePage.title}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none border bg-stone-50 border-stone-200 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Credit
                  </label>
                  <input
                    type="text"
                    value={titlePage.credit}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, credit: e.target.value }))}
                    placeholder="Written by"
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none border bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Author
                  </label>
                  <input
                    type="text"
                    value={titlePage.author}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none border bg-stone-50 border-stone-200 text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Source Material
                  </label>
                  <input
                    type="text"
                    value={titlePage.source || ''}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="Based on..."
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none border bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Draft Date
                  </label>
                  <input
                    type="text"
                    value={titlePage.draftDate}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, draftDate: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none border bg-stone-50 border-stone-200 text-stone-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold uppercase tracking-wide mb-2 text-stone-500">
                    Contact Info
                  </label>
                  <textarea
                    value={titlePage.contact || ''}
                    onChange={(e) => setTitlePage(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="Email, phone, agent..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-400"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setStep('format')}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Back
                </button>
                <button
                  onClick={handleExportWithTitlePage}
                  className="flex-1 h-11 rounded-xl text-sm font-semibold transition-colors bg-stone-900 text-white hover:bg-stone-800"
                >
                  Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
