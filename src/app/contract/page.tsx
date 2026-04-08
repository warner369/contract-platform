import ContractView from '@/components/ContractView';
import { ContractProvider } from '@/components/providers/ContractProvider';

export default function ContractPage() {
  // This is a client-side rendered page - the contract data is passed
  // via React context from the upload flow
  return (
    <ContractProvider>
      <div className="flex flex-col min-h-screen bg-[#f8f7f4]">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <a href="/" className="text-base font-semibold text-slate-900 tracking-tight hover:text-slate-700">
              Clause
            </a>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-medium px-2.5 py-1 bg-slate-100 rounded-full">
                Prototype
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <ContractView />
        </main>
      </div>
    </ContractProvider>
  );
}