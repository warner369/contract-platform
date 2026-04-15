'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { ContractProvider } from '@/components/providers/ContractProvider';
import ContractPageClient from '@/components/ContractPageClient';
import ExportButton from '@/components/ExportButton';
import LifecycleBadge from '@/components/LifecycleBadge';
import { ShareModal } from '@/components/ShareModal';
import type { ContractState, Clause } from '@/types/contract';
import { DEFAULT_FEEDBACK_MODE, isFeedbackMode } from '@/lib/feedback-mode';

interface ContractData {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  parties: string[];
  lifecycleState: string;
  feedbackMode: string;
  role: 'owner' | 'collaborator';
  permission: string;
  clauses: Array<{
    id: string;
    number: string;
    title: string;
    text: string;
    category: string;
    riskLevel: string;
    riskNotes: string;
    confidence: string;
    references: string[];
  }>;
  changes: Array<{
    id: string;
    clauseId: string;
    type: string;
    originalText: string;
    suggestedText: string;
    rationale: string;
    status: string;
    proposedBy: string;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    clauseId: string;
    content: string;
    visibility: string;
    authorId: string;
    createdAt: string;
  }>;
  threads: Array<{
    id: string;
    clauseId: string;
    resolved: boolean;
    createdAt: string;
  }>;
}

export default function ContractViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    async function loadContract() {
      try {
        const res = await fetch(`/api/contracts/${params.id}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          if (res.status === 403 || res.status === 404) {
            setError('Contract not found or access denied');
            return;
          }
          setError('Failed to load contract');
          return;
        }
        const data = (await res.json()) as ContractData;
        setContractData(data);
      } catch {
        setError('Failed to load contract');
      } finally {
        setIsLoading(false);
      }
    }
    loadContract();
  }, [params.id, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="text-sm text-slate-400">Loading contract...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f4]">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">{error}</h2>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!contractData) return null;

  const initialState: ContractState = {
    original: {
      title: contractData.title,
      summary: contractData.summary,
      parties: contractData.parties,
      clauses: contractData.clauses.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        text: c.text,
        category: c.category as Clause['category'],
        riskLevel: c.riskLevel as Clause['riskLevel'],
        riskNotes: c.riskNotes,
        confidence: c.confidence as 'high' | 'medium' | 'low',
        references: c.references,
      })),
    },
    current: {
      title: contractData.title,
      summary: contractData.summary,
      parties: contractData.parties,
      clauses: contractData.clauses.map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        text: c.text,
        category: c.category as Clause['category'],
        riskLevel: c.riskLevel as Clause['riskLevel'],
        riskNotes: c.riskNotes,
        confidence: c.confidence as 'high' | 'medium' | 'low',
        references: c.references,
      })),
    },
    changes: contractData.changes.map((ch) => ({
      id: ch.id,
      clauseId: ch.clauseId,
      type: ch.type as 'modify' | 'add' | 'remove',
      originalText: ch.originalText,
      suggestedText: ch.suggestedText,
      rationale: ch.rationale,
      status: ch.status as 'pending' | 'accepted' | 'rejected',
    })),
    notes: contractData.notes.map((n) => ({
      id: n.id,
      clauseId: n.clauseId,
      content: n.content,
      visibility: n.visibility as 'internal' | 'external',
      createdAt: n.createdAt,
    })),
    threads: contractData.threads.map((t) => ({
      id: t.id,
      clauseId: t.clauseId,
      messages: [],
      resolved: t.resolved,
      createdAt: t.createdAt,
    })),
    variables: [],
    auditLog: [],
    lifecycleState: contractData.lifecycleState as ContractState['lifecycleState'],
    feedbackMode: isFeedbackMode(contractData.feedbackMode) ? contractData.feedbackMode : DEFAULT_FEEDBACK_MODE,
    selectedClauseId: null,
    isLoading: false,
    error: null,
  };

  return (
    <ContractProvider initialState={initialState} contractId={params.id}>
      <div className="flex flex-col min-h-screen bg-[#f8f7f4]">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/dashboard" className="text-base font-semibold text-slate-900 tracking-tight hover:text-slate-700">
              Clause
            </Link>
            <div className="flex items-center gap-4">
              <LifecycleBadge />
              <ExportButton />
              {contractData.role === 'owner' && (
                <button
                  onClick={() => setShareModalOpen(true)}
                  className="text-xs font-medium px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Share
                </button>
              )}
              {user && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto px-6 pt-4 w-full">
          <ContractPageClient />
        </main>
      </div>

      <ShareModal
        contractId={params.id}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </ContractProvider>
  );
}