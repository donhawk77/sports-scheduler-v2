import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { Toast, ToastType } from '../../context/ToastContext';

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />
};

const borderColors: Record<ToastType, string> = {
    success: 'border-green-500/50',
    error: 'border-red-500/50',
    info: 'border-blue-500/50',
    warning: 'border-yellow-500/50'
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`min-w-[300px] max-w-md bg-black/90 backdrop-blur-md border ${borderColors[toast.type]} rounded-xl p-4 shadow-xl flex items-start gap-3 animate-fade-in-down`}
                >
                    <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
                    <div className="flex-1">
                        <p className="text-white text-sm font-medium">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => onClose(toast.id)}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};
