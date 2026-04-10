'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import type { CollaboratorPermission, ContractCollaborator, ContractInvite } from '@/types/collaboration';

interface ShareModalProps {
  contractId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  email: string;
}

export function ShareModal({ contractId, isOpen, onClose }: ShareModalProps) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<ContractCollaborator[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPermission, setSelectedPermission] = useState<CollaboratorPermission>('read');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadCollaborators = useCallback(async () => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/collaborators`);
      if (res.ok) {
        const data = (await res.json()) as { collaborators?: ContractCollaborator[] };
        setCollaborators(data.collaborators || []);
      }
    } catch {
      // Silently fail
    }
  }, [contractId]);

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen, loadCollaborators]);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = (await res.json()) as { users?: SearchResult[] };
          setSearchResults(data.users || []);
        }
      } catch {
        // Silently fail
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function createInvite(permission: CollaboratorPermission) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      });
      if (res.ok) {
        const data = (await res.json()) as ContractInvite;
        setInviteUrl(`${window.location.origin}/invite/${data.token}`);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }

  async function removeCollaborator(userId: string) {
    try {
      const res = await fetch(`/api/contracts/${contractId}/collaborators/${userId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCollaborators((prev) => prev.filter((c) => c.userId !== userId));
      }
    } catch {
      // Silently fail
    }
  }

  async function changePermission(userId: string, permission: CollaboratorPermission) {
    try {
      const res = await fetch(`/api/contracts/${contractId}/collaborators/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permission }),
      });
      if (res.ok) {
        setCollaborators((prev) =>
          prev.map((c) => (c.userId === userId ? { ...c, permission } : c)),
        );
      }
    } catch {
      // Silently fail
    }
  }

  function copyLink() {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Share contract</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Invite Link Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Create shareable link
          </label>
          <div className="flex items-center gap-2 mb-3">
            <select
              value={selectedPermission}
              onChange={(e) => setSelectedPermission(e.target.value as CollaboratorPermission)}
              className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm"
            >
              <option value="read">Can view</option>
              <option value="comment">Can comment</option>
              <option value="edit">Can edit</option>
            </select>
            <button
              onClick={() => createInvite(selectedPermission)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create link'}
            </button>
          </div>
          {inviteUrl && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 bg-slate-50"
              />
              <button
                onClick={copyLink}
                className="px-3 py-1.5 border border-slate-200 text-sm rounded-lg hover:bg-slate-50"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
        </div>

        {/* Search Users */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Search users
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchResults.length > 0 && (
            <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden">
              {searchResults
                .filter((r) => r.id !== user?.id)
                .map((result) => (
                  <div key={result.id} className="px-3 py-2 hover:bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{result.name}</div>
                      <div className="text-xs text-slate-400">{result.email}</div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Current Collaborators */}
        {collaborators.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Collaborators</h3>
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div key={collab.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{collab.userName}</div>
                    <div className="text-xs text-slate-400">{collab.userEmail}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={collab.permission}
                      onChange={(e) => changePermission(collab.userId, e.target.value as CollaboratorPermission)}
                      className="text-xs px-2 py-1 border border-slate-200 rounded"
                    >
                      <option value="read">View</option>
                      <option value="comment">Comment</option>
                      <option value="edit">Edit</option>
                    </select>
                    <button
                      onClick={() => removeCollaborator(collab.userId)}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}