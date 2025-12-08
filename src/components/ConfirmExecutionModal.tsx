/**
 * Confirmation Modal for Test Mode 2
 *
 * Shows route trace and asks user to confirm execution.
 */
import type { FC } from 'react';

interface ConfirmExecutionModalProps {
  isOpen: boolean;
  toolName: string;
  toolParams: Record<string, unknown>;
  provider?: string | null;
  content: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmExecutionModal: FC<ConfirmExecutionModalProps> = ({
  isOpen,
  toolName,
  toolParams,
  provider,
  content,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-card-border bg-amber-50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <h2 className="text-lg font-medium text-navy">Test Mode: Bevestig Uitvoering</h2>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            De volgende actie staat klaar om uitgevoerd te worden.
          </p>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {/* Tool Info */}
          <div className="mb-4 p-3 bg-gray-900 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🔧</span>
              <span className="font-mono text-green-400 text-sm">{toolName}</span>
              {provider && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  {provider}
                </span>
              )}
            </div>
          </div>

          {/* Tool Params */}
          <div className="mt-3">
            <div className="text-xs text-text-muted uppercase tracking-widest mb-2">Tool Parameters</div>
            <pre className="p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto font-mono">
              {JSON.stringify(toolParams, null, 2)}
            </pre>
          </div>

          {/* Question */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Wil je deze actie daadwerkelijk uitvoeren?
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-card-border bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-600 text-white rounded-button hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            Nee, annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-button hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Bezig...</span>
              </>
            ) : (
              <>
                <span>✓</span>
                <span>Ja, doorvoeren</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
