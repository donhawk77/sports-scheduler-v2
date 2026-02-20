import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, Clock, DollarSign, CheckCircle, ArrowLeft, Share2, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShareSheet } from '../components/ui/ShareSheet';
import type { Gig } from '../types/schema';

export const GigBoardView: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [gigs, setGigs] = useState<Gig[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'high_pay' | 'urgent'>('all');

    // Share State
    const [shareConfig, setShareConfig] = useState<{ isOpen: boolean, title: string, text: string } | null>(null);

    const fetchGigs = React.useCallback(async () => {
        setLoading(true);
        try {
            const gigsRef = collection(db, 'gigs');
            // Show only open gigs
            const q = query(
                gigsRef,
                where('status', '==', 'open'),
                orderBy('startTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            const fetchedGigs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Gig[];
            setGigs(fetchedGigs);
        } catch (error) {
            console.error('Error fetching gigs:', error);
            showToast('Failed to load gigs', 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchGigs();
    }, [fetchGigs]);

    const handleClaim = async (gigId: string) => {
        if (!user) {
            showToast('Please login to claim gigs', 'info');
            navigate('/login');
            return;
        }

        if (confirm('Are you sure you want to claim this gig?')) {
            try {
                const gigRef = doc(db, 'gigs', gigId);

                await runTransaction(db, async (transaction) => {
                    const gigDoc = await transaction.get(gigRef);
                    if (!gigDoc.exists()) {
                        throw new Error('Gig does not exist');
                    }

                    const gigData = gigDoc.data();
                    if (gigData.status !== 'open') {
                        throw new Error('Gig already claimed by someone else');
                    }

                    transaction.update(gigRef, {
                        status: 'claimed',
                        claimedById: user.uid,
                        claimedAt: Timestamp.now()
                    });
                });

                showToast('Gig Claimed! The head coach has been notified.', 'success');
                fetchGigs(); // Refresh list
            } catch (error: any) {
                console.error('Error claiming gig:', error);
                const message = error.message === 'Gig already claimed by someone else'
                    ? error.message
                    : 'Failed to claim gig. Please try again.';
                showToast(message, 'error');
                fetchGigs(); // Refresh to show current status
            }
        }
    };

    const openShare = (gig: Gig) => {
        setShareConfig({
            isOpen: true,
            title: `Gig Opportunity: ${gig.venueName}`,
            text: `Check out this gig at ${gig.venueName}! Pay: $${(gig.pay_rate_cents / 100).toFixed(0)}.`
        });
    };

    const filteredGigs = gigs.filter(g => {
        if (filter === 'high_pay') return g.pay_rate_cents >= 5000;
        if (filter === 'urgent') {
            const now = Date.now() / 1000;
            return (g.startTime.seconds - now) < 86400; // < 24h
        }
        return true;
    });

    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 max-w-5xl mx-auto flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 animate-fade-in-down">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-black italic tracking-tighter text-white">GigMarket</h1>
                        <p className="text-text-muted text-sm tracking-widest uppercase">Available Opportunities</p>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold uppercase">
                    {user?.email?.substring(0, 2) || 'G'}
                </div>
            </header>

            {/* Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-fade-in-up delay-100">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-primary text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                >
                    All Gigs
                </button>
                <button
                    onClick={() => setFilter('high_pay')}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'high_pay' ? 'bg-primary text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                >
                    High Pay ($50+)
                </button>
                <button
                    onClick={() => setFilter('urgent')}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filter === 'urgent' ? 'bg-primary text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                >
                    Urgent (24h)
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up delay-200">
                    {filteredGigs.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-white/40">
                            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No gigs found matching your criteria.</p>
                        </div>
                    ) : (
                        filteredGigs.map(gig => (
                            <div key={gig.id} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-yellow-500/50 transition-colors group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <DollarSign className="w-24 h-24 text-yellow-500 transform -rotate-12" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${gig.type === 'sub_coach' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {gig.type === 'sub_coach' ? 'Coach Sub' : 'Officiating'}
                                        </span>
                                        <div className="flex items-center text-yellow-500 font-black text-xl">
                                            ${(gig.pay_rate_cents / 100).toFixed(0)}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">{gig.venueName}</h3>

                                    <div className="space-y-2 mb-6">
                                        <p className="text-sm text-text-muted flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {new Date(gig.startTime.seconds * 1000).toLocaleDateString()} • {new Date(gig.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm text-text-muted flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {gig.venueName}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {gig.requirements.map((req, i) => (
                                            <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60 border border-white/5">
                                                {req}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleClaim(gig.id)}
                                            className="flex-1 py-3 bg-white/5 hover:bg-yellow-500 hover:text-black text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-yellow-500"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Claim Gig
                                        </button>
                                        <button
                                            onClick={() => openShare(gig)}
                                            className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
                                            title="Share Deal"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {shareConfig && (
                <ShareSheet
                    isOpen={shareConfig.isOpen}
                    onClose={() => setShareConfig(null)}
                    title={shareConfig.title}
                    text={shareConfig.text}
                />
            )}
        </div>
    );
};
