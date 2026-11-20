import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className="fixed bottom-5 right-5 z-50 max-w-sm no-print"
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-md ${
          isSuccess
            ? 'border-[#BFE0D9] bg-[#E7F3F0] text-[#1D4E46]'
            : 'border-[#F2C7C5] bg-[#FDF1F0] text-[#8F2A25]'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <p className="text-sm font-medium leading-snug">{toast.text}</p>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="알림 닫기"
          className="ml-1 shrink-0 rounded-lg p-0.5 opacity-70 hover:opacity-100 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
