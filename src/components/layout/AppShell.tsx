import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1 rounded-3xl border border-slate-800 bg-slate-950/95 p-6 shadow-sm shadow-black/30">
          {children}
        </main>
      </div>
    </div>
  );
}
