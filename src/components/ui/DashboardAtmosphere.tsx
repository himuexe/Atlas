import { useEffect, useRef } from 'react';

/** Loads and owns the decorative, Dashboard-only scene. */
export function DashboardAtmosphere() {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let cancelled = false;
    let disposeScene: (() => void) | undefined;

    void import('./DashboardScene').then(({ mountDashboardScene }) => {
      if (cancelled || !host.isConnected) return;
      disposeScene = mountDashboardScene(host, canvas);
      if (cancelled) disposeScene();
    }).catch(() => {
      // CSS ambience remains visible if WebGL or its optional scene chunk fails.
    });

    return () => {
      cancelled = true;
      disposeScene?.();
    };
  }, []);

  return (
    <div ref={hostRef} className="dashboard-atmosphere" aria-hidden="true">
      <canvas ref={canvasRef} className="dashboard-atmosphere__canvas" />
    </div>
  );
}
