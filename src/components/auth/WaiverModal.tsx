import React, { useState } from 'react';
import { X, ShieldCheck, ScrollText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../context/ToastContext';

interface WaiverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const WaiverModal: React.FC<WaiverModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user, userData } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    if (!isOpen) return null;

    const handleAgree = async () => {
        if (!user) return;

        // Optional: Force scroll (though strict implementations require it, UX wise prompt is often enough)
        // if (!scrolledToBottom) {
        //     showToast("Please scroll to the read the entire waiver", "error");
        //     return;
        // }

        setLoading(true);
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                waiverAgreed: true,
                waiverAgreedAt: Timestamp.now()
            });

            // Optimistic update handled by context usually, but we can just callback
            showToast("Waiver acknowledged", "success");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error signing waiver:", error);
            showToast("Failed to record waiver. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl animate-fade-in-up">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-zinc-900/50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Liability Waiver & Release</h2>
                            <p className="text-xs text-text-muted">Required before participation</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div
                    className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-gray-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                >
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-4">
                        <p className="text-red-400 font-bold flex items-center gap-2">
                            <ScrollText className="w-4 h-4" />
                            PLEASE READ CAREFULLY
                        </p>
                    </div>

                    <p>
                        <strong>1. NATURE OF THE ACTIVITY:</strong> I understand that participation in sports training, games, and related activities involves inherent risks, including but not limited to physical injury, strain, contact with other players, and equipment failure.
                    </p>

                    <p>
                        <strong>2. RELEASE OF LIABILITY:</strong> I hereby release, indemnify, and hold harmless <strong>SportsScheduler</strong> ("The Platform"), its operators, venue owners, coaches, and affiliates from any and all claims, demands, or causes of action arising out of my participation in any event booked through this platform.
                    </p>

                    <p>
                        <strong>3. PLATFORM ROLE:</strong> I acknowledge that SportsScheduler acts solely as a booking and scheduling intermediary. The Platform does not own, operate, or maintain the venues, nor does it employ the coaches or trainers directly. Any dispute regarding facility conditions or coaching services is strictly between the User and the respective Provider (Venue or Coach).
                    </p>

                    <p>
                        <strong>4. MEDICAL CONSENT:</strong> I certify that I am physically fit to participate in these activities and have not been advised otherwise by a qualified medical professional. In the event of an emergency, I authorize venue staff or coaches to secure medical treatment on my behalf.
                    </p>

                    <p>
                        <strong>5. CODE OF CONDUCT:</strong> I agree to abide by all rules and regulations set forth by the specific Venue and Coach. Failure to comply may result in expulsion from the session without refund and potential suspension from the Platform.
                    </p>

                    <p className="text-xs text-text-muted mt-8">
                        By clicking "I Acknowledge & Agree" below, I certify that I have read this document and fully understand its content. I am aware that this is a release of liability and a contract and I sign it of my own free will.
                    </p>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-white/10 bg-zinc-900/50 rounded-b-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-text-muted">
                        Signed as: <span className="text-white font-bold">{userData?.displayName || user?.email}</span>
                    </p>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={onClose}
                            className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 border border-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAgree}
                            disabled={loading}
                            className="flex-1 md:flex-none px-8 py-3 rounded-xl font-bold bg-primary text-black hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : <ShieldCheck className="w-5 h-5" />}
                            I Acknowledge & Agree
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
