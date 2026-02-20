import React, { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

interface PostGigModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: {
        id: string;
        title: string;
        time: string;
        location: string;
        timestamp: number; // seconds
    };
}

import { useToast } from '../../context/ToastContext';

export const PostGigModal: React.FC<PostGigModalProps> = ({ isOpen, onClose, session }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const [offerPrice, setOfferPrice] = useState('50');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            showToast("Login required to post gigs", "error");
            return;
        }
        setIsSubmitting(true);

        try {
            const gigData = {
                type: 'sub_coach',
                eventId: session.id,
                venueName: session.location,
                startTime: { seconds: session.timestamp, nanoseconds: 0 },
                endTime: { seconds: session.timestamp + 7200, nanoseconds: 0 },
                pay_rate_cents: Math.round(parseFloat(offerPrice) * 100),
                postedByUserId: user.uid,
                status: 'open',
                requirements: ['Verified Coach'],
                description: notes || `Cover needed for ${session.title}`,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'gigs'), gigData);
            showToast(`Gig Posted! We sent an alert to qualified coaches.`, 'success');
            onClose();
        } catch (error) {
            console.error("Error posting gig:", error);
            showToast("Failed to post gig", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center border border-yellow-500/30">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white font-heading italic">Request a Sub</h2>
                            <p className="text-xs text-text-muted">Post this session to the Gig Marketplace.</p>
                        </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                        <h3 className="text-white font-bold mb-1">{session.title}</h3>
                        <p className="text-sm text-text-muted">{session.time} • {session.location}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Offer Price ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="number"
                                    value={offerPrice}
                                    onChange={(e) => setOfferPrice(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white font-mono font-bold focus:outline-none focus:border-primary transition-colors"
                                    placeholder="50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Notes for Sub</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-primary transition-colors h-24 resize-none"
                                placeholder="e.g. Focus on defense drills, key code is 1234..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 mt-4"
                        >
                            {isSubmitting ? 'Posting...' : 'Post Gig & Notify Coaches'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
