import React, { useState } from 'react';
import { Shield, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

interface AdminEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdminEntryModal: React.FC<AdminEntryModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    if (!isOpen) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Security update: We no longer accept generic passwords to set a local bypass.
        // The RequireAuth component will check Firestore roles and SuperUser emails.
        showToast('Verifying Admin Credentials...', 'info');

        setTimeout(() => {
            navigate('/admin');
            onClose();
            setLoading(false);
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5 text-zinc-400" />
                </button>

                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-xl font-bold text-white mb-2">Restricted Access</h2>
                    <p className="text-sm text-zinc-400 mb-6">
                        Enter administrative credentials to proceed.
                    </p>

                    <form onSubmit={handleLogin} className="w-full space-y-4">
                        <div className="relative mb-4">
                            <p className="text-white text-sm">Proceeding will verify your account roles.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Verify Access
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
