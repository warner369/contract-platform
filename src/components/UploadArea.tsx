'use client';

import { useState, useCallback, useRef } from 'react';

type UploadMode = 'file' | 'paste';

interface UploadAreaProps {
  onUpload?: (file: File | null, text: string | null) => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}

export default function UploadArea({ onUpload }: UploadAreaProps) {
  const [mode, setMode] = useState<UploadMode>('file');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return 'Please upload a PDF or Word document (.pdf, .docx)';
    }
    if (file.size > 20 * 1024 * 1024) {
      return 'File must be under 20 MB';
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleSubmit = () => {
    if (mode === 'file' && selectedFile) {
      onUpload?.(selectedFile, null);
    } else if (mode === 'paste' && pastedText.trim()) {
      onUpload?.(null, pastedText.trim());
    }
  };

  const canSubmit = (mode === 'file' && selectedFile !== null) ||
    (mode === 'paste' && pastedText.trim().length > 50);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Mode tabs */}
      <div className="flex border border-slate-200 rounded-xl overflow-hidden mb-4 bg-white">
        <button
          onClick={() => setMode('file')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            mode === 'file'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Upload File
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            mode === 'paste'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          Paste Text
        </button>
      </div>

      {/* File upload zone */}
      {mode === 'file' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            onChange={handleFileInput}
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <FileIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
                <UploadIcon className={`w-6 h-6 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {isDragging ? 'Drop to upload' : 'Drag and drop your contract here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">or click to browse · PDF or Word · Max 20 MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paste text zone */}
      {mode === 'paste' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your contract text here..."
            className="w-full h-56 p-4 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none font-mono leading-relaxed"
          />
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <span className="text-xs text-slate-400">
              {pastedText.length > 0
                ? `${pastedText.trim().split(/\s+/).length} words`
                : 'Accepts plain text contract content'}
            </span>
            {pastedText.length > 0 && pastedText.trim().length < 50 && (
              <span className="text-xs text-amber-500">Add more text to continue</span>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          mt-4 w-full py-3.5 px-6 rounded-xl text-sm font-semibold transition-all
          ${canSubmit
            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow cursor-pointer'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }
        `}
      >
        Analyse Contract
      </button>
    </div>
  );
}
