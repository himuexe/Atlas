import { useState } from 'react';
import { useLifeContext } from './LifeContext';
import { LifeCurrentSelfSection } from './LifeCurrentSelfSection';
import { LifeDimensionExplorer } from './LifeDimensionExplorer';
import { LifeDashboard } from './LifeDashboard';
import { LifeIdealSelfSection } from './LifeIdealSelfSection';
import { LifeProfileSection } from './LifeProfileSection';
import { LifePersonalityCharacterSection } from './LifePersonalityCharacterSection';
import { LifeReviewsSection } from './LifeReviewsSection';
import { LifeValuesSection } from './LifeValuesSection';

export function LifeFeature() {
  const { isLoading, loadError } = useLifeContext();
  const [requestedDimension, setRequestedDimension] = useState<{ id: string; requestId: number } | null>(null);
  const [dashboardRefreshSignal, setDashboardRefreshSignal] = useState(0);
  const refreshDashboard = () => setDashboardRefreshSignal((current) => current + 1);
  const exploreDimension = (id: string) => {
    setRequestedDimension((current) => ({ id, requestId: (current?.requestId ?? 0) + 1 }));
    document.getElementById('life-dimensions')?.scrollIntoView();
  };

  return (
    <div className="life-feature space-y-6 pb-8">
      <header className="feature-heading border-b border-white/10 pb-8">
        <p className="eyebrow">Life</p>
        <h2 className="page-title mt-4">A life that is yours to shape.</h2>
        <p className="page-copy mt-4 max-w-3xl">
          Take a moment to describe the life you are living and the direction you want to move toward.
          This is a private space for context and reflection—not a score, a test, or a judgment.
        </p>
      </header>
      {loadError ? (
        <p role="alert" className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-4 text-sm text-rose-200">
          {loadError} Your saved records have not been changed.
        </p>
      ) : null}
      {isLoading ? (
        <div role="status" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-zinc-400">
          Preparing your Life space…
        </div>
      ) : (
        <>
          <LifeDashboard onExploreDimension={exploreDimension} refreshSignal={dashboardRefreshSignal} />
          <LifeDimensionExplorer
            requestedDimension={requestedDimension}
            onDataChange={refreshDashboard}
          />
          <LifeProfileSection />
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <LifeCurrentSelfSection />
            <LifeIdealSelfSection />
          </div>
          <LifeReviewsSection />
          <LifeValuesSection />
          <LifePersonalityCharacterSection onDataChange={refreshDashboard} />
        </>
      )}
    </div>
  );
}
