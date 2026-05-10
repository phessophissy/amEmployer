'use client';

interface EmptyStateProps {
  message?: string;
  subtext?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ message = 'Nothing here yet', subtext, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg font-semibold text-gray-200">{message}</p>
      {subtext && <p className="mt-2 text-sm text-gray-400">{subtext}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
