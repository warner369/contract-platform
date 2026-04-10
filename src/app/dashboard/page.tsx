'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

interface ContractListItem {
  id: string;
  title: string;
  lifecycleState: string;
  createdAt: string;
  role: 'owner' | 'collaborator';
  permission?: string;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContracts() {
      try {
        const res = await fetch('/api/contracts');
      if (res.ok) {
        const data = (await res.json()) as { contracts?: ContractListItem[] };
        setContracts(data.contracts || []);
        }
      } catch {
        // Will show empty state
      } finally {
        setIsLoading(false);
      }
    }
    loadContracts();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-slate-900 tracking-tight hover:text-slate-700">
            Clause
          </Link>
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-600">{user.name}</span>
                <button
                  onClick={logout}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your contracts</h1>
            <p className="text-sm text-slate-500 mt-1">Review, analyse, and collaborate on contracts</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Upload new contract
          </Link>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-400 py-12 text-center">Loading contracts...</div>
        ) : contracts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No contracts yet</h3>
            <p className="text-sm text-slate-500 mb-6">Upload your first contract to get started with AI-powered analysis.</p>
            <Link
              href="/"
              className="inline-flex px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
            >
              Upload a contract
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {contracts.map((contract) => (
              <Link
                key={contract.id}
                href={`/contracts/${contract.id}`}
                className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{contract.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">{new Date(contract.createdAt).toLocaleDateString()}</span>
                      {contract.role === 'collaborator' && (
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                          Shared · {contract.permission}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-100 text-slate-600">
                    {contract.lifecycleState.replace(/_/g, ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}