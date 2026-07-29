import { useEffect } from 'react';
import { CheckCircle, Ban, X } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

const typeStyles = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: CheckCircle,
    iconBg: 'bg-emerald-600',
  },
  error: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    icon: Ban,
    iconBg: 'bg-rose-600',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: CheckCircle,
    iconBg: 'bg-blue-600',
  },
};

export default function Toast({ isOpen, type, message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const config = typeStyles[type];
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-[60] animate-slide-in">
      <div className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg ${config.bg} min-w-[320px] max-w-md`}>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full ${config.iconBg} shrink-0`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <p className={`text-sm font-medium ${config.text} flex-1 pt-0.5`}>{message}</p>
        <button onClick={onClose}
          className="rounded p-0.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
