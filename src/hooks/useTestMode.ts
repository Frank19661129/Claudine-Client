/**
 * Test Mode Hook
 *
 * Reads testflag from URL and provides test mode utilities.
 *
 * Usage in URL:
 * - ?testflag=0 or no flag: Normal mode
 * - ?testflag=1: Console logging + execute
 * - ?testflag=2: Console logging + confirmation popup before execute
 */
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type TestMode = 0 | 1 | 2;

interface RouteTrace {
  request_id: string;
  timestamp: string;
  path: string;
  details: {
    input_source: string;
    original_input: string;
    detected_intent: string;
    detected_provider: string | null;
    selected_mcp: string;
    tool_name: string;
    tool_params: Record<string, unknown>;
  };
  test_mode: number;
}

interface PendingExecution {
  id: string;
  tool_name: string;
  tool_params: Record<string, unknown>;
  provider: string | null;
  route_trace: RouteTrace;
  resolve: (confirmed: boolean) => void;
}

interface UseTestModeResult {
  testMode: TestMode;
  isTestMode: boolean;
  requiresConfirmation: boolean;
  pendingExecution: PendingExecution | null;
  logRouteTrace: (trace: RouteTrace) => void;
  requestConfirmation: (execution: Omit<PendingExecution, 'resolve'>) => Promise<boolean>;
  confirmExecution: () => void;
  cancelExecution: () => void;
}

export const useTestMode = (): UseTestModeResult => {
  const [searchParams] = useSearchParams();
  const [testMode, setTestMode] = useState<TestMode>(0);
  const [pendingExecution, setPendingExecution] = useState<PendingExecution | null>(null);

  // Read testflag from URL on mount and when URL changes
  useEffect(() => {
    const flag = searchParams.get('testflag');
    if (flag === '1') {
      setTestMode(1);
      console.log('%c🔧 TEST MODE 1: Console logging enabled', 'color: #00ff00; font-weight: bold; font-size: 14px;');
    } else if (flag === '2') {
      setTestMode(2);
      console.log('%c🔧 TEST MODE 2: Console logging + confirmation enabled', 'color: #ffaa00; font-weight: bold; font-size: 14px;');
    } else {
      setTestMode(0);
    }
  }, [searchParams]);

  // Log route trace to console
  const logRouteTrace = useCallback((trace: RouteTrace) => {
    if (testMode === 0) return;

    console.group('%c🔍 ROUTE TRACE', 'color: #00aaff; font-weight: bold; font-size: 12px;');
    console.log('%cPath:', 'color: #888; font-weight: bold;', trace.path);
    console.log('%cRequest ID:', 'color: #888;', trace.request_id);
    console.log('%cTimestamp:', 'color: #888;', trace.timestamp);
    console.log('%cDetails:', 'color: #888; font-weight: bold;');
    console.table({
      'Input Source': trace.details.input_source,
      'Original Input': trace.details.original_input,
      'Detected Intent': trace.details.detected_intent,
      'Detected Provider': trace.details.detected_provider || '(auto)',
      'Selected MCP': trace.details.selected_mcp,
      'Tool Name': trace.details.tool_name,
    });
    console.log('%cTool Params:', 'color: #888; font-weight: bold;');
    console.log(trace.details.tool_params);
    console.groupEnd();
  }, [testMode]);

  // Request confirmation (for testMode=2)
  const requestConfirmation = useCallback((execution: Omit<PendingExecution, 'resolve'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setPendingExecution({
        ...execution,
        resolve: (confirmed: boolean) => {
          setPendingExecution(null);
          resolve(confirmed);
        },
      });
    });
  }, []);

  // Confirm the pending execution
  const confirmExecution = useCallback(() => {
    if (pendingExecution) {
      console.log('%c✅ Execution confirmed by user', 'color: #00ff00; font-weight: bold;');
      pendingExecution.resolve(true);
    }
  }, [pendingExecution]);

  // Cancel the pending execution
  const cancelExecution = useCallback(() => {
    if (pendingExecution) {
      console.log('%c❌ Execution cancelled by user', 'color: #ff0000; font-weight: bold;');
      pendingExecution.resolve(false);
    }
  }, [pendingExecution]);

  return {
    testMode,
    isTestMode: testMode > 0,
    requiresConfirmation: testMode === 2,
    pendingExecution,
    logRouteTrace,
    requestConfirmation,
    confirmExecution,
    cancelExecution,
  };
};

// Store for global test mode state (for use outside React components)
let globalTestMode: TestMode = 0;

export const setGlobalTestMode = (mode: TestMode): void => {
  globalTestMode = mode;
};

export const getGlobalTestMode = (): TestMode => {
  return globalTestMode;
};
