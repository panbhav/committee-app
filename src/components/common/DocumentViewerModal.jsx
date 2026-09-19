import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

export default function DocumentViewerModal({ doc, onClose }) {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl space-y-3 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">{doc.name || 'Security Document'}</h4>
              <p className="text-[10px] text-slate-400">{doc.label || 'Document'} • {doc.uploadedAt || 'Uploaded'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={doc.dataUrl}
              download={doc.name || 'document'}
              className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white"
              title="Download Document"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-slate-950/60 rounded-2xl border border-slate-800/80 min-h-[250px]">
          {doc.type === 'pdf' ? (
            <div className="text-center p-6 space-y-3">
              <FileText className="w-12 h-12 text-rose-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">PDF Document: {doc.name}</p>
              <a
                href={doc.dataUrl}
                download={doc.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Open PDF</span>
              </a>
            </div>
          ) : (
            <img
              src={doc.dataUrl}
              alt={doc.name || 'Attached Security Document'}
              className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
            />
          )}
        </div>
      </div>
    </div>
  );
}
