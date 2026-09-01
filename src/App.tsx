import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FocusPage } from './pages/FocusPage';
import { HealthPage } from './pages/HealthPage';
import { JournalPage } from './pages/JournalPage';
import { SavingsPage } from './pages/SavingsPage';
import { SettingsPage } from './pages/SettingsPage';
import { StreaksPage } from './pages/StreaksPage';
import { GoalsPage } from './pages/GoalsPage';
import { NotesPage } from './pages/NotesPage';
import { FocusProvider } from './features/focus/FocusContext';
import { HealthProvider } from './features/health/HealthContext';
import { JournalProvider } from './features/journal/JournalContext';
import { SettingsProvider, useSettingsContext } from './features/settings/SettingsContext';
import { StreakProvider } from './features/streaks/StreakContext';
import { SavingsProvider } from './features/savings/SavingsContext';
import { GoalsProvider } from './features/goals/GoalsContext';
import { NotesProvider } from './features/notes/NotesContext';
import { GamificationProvider } from './features/gamification/GamificationContext';

function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <FocusProvider>
          <HealthProvider>
            <JournalProvider>
              <StreakProvider>
                <SavingsProvider>
                  <GoalsProvider>
                    <NotesProvider>
                      <GamificationProvider>
                        <AppShell>
                          <AppRoutes />
                        </AppShell>
                      </GamificationProvider>
                    </NotesProvider>
                  </GoalsProvider>
                </SavingsProvider>
              </StreakProvider>
            </JournalProvider>
          </HealthProvider>
        </FocusProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { startupPage } = useSettingsContext();

  return (
    <Routes>
      <Route path="/" element={<Navigate replace to={startupPage} />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/focus" element={<FocusPage />} />
      <Route path="/health" element={<HealthPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/streaks" element={<StreaksPage />} />
      <Route path="/savings" element={<SavingsPage />} />
      <Route path="/goals" element={<GoalsPage />} />
      <Route path="/notes" element={<NotesPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate replace to={startupPage} />} />
    </Routes>
  );
}

export default App;
