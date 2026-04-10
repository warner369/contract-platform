'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

interface InviteInfo {
  invite: {
    id: string;
    contractId: string;
    permission: string;
    expiresAt: string | null;
  };
  contract: { id: string; title: string } | null;
  inviter: { id: string; name: string } | null;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          setError(data.error || 'Failed to load invite');
          return;
        }
        const data = (await res.json()) as InviteInfo;
        setInviteInfo(data);
      } catch {
        setError('Failed to load invite');
      }
    }
    fetchInvite();
  }, [token]);

  async function handleAccept() {
    setIsAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error || 'Failed to accept invite');
        return;
      }
      const data = (await res.json()) as { contractId: string };
      router.push(`/contracts/${data.contractId}`);
    } catch {
      setError('Failed to accept invite');
    } finally {
      setIsAccepting(false);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Invite Error</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="text-sm text-slate-400">Loading invite...</div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              {inviteInfo.inviter?.name || 'Someone'} invited you to review a contract
            </h1>
            {inviteInfo.contract && (
              <p className="text-sm text-slate-500 mb-4">
                Contract: <span className="font-medium text-slate-700">{inviteInfo.contract.title}</span>
              </p>
            )}
            <p className="text-sm text-slate-500 mb-6">
              Sign in or create an account to accept this invitation.
            </p>
            <div className="space-y-3">
              <a
                href={`/login?redirect=/invite/${token}`}
                className="block w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg text-center hover:bg-slate-800 transition-colors"
              >
                Sign in
              </a>
              <a
                href={`/register?redirect=/invite/${token}`}
                className="block w-full py-2.5 px-4 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg text-center hover:bg-slate-50 transition-colors"
              >
                Create account
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
      <div className="w-full max-w-sm">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {inviteInfo.inviter?.name || 'Someone'} invited you to collaborate
          </h1>
          {inviteInfo.contract && (
            <p className="text-sm text-slate-500 mb-2">
              Contract: <span className="font-medium text-slate-700">{inviteInfo.contract.title}</span>
            </p>
          )}
          <p className="text-sm text-slate-500 mb-6">
            Permission level: <span className="capitalize font-medium">{inviteInfo.invite.permission}</span>
          </p>
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="w-full py-2.5 px-4 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAccepting ? 'Accepting...' : 'Accept invitation'}
          </button>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}