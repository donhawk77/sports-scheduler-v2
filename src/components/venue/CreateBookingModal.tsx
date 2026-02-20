import React, { useState } from 'react';
import { X, Calendar, Clock, User, ChevronDown, DollarSign } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import type { BookingData } from './EditBookingModal';

interface CreateBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (booking: BookingData) => void;
    courts?: { name: string }[];
    initialDate?: Date;
    initialTime?: string; // "14" for 2 PM
}

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({
    isOpen,
    onClose,
    onCreate,
    courts = [],
    initialDate = new Date(),
    initialTime = '12'
}) => {
    const { showToast } = useToast();

    // Form State
    const [title, setTitle] = useState('Team Practice');
    const [coach, setCoach] = useState('');
    const [court, setCourt] = useState(courts[0]?.name || 'Main Court');
    const [date, setDate] = useState(initialDate.toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState(`${initialTime}:00`);
    const [duration, setDuration] = useState('1.5'); // hours
    const [price, setPrice] = useState('15'); // Default price


    // Reset form when opening if needed (simplified here)
    React.useEffect(() => {
        if (isOpen) {
            setDate(initialDate.toISOString().split('T')[0]);
            setStartTime(`${initialTime}:00`);
            if (courts.length > 0) setCourt(courts[0].name);
        }
    }, [isOpen, initialDate, initialTime, courts]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) {
            showToast("Please fill in all required fields", "error");
            return;
        }

        // Calculate timestamps
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(start.getTime() + parseFloat(duration) * 60 * 60 * 1000);

        const newBooking: BookingData = {
            id: Date.now().toString(),
            title,
            coach: coach || 'Unassigned',
            courtName: court,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            price: parseFloat(price) // Include price in data
        };

        onCreate(newBooking);
        showToast("Booking created successfully!", "success");
        onClose();

        // Reset sensitive fields
        setCoach('');
        setTitle('Team Practice');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative max-h-[85vh] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white tracking-tight">New Booking</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Activity Type / Title */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Activity Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white focus:border-primary outline-none transition-colors"
                            placeholder="e.g. Varsity Scrimmage"
                        />
                    </div>

                    {/* Coach Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Coach / Organizer (Optional)</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                            <input
                                type="text"
                                value={coach}
                                onChange={(e) => setCoach(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-xl p-3 pl-9 text-white focus:border-primary outline-none transition-colors"
                                placeholder="Coach Name"
                            />
                        </div>
                    </div>

                    {/* Court Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Court</label>
                        <div className="relative">
                            <select
                                value={court}
                                onChange={(e) => setCourt(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white focus:border-primary outline-none appearance-none"
                            >
                                {courts.length > 0 ? (
                                    courts.map(c => <option key={c.name} value={c.name}>{c.name}</option>)
                                ) : (
                                    <>
                                        <option>Main Court</option>
                                        <option>Court 2</option>
                                        <option>Practice Gym</option>
                                    </>
                                )}
                            </select>
                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-white/40 pointer-events-none" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full bg-black/40 border border-white/20 rounded-xl p-3 pl-9 text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>

                        {/* Start Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Start Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-black/40 border border-white/20 rounded-xl p-3 pl-9 text-white focus:border-primary outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Price per Player ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3.5 w-4 h-4 text-white/40" />
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-xl p-3 pl-9 text-white focus:border-green-500 outline-none transition-colors font-bold"
                                placeholder="20"
                            />
                        </div>
                        <p className="text-[10px] text-green-500 font-medium italic">
                            Keep it fair! Affordable sessions (under $20) fill up 3x faster.
                        </p>
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Duration</label>
                        <div className="flex gap-2">
                            {['1', '1.5', '2'].map((d) => (
                                <button
                                    type="button"
                                    key={d}
                                    onClick={() => setDuration(d)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${duration === d
                                        ? 'bg-primary text-black'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {d}h
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-sm transition-colors"
                        >
                            Create Booking
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
