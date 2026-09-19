import React, { useState, useRef } from 'react';
import { processFileAttachment } from '../../utils/fileUtils';
import DocumentViewerModal from './DocumentViewerModal';
import { Paperclip, Plus, Trash2, Eye, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

const DOC_TYPES = [
  'Signed Form (हस्ताक्षरित फॉर्म)',
  'Security Cheque (सिक्योरिटी चेक)',
  'Aadhaar / ID Proof (आधार कार्ड)',
  'Promissory Note / Stamp (प्रॉमिसरी नोट)',
  'Other Security (अन्य दस्तावेज)'
];

export default function DocumentAttachmentInput({ documents = [], onChange }) {
  const [selectedLabel, setSelectedLabel] = useState(DOC_TYPES[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      const processed = await processFileAttachment(file, selectedLabel.split(' (')[0]);
      onChange([...documents, processed]);
    } catch (err) {
      alert(err.message || 'Error processing document attachment');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id) => {
    onChange(documents.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
      <div className="flex items-center justify-between">
        <label className="text-slate-300 font-bold flex items-center gap-1.5 text-xs">
          <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
          <span>Security / Signed Form Attachment (दस्तावेज़ या चेक जोड़ें):</span>
        </label>
        <span className="text-[10px] text-slate-500">Optional</span>
      </div>

      <div className="flex gap-2 items-center">
        <select
          value={selectedLabel}
          onChange={(e) => setSelectedLabel(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2 text-[11px] text-white focus:outline-none focus:border-indigo-500"
        >
          {DOC_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="hidden"
          id="doc-file-input"
        />

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow transition active:scale-95"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{isProcessing ? 'Processing...' : 'Upload'}</span>
        </button>
      </div>

      {/* List of Attached Documents */}
      {documents.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {documents.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {d.type === 'pdf' ? (
                  <FileText className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-semibold text-white block text-[11px] truncate">{d.name}</span>
                  <span className="text-[9px] text-slate-400 block">{d.label}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingDoc(d)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="View Document"
                >
                  <Eye className="w-3 h-3 text-sky-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(d.id)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-red-400 transition"
                  title="Remove Document"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingDoc && (
        <DocumentViewerModal doc={viewingDoc} onClose={() => setViewingDoc(null)} />
      )}
    </div>
  );
}
