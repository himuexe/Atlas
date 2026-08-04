import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px] gap-0 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <Sidebar />
        <main className="min-w-0 flex-1 px-1 py-4 sm:px-6 sm:py-6 lg:px-12 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
