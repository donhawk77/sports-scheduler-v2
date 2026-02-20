import React, { useState, useEffect } from 'react';
import { X, Zap, Clock, DollarSign } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface FlashDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCourt?: string;
    courts?: { name: string }[];
}

export const FlashDealModal: React.FC<FlashDealModalProps> = ({ isOpen, onClose, initialCourt, courts = [] }) => {
    const { showToast } = useToast();
    const [dealData, setDealData] = useState({
        court: initialCourt || courts[0]?.name || 'Main Court',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '20:00',
        discount: 50,
        price: 40,
        duration: '60' // Added duration to dealData
    });

    // Local state for UI interactions if needed, or derived from dealData
    const [duration, setDuration] = useState('60');

    // Sync props to state
    useEffect(() => {
        if (isOpen) {
            if (initialCourt) {
                setDealData(prev => ({ ...prev, court: initialCourt }));
            } else if (courts.length > 0) {
                setDealData(prev => ({ ...prev, court: courts[0].name }));
            }
        }
    }, [isOpen, initialCourt, courts]);

    if (!isOpen) return null;

    const handleLaunch = () => {
        showToast(`Flash Deal Launched for ${dealData.court}!`, "success");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all animate-fade-in-up">

                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <Zap className="w-24 h-24 text-black rotate-12" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black italic text-white tracking-tighter uppercase">Flash Deal</h2>
                                <p className="text-black/60 font-bold text-xs uppercase tracking-wider mt-1">Fill empty slots fast</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    {/* Target Court */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Target Court</label>
                        <select
                            value={dealData.court}
                            onChange={(e) => setDealData({ ...dealData, court: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold focus:outline-none focus:border-primary appearance-none"
                        >
                            {courts.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            {courts.length === 0 && <option>Main Court</option>}
                        </select>
                    </div>

                    {/* Time Slot Selection */}
                    <div>
                        <label className="text-xs font-bold uppercase text-text-muted mb-3 block">Select Time Slot</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['18:00', '19:00', '20:00'].map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setDealData({ ...dealData, startTime: time })}
                                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${dealData.startTime === time
                                        ? 'bg-primary text-black border-primary'
                                        : 'bg-white/5 text-white border-white/10 hover:border-white/30'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-text-muted mb-2 block">Duration</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <select
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm font-bold focus:outline-none focus:border-primary appearance-none"
                                >
                                    <option value="60">60 Min</option>
                                    <option value="90">90 Min</option>
                                    <option value="120">120 Min</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-text-muted mb-2 block">Discount</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <select
                                    value={dealData.discount}
                                    onChange={(e) => setDealData({ ...dealData, discount: Number(e.target.value) })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm font-bold focus:outline-none focus:border-primary appearance-none"
                                >
                                    <option value="25">25% Off</option>
                                    <option value="50">50% Off</option>
                                    <option value="75">75% Off</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex justify-between items-center">
                        <span className="text-green-500 text-xs font-bold uppercase tracking-wider">Potential Revenue</span>
                        <span className="text-white font-black text-xl">$40.00</span>
                    </div>

                    <button
                        onClick={handleLaunch}
                        className="w-full py-4 bg-white text-black font-black italic text-lg rounded-xl hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2"
                    >
                        <Zap className="w-5 h-5 fill-black" /> LAUNCH DEAL
                    </button>
                </div>
            </div>
        </div>
    );
};
