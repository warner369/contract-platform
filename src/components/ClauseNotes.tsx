'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useContract } from '@/components/providers/ContractProvider';
import type { NoteVisibility } from '@/types/contract';

export default function ClauseNotes({ clauseId }: { clauseId: string }) {
  const { getNotesForClause, addClauseNote, removeClauseNote } = useContract();
  const notes = getNotesForClause(clauseId);
  const [newContent, setNewContent] = useState('');
  const [newVisibility, setNewVisibility] = useState<NoteVisibility>('internal');

  function handleAddNote() {
    if (!newContent.trim()) return;
    addClauseNote({
      id: nanoid(),
      clauseId,
      content: newContent.trim(),
      visibility: newVisibility,
      createdAt: new Date().toISOString(),
    });
    setNewContent('');
  }

  function handleDeleteNote(noteId: string) {
    removeClauseNote(noteId);
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  const internalNotes = notes.filter((n) => n.visibility === 'internal');
  const externalNotes = notes.filter((n) => n.visibility === 'external');

  return (
    <div className="space-y-3">
      {notes.length > 0 && (
        <div className="space-y-2">
          {internalNotes.length > 0 && (
            <div>
              {internalNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative border-l-2 border-blue-300 pl-3 py-1.5 mb-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{note.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                          Internal
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTime(note.createdAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity"
                      aria-label="Delete note"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {externalNotes.length > 0 && (
            <div>
              {externalNotes.map((note) => (
                <div
                  key={note.id}
                  className="group relative border-l-2 border-emerald-300 pl-3 py-1.5 mb-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{note.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                          Shareable
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatTime(note.createdAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition-opacity"
                      aria-label="Delete note"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add a note..."
          className="w-full p-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          rows={2}
        />
        <div className="flex items-center justify-between">
          <div className="flex rounded-md border border-slate-200 overflow-hidden">
            <button
              onClick={() => setNewVisibility('internal')}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                newVisibility === 'internal'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-white text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Internal
            </button>
            <button
              onClick={() => setNewVisibility('external')}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                newVisibility === 'external'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-white text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.018a9.523 9.523 0 011.966-.725 10.04 10.04 0 01.51-1.092 8.488 8.488 0 00-2.476.817zm6.022.452a15.94 15.94 0 00-1.078-2.06 8.476 8.476 0 00-2.484.57 8.487 8.487 0 00-.57 2.484 15.94 15.94 0 002.06 1.078 16.16 16.16 0 012.072-1.078zm-3.768 1.874a16.17 16.17 0 001.078 2.072 16.17 16.17 0 002.072 1.078A16.17 16.17 0 009.406 9.344 16.17 16.17 0 007.336 8.266a16.17 16.17 0 00-1.75 2.078zm5.418.935a9.523 9.523 0 01-.725 1.966 8.488 8.488 0 002.476-.817 8.487 8.487 0 00-.57-2.484 15.94 15.94 0 01-1.18 1.335zm-1.75 2.072a8.487 8.487 0 01-2.078 1.752 8.488 8.488 0 002.395.51 8.487 8.487 0 002.395-.51 8.487 8.487 0 01-2.395-1.752z" clipRule="evenodd" />
              </svg>
              Shareable
            </button>
          </div>
          <button
            onClick={handleAddNote}
            disabled={!newContent.trim()}
            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add note
          </button>
        </div>
      </div>
    </div>
  );
}