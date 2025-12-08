/**
 * Test Mode Context
 *
 * Provides test mode state and utilities throughout the app.
 * Reads testflag from URL and manages confirmation flow.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode, type FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmExecutionModal } from '../components/ConfirmExecutionModal';
import { api } from '../services/api/client';

export type TestMode = 0 | 1 | 2;

interface RouteTrace {
  '🔍 ROUTE TRACE': {
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
  };
}

interface PendingExecution {
  toolName: string;
  toolParams: Record<string, unknown>;
  provider: string | null;
  routeTrace: RouteTrace;
}

interface TestModeContextValue {
  testMode: TestMode;
  isTestMode: boolean;
  requiresConfirmation: boolean;
  executeMCPWithTestMode: (
    toolName: string,
    toolParams: Record<string, unknown>,
    options?: {
      provider?: string;
      inputSource?: 'command' | 'chat' | 'voice' | 'api';
      originalInput?: string;
    }
  ) => Promise<{ success: boolean; data?: unknown; error?: string }>;
}

const TestModeContext = createContext<TestModeContextValue | null>(null);

export const TestModeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams] = useSearchParams();
  const [testMode, setTestMode] = useState<TestMode>(0);
  const [pendingExecution, setPendingExecution] = useState<PendingExecution | null>(null);
  const [pendingResolver, setPendingResolver] = useState<{
    resolve: (result: { success: boolean; data?: unknown; error?: string }) => void;
  } | null>(null);

  // Read testflag from URL
  useEffect(() => {
    const flag = searchParams.get('testflag');
    if (flag === '1') {
      setTestMode(1);
      console.log(
        '%c🔧 TEST MODE 1 ACTIVE: Console logging enabled',
        'background: #00aa00; color: white; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
      );
    } else if (flag === '2') {
      setTestMode(2);
      console.log(
        '%c🔧 TEST MODE 2 ACTIVE: Console logging + confirmation popup',
        'background: #ffaa00; color: black; font-weight: bold; font-size: 14px; padding: 4px 8px; border-radius: 4px;'
      );
    } else {
      setTestMode(0);
    }
  }, [searchParams]);

  // Log route trace to console
  const logRouteTrace = useCallback((trace: RouteTrace) => {
    const data = trace['🔍 ROUTE TRACE'];
    console.group('%c🔍 ROUTE TRACE', 'color: #00aaff; font-weight: bold; font-size: 12px;');
    console.log('%cPath:', 'color: #888; font-weight: bold;', data.path);
    console.log('%cRequest ID:', 'color: #888;', data.request_id);
    console.log('%cTimestamp:', 'color: #888;', data.timestamp);
    console.log('%cDetails:', 'color: #888; font-weight: bold;');
    console.table({
      'Input Source': data.details.input_source,
      'Original Input': data.details.original_input,
      'Detected Intent': data.details.detected_intent,
      'Detected Provider': data.details.detected_provider || '(auto)',
      'Selected MCP': data.details.selected_mcp,
      'Tool Name': data.details.tool_name,
    });
    console.log('%cTool Params:', 'color: #888; font-weight: bold;');
    console.log(data.details.tool_params);
    console.groupEnd();
  }, []);

  // Execute MCP tool with test mode handling
  const executeMCPWithTestMode = useCallback(
    async (
      toolName: string,
      toolParams: Record<string, unknown>,
      options: {
        provider?: string;
        inputSource?: 'command' | 'chat' | 'voice' | 'api';
        originalInput?: string;
      } = {}
    ): Promise<{ success: boolean; data?: unknown; error?: string }> => {
      try {
        const result = await api.executeMCPTool(toolName, toolParams, {
          ...options,
          testMode: testMode,
        });

        // Log route trace if present (testMode >= 1)
        if (result.route_trace) {
          logRouteTrace(result.route_trace);
        }

        // If requires confirmation (testMode = 2), show popup
        if (result.requires_confirmation) {
          return new Promise((resolve) => {
            setPendingExecution({
              toolName,
              toolParams,
              provider: options.provider || null,
              routeTrace: result.route_trace,
            });
            setPendingResolver({ resolve });
          });
        }

        return {
          success: result.success,
          data: result.data,
          error: result.error,
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
      }
    },
    [testMode, logRouteTrace]
  );

  // Handle confirmation
  const handleConfirm = useCallback(async () => {
    if (!pendingExecution || !pendingResolver) return;

    console.log('%c✅ Execution confirmed by user', 'color: #00ff00; font-weight: bold;');

    try {
      const result = await api.confirmMCPExecution(
        pendingExecution.toolName,
        pendingExecution.toolParams,
        pendingExecution.provider || undefined
      );

      pendingResolver.resolve({
        success: result.success,
        data: result.data,
        error: result.error,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Confirmation failed';
      pendingResolver.resolve({ success: false, error: message });
    }

    setPendingExecution(null);
    setPendingResolver(null);
  }, [pendingExecution, pendingResolver]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (!pendingResolver) return;

    console.log('%c❌ Execution cancelled by user', 'color: #ff0000; font-weight: bold;');

    pendingResolver.resolve({
      success: false,
      error: 'Execution cancelled by user',
    });

    setPendingExecution(null);
    setPendingResolver(null);
  }, [pendingResolver]);

  const value: TestModeContextValue = {
    testMode,
    isTestMode: testMode > 0,
    requiresConfirmation: testMode === 2,
    executeMCPWithTestMode,
  };

  // Format route trace for modal
  const modalRouteTrace = pendingExecution?.routeTrace
    ? {
        request_id: pendingExecution.routeTrace['🔍 ROUTE TRACE'].request_id,
        timestamp: pendingExecution.routeTrace['🔍 ROUTE TRACE'].timestamp,
        path: pendingExecution.routeTrace['🔍 ROUTE TRACE'].path,
        details: pendingExecution.routeTrace['🔍 ROUTE TRACE'].details,
        test_mode: pendingExecution.routeTrace['🔍 ROUTE TRACE'].test_mode,
      }
    : null;

  return (
    <TestModeContext.Provider value={value}>
      {children}
      <ConfirmExecutionModal
        isOpen={!!pendingExecution}
        routeTrace={modalRouteTrace}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </TestModeContext.Provider>
  );
};

export const useTestModeContext = (): TestModeContextValue => {
  const context = useContext(TestModeContext);
  if (!context) {
    throw new Error('useTestModeContext must be used within TestModeProvider');
  }
  return context;
};
