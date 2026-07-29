import { X, AlertTriangle, CheckCircle, Ban } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  action: 'approve' | 'reject' | 'withdraw';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const actionConfig = {
  approve: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-600',
    confirmText: 'Approve',
    confirmClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  reject: {
    icon: Ban,
    iconBg: 'bg-rose-600',
    confirmText: 'Reject',
    confirmClass: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  withdraw: {
    icon: CheckCircle,
    iconBg: 'bg-blue-600',
    confirmText: 'Mark Paid',
    confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
};

export default function ConfirmModal({ isOpen, title, message, action, onConfirm, onCancel, loading }: ConfirmModalProps) {
  if (!isOpen) return null;

  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onCancel}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-scale-in border border-slate-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.iconBg}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500">Confirm your action</p>
            </div>
          </div>
          <button onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{message}</p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${config.confirmClass}`}>
            {loading ? 'Processing...' : config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
