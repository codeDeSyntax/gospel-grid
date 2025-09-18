import { useEffect, useRef, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  averageFps: number;
  frameTime: number;
  thumbnailCaptureTime: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  lastUpdate: number;
}

interface PerformanceOptions {
  enabled?: boolean;
  fpsTarget?: number;
  updateInterval?: number;
  historySize?: number;
}

export function usePerformanceMonitor(options: PerformanceOptions = {}) {
  const {
    enabled = true,
    fpsTarget = 60,
    updateInterval = 1000, // 1 second
    historySize = 60, // Keep 1 minute of history
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    averageFps: 0,
    frameTime: 0,
    thumbnailCaptureTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    renderTime: 0,
    lastUpdate: Date.now(),
  });

  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const renderTimesRef = useRef<number[]>([]);
  const thumbnailTimesRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track frame rate
  const trackFrame = useCallback(() => {
    if (!enabled) return;

    const now = performance.now();
    const deltaTime = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    frameTimesRef.current.push(deltaTime);
    if (frameTimesRef.current.length > historySize) {
      frameTimesRef.current.shift();
    }

    animationFrameRef.current = requestAnimationFrame(trackFrame);
  }, [enabled, historySize]);

  // Measure render performance
  const measureRender = useCallback((renderFunction: () => void) => {
    if (!enabled) {
      renderFunction();
      return;
    }

    const startTime = performance.now();
    renderFunction();
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    renderTimesRef.current.push(renderTime);
    if (renderTimesRef.current.length > historySize) {
      renderTimesRef.current.shift();
    }
  }, [enabled, historySize]);

  // Measure thumbnail capture performance
  const measureThumbnailCapture = useCallback(async <T>(
    captureFunction: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    const result = await captureFunction();
    const endTime = performance.now();
    const captureTime = endTime - startTime;

    if (enabled) {
      thumbnailTimesRef.current.push(captureTime);
      if (thumbnailTimesRef.current.length > historySize) {
        thumbnailTimesRef.current.shift();
      }
    }

    return result;
  }, [enabled, historySize]);

  // Calculate performance metrics
  const calculateMetrics = useCallback(() => {
    if (!enabled) return;

    const frameTimes = frameTimesRef.current;
    const renderTimes = renderTimesRef.current;
    const thumbnailTimes = thumbnailTimesRef.current;

    if (frameTimes.length === 0) return;

    // Calculate FPS
    const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    const fps = Math.round(1000 / averageFrameTime);
    const recentFrameTime = frameTimes[frameTimes.length - 1] || 0;
    const instantFps = Math.round(1000 / recentFrameTime);

    // Calculate average render time
    const averageRenderTime = renderTimes.length > 0
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
      : 0;

    // Calculate average thumbnail capture time
    const averageThumbnailTime = thumbnailTimes.length > 0
      ? thumbnailTimes.reduce((sum, time) => sum + time, 0) / thumbnailTimes.length
      : 0;

    // Get memory usage
    let memoryUsage = 0;
    if ('memory' in performance) {
      memoryUsage = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }

    setMetrics({
      fps: instantFps,
      averageFps: fps,
      frameTime: recentFrameTime,
      thumbnailCaptureTime: averageThumbnailTime,
      memoryUsage,
      cpuUsage: 0, // CPU usage would require native implementation
      renderTime: averageRenderTime,
      lastUpdate: Date.now(),
    });
  }, [enabled]);

  // Start monitoring
  useEffect(() => {
    if (!enabled) return;

    // Start frame tracking
    animationFrameRef.current = requestAnimationFrame(trackFrame);

    // Start metrics calculation
    updateTimerRef.current = setInterval(calculateMetrics, updateInterval);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (updateTimerRef.current) {
        clearInterval(updateTimerRef.current);
      }
    };
  }, [enabled, trackFrame, calculateMetrics, updateInterval]);

  // Performance warnings
  const getWarnings = useCallback(() => {
    const warnings: string[] = [];

    if (metrics.fps < fpsTarget * 0.8) {
      warnings.push(`Low FPS: ${metrics.fps} (target: ${fpsTarget})`);
    }

    if (metrics.renderTime > 16) { // 16ms = 60fps threshold
      warnings.push(`Slow renders: ${metrics.renderTime.toFixed(2)}ms`);
    }

    if (metrics.thumbnailCaptureTime > 500) {
      warnings.push(`Slow thumbnails: ${metrics.thumbnailCaptureTime.toFixed(0)}ms`);
    }

    if (metrics.memoryUsage > 200) {
      warnings.push(`High memory: ${metrics.memoryUsage}MB`);
    }

    return warnings;
  }, [metrics, fpsTarget]);

  return {
    metrics,
    measureRender,
    measureThumbnailCapture,
    getWarnings,
    isEnabled: enabled,
  };
}

// Performance dashboard component
export function PerformanceDashboard() {
  const {
    metrics,
    measureRender,
    getWarnings,
    isEnabled,
  } = usePerformanceMonitor({
    enabled: process.env.NODE_ENV === 'development',
    fpsTarget: 60,
    updateInterval: 1000,
  });

  const warnings = getWarnings();

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-2 font-mono">
      <div className="flex justify-between items-center">
        <span className="font-bold">Performance Monitor</span>
        <div className={`w-2 h-2 rounded-full ${
          metrics.fps > 50 ? 'bg-green-500' : 
          metrics.fps > 30 ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-gray-500">FPS</div>
          <div className={`font-bold ${
            metrics.fps > 50 ? 'text-green-600' : 
            metrics.fps > 30 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {metrics.fps} / {metrics.averageFps}
          </div>
        </div>
        
        <div>
          <div className="text-gray-500">Frame Time</div>
          <div>{metrics.frameTime.toFixed(1)}ms</div>
        </div>
        
        <div>
          <div className="text-gray-500">Render Time</div>
          <div className={metrics.renderTime > 16 ? 'text-red-600' : 'text-green-600'}>
            {metrics.renderTime.toFixed(2)}ms
          </div>
        </div>
        
        <div>
          <div className="text-gray-500">Memory</div>
          <div className={metrics.memoryUsage > 150 ? 'text-red-600' : 'text-green-600'}>
            {metrics.memoryUsage}MB
          </div>
        </div>
        
        <div className="col-span-2">
          <div className="text-gray-500">Thumbnail Capture</div>
          <div className={metrics.thumbnailCaptureTime > 500 ? 'text-red-600' : 'text-green-600'}>
            {metrics.thumbnailCaptureTime.toFixed(0)}ms avg
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="border-t border-gray-300 pt-2">
          <div className="text-red-600 font-bold text-xs mb-1">⚠️ Warnings:</div>
          {warnings.map((warning, index) => (
            <div key={index} className="text-red-600 text-xs">
              • {warning}
            </div>
          ))}
        </div>
      )}

      {/* FPS Chart */}
      <div className="border-t border-gray-300 pt-2">
        <div className="text-gray-500 text-xs mb-1">FPS History</div>
        <div className="flex items-end h-8 space-x-0.5">
          {Array.from({ length: 20 }, (_, i) => {
            const height = Math.max((metrics.fps / 60) * 100, 5);
            return (
              <div
                key={i}
                className={`w-1 rounded-t ${
                  height > 80 ? 'bg-green-500' : 
                  height > 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook to measure component render performance
export function useRenderPerformance(componentName: string) {
  const { measureRender } = usePerformanceMonitor();
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current++;
    console.log(`🎨 ${componentName} rendered (count: ${renderCountRef.current})`);
  });

  return {
    measureRender: (renderFn: () => void) => measureRender(renderFn),
    renderCount: renderCountRef.current,
  };
}