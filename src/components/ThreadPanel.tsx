'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useContract } from '@/components/providers/ContractProvider';

export default function ThreadPanel({ clauseId }: { clauseId: string }) {
  const { getThreadsForClause, addThread, addThreadMessage, resolveThread } = useContract();
  const threads = getThreadsForClause(clauseId);
  const [startingNew, setStartingNew] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  function handleStartThread() {
    if (!newMessage.trim()) return;
    addThread({
      id: nanoid(),
      clauseId,
      messages: [
        {
          id: nanoid(),
          author: 'You',
          content: newMessage.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      resolved: false,
      createdAt: new Date().toISOString(),
    });
    setNewMessage('');
    setStartingNew(false);
  }

  function handleReply(threadId: string) {
    if (!replyText.trim()) return;
    addThreadMessage(threadId, {
      id: nanoid(),
      author: 'You',
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    });
    setReplyText('');
    setReplyingTo(null);
  }

  function handleResolve(threadId: string) {
    resolveThread(threadId);
  }

  function formatTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  const openThreads = threads.filter((t) => !t.resolved);
  const resolvedThreads = threads.filter((t) => t.resolved);

  return (
    <div className="space-y-3">
      {openThreads.length > 0 && (
        <div className="space-y-3">
          {openThreads.map((thread) => (
            <div key={thread.id} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Root message */}
              <div className="p-3 bg-slate-50">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-semibold text-white">
                      {thread.messages[0].author.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {thread.messages[0].author}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatTime(thread.messages[0].createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-0.5">
                      {thread.messages[0].content}
                    </p>
                  </div>
                </div>
              </div>

              {/* Replies */}
              {thread.messages.length > 1 && (
                <div className="border-t border-slate-100">
                  {thread.messages.slice(1).map((msg) => (
                    <div
                      key={msg.id}
                      className="px-3 py-2 border-l-2 border-slate-200 ml-4"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0">
                          <span className="text-[9px] font-semibold text-white">
                            {msg.author.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-700">
                              {msg.author}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="px-3 py-2 border-t border-slate-100 flex items-center gap-2">
                {replyingTo === thread.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type a reply..."
                      className="flex-1 p-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleReply(thread.id);
                      }}
                    />
                    <button
                      onClick={() => handleReply(thread.id)}
                      disabled={!replyText.trim()}
                      className="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setReplyingTo(thread.id)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleResolve(thread.id)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Resolve
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {resolvedThreads.length > 0 && (
        <div className="space-y-2">
          {resolvedThreads.map((thread) => (
            <div
              key={thread.id}
              className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-400"
            >
              <span className="text-emerald-600 font-medium">Resolved</span>
              {' — '}
              {thread.messages[0].content.slice(0, 60)}
              {thread.messages[0].content.length > 60 ? '...' : ''}
            </div>
          ))}
        </div>
      )}

      {threads.length === 0 && !startingNew && (
        <p className="text-sm text-slate-400">No discussions yet.</p>
      )}

      {startingNew ? (
        <div className="space-y-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Start a discussion..."
            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleStartThread}
              disabled={!newMessage.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
            <button
              onClick={() => { setStartingNew(false); setNewMessage(''); }}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setStartingNew(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Start a discussion
        </button>
      )}
    </div>
  );
}