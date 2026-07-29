import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { FocusPage } from './pages/FocusPage';
import { HealthPage } from './pages/HealthPage';
import { JournalPage } from './pages/JournalPage';
import { SettingsPage } from './pages/SettingsPage';
import { StreaksPage } from './pages/StreaksPage';
import { FocusProvider } from './features/focus/FocusContext';
import { HealthProvider } from './features/health/HealthContext';

function App() {
  return (
    <BrowserRouter>
      <FocusProvider>
        <HealthProvider>
          <AppShell>
            <Routes>
              <Route path="/" element={<Navigate replace to="/dashboard" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/focus" element={<FocusPage />} />
              <Route path="/health" element={<HealthPage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/streaks" element={<StreaksPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Routes>
          </AppShell>
        </HealthProvider>
      </FocusProvider>
    </BrowserRouter>
  );
}

export default App;
