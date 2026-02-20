import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface BookingData {
    id: string;
    coach: string;
    title: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    courtName: string;
    price?: number;
}

interface EditBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BookingData | null;
    onUpdate: (updatedBooking: BookingData) => void;
    onCancel: (bookingId: string) => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
    isOpen,
    onClose,
    booking,
    onUpdate,
    onCancel
}) => {
    const { showToast } = useToast();
    const [mode, setMode] = useState<'view' | 'edit' | 'cancel'>('view');
    const [cancelReason, setCancelReason] = useState('');
    const [confirmText, setConfirmText] = useState('');

    // Derived state for formatting
    const startDate = booking ? new Date(booking.startTime) : new Date();
    const isLastMinute = React.useMemo(() => {
        if (!booking) return false;
        const now = new Date();
        const diffInHours = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffInHours < 4 && diffInHours > 0;
    }, [booking]);

    // Silence unused warning for now
    React.useEffect(() => {
        // Todo: Implement update logic
        console.log("Update handler ready:", !!onUpdate);
    }, [onUpdate]);

    if (!isOpen || !booking) return null;

    const handleCancelSubmit = () => {
        if (isLastMinute && confirmText !== 'CANCEL') {
            showToast("Please type CANCEL to confirm.", "error");
            return;
        }
        if (isLastMinute && !cancelReason) {
            showToast("A reason is required for last-minute cancellations.", "error");
            return;
        }

        onCancel(booking.id);
        showToast("Booking cancelled.", "info");
        onClose();
    };

    const renderContent = () => {
        if (mode === 'cancel') {
            return (
                <div className="space-y-6 animate-fade-in-up">
                    <div className={`p-4 rounded-xl border ${isLastMinute ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            {isLastMinute ? <ShieldAlert className="w-6 h-6 text-red-500" /> : <AlertTriangle className="w-6 h-6 text-yellow-500" />}
                            <h3 className={`font-bold ${isLastMinute ? 'text-red-500' : 'text-white'}`}>
                                {isLastMinute ? 'High Impact Cancellation' : 'Cancel Booking?'}
                            </h3>
                        </div>
                        <p className="text-sm text-text-muted">
                            {isLastMinute
                                ? "This booking starts in less than 4 hours. Cancelling now will negatively impact your venue's reliability score and may incur a penalty fee."
                                : "Are you sure you want to cancel this booking? The coach will be notified immediately."
                            }
                        </p>
                    </div>

                    {isLastMinute && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-text-muted">Reason for Cancellation</label>
                                <select
                                    className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white focus:border-red-500 outline-none"
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                >
                                    <option value="">Select a reason...</option>
                                    <option value="maintenance">Emergency Maintenance</option>
                                    <option value="safety">Safety Hazard</option>
                                    <option value="error">Booking Error</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-text-muted">Type 'CANCEL' to confirm</label>
                                <input
                                    className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white focus:border-red-500 outline-none"
                                    placeholder="CANCEL"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                />
                            </div>
                        </>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setMode('view')}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleCancelSubmit}
                            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
                        >
                            Confirm Cancellation
                        </button>
                    </div>
                </div>
            );
        }

        // View Mode (Default)
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black font-bold text-xl">
                        {booking.coach.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">{booking.title}</h3>
                        <p className="text-primary text-sm font-bold">{booking.coach}</p>
                        {booking.price && (
                            <p className="text-xs text-text-muted mt-1">
                                ${booking.price} / player
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase mb-1">
                            <Calendar className="w-3 h-3" /> Date
                        </div>
                        <p className="text-white font-bold">{startDate.toLocaleDateString()}</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase mb-1">
                            <Clock className="w-3 h-3" /> Time
                        </div>
                        <p className="text-white font-bold">
                            {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                            {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex gap-3">
                    <button
                        onClick={() => showToast("Edit feature coming next sprint", "info")}
                        className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
                    >
                        Edit Details
                    </button>
                    <button
                        onClick={() => setMode('cancel')}
                        className="flex-1 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 font-bold text-sm transition-colors"
                    >
                        Cancel Booking
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white tracking-tight">Manage Booking</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
