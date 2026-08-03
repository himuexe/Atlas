import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-none gap-4 px-3 py-3 sm:px-4 lg:gap-5 lg:px-5 lg:py-4">
        <Sidebar />
        <main className="flex-1 rounded-[30px] border border-white/10 bg-[#060606]/90 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
