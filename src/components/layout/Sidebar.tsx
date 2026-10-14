import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';

const navigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: "Today's Focus", path: '/focus' },
  { label: 'Health Snapshot', path: '/health' },
  { label: 'Journal', path: '/journal' },
  { label: 'Streaks', path: '/streaks' },
  { label: 'Savings', path: '/savings' },
  { label: 'Goals', path: '/goals' },
  { label: 'Notes', path: '/notes' },
  { label: 'Settings', path: '/settings' },
];

function NavigationLinks({ compact = false }: { compact?: boolean }) {
  const reducedMotion = useReducedMotion();

  return (
    <>
      {navigation.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => [
            'relative transition-colors duration-200 focus-visible:outline-none',
            compact
              ? 'shrink-0 rounded-lg px-3 py-2 text-xs'
              : 'block rounded-lg px-3 py-2.5 pl-4 text-sm',
            isActive
              ? 'font-medium text-white'
              : 'text-zinc-500 hover:bg-white/[0.045] hover:text-zinc-200',
          ].join(' ')}
        >
          {({ isActive }) => (
            <>
              {item.label}
              {isActive ? (
                <motion.span
                  layoutId="atlas-active-navigation"
                  className={compact
                    ? 'absolute inset-x-3 bottom-0 h-px rounded-full bg-signal shadow-[0_0_10px_rgb(var(--rgb-signal)/0.45)]'
                    : 'absolute bottom-2 left-0 top-2 w-0.5 rounded-full bg-signal shadow-[0_0_10px_rgb(var(--rgb-signal)/0.45)]'}
                  transition={reducedMotion !== false
                    ? { duration: 0.01 }
                    : { type: 'spring', stiffness: 430, damping: 38 }}
                />
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </>
  );
}

export function Sidebar() {
  return (
    <>
      <div className="mb-3 lg:hidden">
        <div className="flex items-center justify-between px-1 pb-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white">Atlas</p>
          <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-500">Less noise. More intention.</p>
        </div>
        <nav aria-label="Primary navigation" className="compact-navigation -mx-4 flex gap-1 overflow-x-auto border-y border-white/[0.08] px-4 py-2 sm:-mx-6 sm:px-6">
          <NavigationLinks compact />
        </nav>
      </div>

      <aside className="sticky top-6 hidden h-[calc(100vh-48px)] w-[220px] shrink-0 flex-col border-r border-white/10 pr-6 lg:flex">
        <div className="px-3 py-2">
          <h1 className="font-medium uppercase tracking-[0.28em] text-white">Atlas</h1>
        </div>
        <nav aria-label="Primary navigation" className="app-sidebar-navigation mt-8 space-y-1">
          <NavigationLinks />
        </nav>
        <p className="mt-auto px-3 pb-2 text-[11px] leading-5 text-zinc-600">Less noise. More intention.</p>
      </aside>
    </>
  );
}
