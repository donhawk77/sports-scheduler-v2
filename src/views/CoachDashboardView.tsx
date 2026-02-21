import { Calendar, Clock, Plus, Video, Film, MessageSquare, LogOut, Briefcase, Loader2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MediaCaptureOverlay } from '../components/media/MediaCaptureOverlay';
import { PostGigModal } from '../components/gigs/PostGigModal';
import type { MediaClip } from '../types/media';
import type { Event } from '../types/schema';

export const CoachDashboardView: React.FC = () => {
    const navigate = useNavigate();
    const { user, userData, signOut } = useAuth();
    const { showToast } = useToast();
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);
    const [isPostGigOpen, setIsPostGigOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
            showToast('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Failed to logout', 'error');
        }
    };

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoachContent = async () => {
            if (!user) return;
            try {
                const eventsRef = collection(db, 'events');
                // Fetch events organized by this coach
                const q = query(
                    eventsRef,
                    where('organizerId', '==', user.uid),
                    orderBy('startTime', 'asc'),
                    limit(10)
                );
                const querySnapshot = await getDocs(q);
                const fetchedEvents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Event[];
                setEvents(fetchedEvents);
            } catch (error) {
                console.error('Error fetching coach dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCoachContent();
    }, [user]);

    const nextSession = events[0] || null;

    // 1. Save Clip -> Library
    const handleSaveClip = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const newClip: MediaClip = {
            id: Date.now().toString(),
            url: url,
            date: new Date().toISOString(),
            type: 'raw',
            title: 'New Recording'
        };

        const existing = localStorage.getItem('coach_media_library');
        const list = existing ? JSON.parse(existing) : [];
        list.push(newClip);
        localStorage.setItem('coach_media_library', JSON.stringify(list));

        setIsCaptureOpen(false);
        showToast('Clip saved to library', 'success');
    };

    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 max-w-5xl mx-auto flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 animate-fade-in-down">
                <div className="flex items-center gap-4">

                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-black italic tracking-tighter text-white">SportsScheduler</h1>
                        <p className="text-text-muted text-sm tracking-widest uppercase">Coach Dashboard</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/gigs')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-yellow-400 transition-colors border border-white/5"
                        title="Gig Marketplace"
                    >
                        <Briefcase className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => navigate('/coach/library')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                        title="Media Library"
                    >
                        <Film className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => setIsCaptureOpen(true)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-primary transition-colors border border-white/5 hover:border-primary/50"
                        title="Record Clip"
                    >
                        <Video className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors border border-white/5"
                        aria-label="Log Out"
                        title="Log Out"
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                    <div className="text-right hidden md:block">
                        <p className="text-white font-bold">{userData?.displayName || 'Coach'}</p>
                        <p className="text-xs text-text-muted">{userData?.role || 'Head Coach'}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center font-bold uppercase transition-transform hover:scale-105">
                        {userData?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || 'CC'}
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
            ) : (
                <>
                    {/* Dashboard Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6 animate-fade-in-up delay-100">
                        {/* Main: Upcoming Context */}
                        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl relative overflow-hidden group flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Calendar className="w-24 h-24 text-primary transform rotate-12" />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row gap-6 h-full">
                                <div className="flex-1">
                                    <h2 className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Next Run</h2>
                                    {nextSession ? (
                                        <>
                                            <p className="text-2xl md:text-3xl font-heading font-black italic text-white leading-none mb-2">
                                                {new Date(nextSession.startTime.seconds * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                            </p>
                                            <p className="text-primary text-sm font-bold flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" /> {new Date(nextSession.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <p className="text-white/60 text-xs font-medium mt-1 uppercase tracking-tighter">
                                                {nextSession.venueName || 'Main Gym'}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-white/40 italic py-4">No sessions scheduled.</p>
                                    )}

                                    <div className="mt-6 flex gap-2">
                                        <button
                                            disabled={!nextSession}
                                            onClick={() => navigate('/session/edit', { state: { session: nextSession } })}
                                            className="px-3 py-1.5 bg-primary disabled:opacity-50 text-black font-bold text-xs rounded hover:bg-primary/90 transition-colors uppercase tracking-wider"
                                        >
                                            Edit Session
                                        </button>
                                        <button
                                            onClick={() => setIsPostGigOpen(true)}
                                            className="px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 font-bold text-xs rounded hover:bg-yellow-500/20 transition-colors uppercase tracking-wider flex items-center gap-1"
                                        >
                                            request sub
                                        </button>
                                    </div>
                                </div>

                                {/* Right: The Drill Plan (Compact) */}
                                <div className="flex-1 bg-white/5 rounded-xl p-3 border border-white/5">
                                    <h3 className="text-text-muted text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                        Session Routine
                                    </h3>
                                    <ul className="space-y-2">
                                        {nextSession && nextSession.drills && nextSession.drills.length > 0 ? (
                                            nextSession.drills.map((drill, idx) => (
                                                <li key={drill.id || idx} className="flex items-center gap-2 text-white/90 text-sm">
                                                    <span className="text-white/20 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</span>
                                                    <span className="truncate">{drill.name} ({drill.duration}m)</span>
                                                </li>
                                            ))
                                        ) : (
                                            <>
                                                <li className="flex items-center gap-2 text-white/90 text-sm">
                                                    <span className="text-white/20 font-mono text-xs">01</span>
                                                    <span className="truncate">Dynamic Warmup (15m)</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-white/90 text-sm">
                                                    <span className="text-white/20 font-mono text-xs">02</span>
                                                    <span className="truncate">Skill Work (20m)</span>
                                                </li>
                                                <li className="flex items-center gap-2 text-white/90 text-sm">
                                                    <span className="text-white/20 font-mono text-xs">03</span>
                                                    <span className="truncate">Scrimmage (25m)</span>
                                                </li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Side: Messages */}
                        <div className="glass-panel p-5 rounded-2xl flex flex-col h-full min-h-[300px]">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-text-muted text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-primary" />
                                    Messages
                                </h3>
                                <button onClick={() => navigate('/messages')} className="text-xs text-primary font-bold hover:underline">Inbox</button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                <div className="p-8 text-center text-white/20 text-xs italic">
                                    No new messages.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Schedule Header */}
                    <div className="flex items-center justify-between mb-4 animate-fade-in-up delay-200">
                        <h2 className="text-xl font-bold text-white italic">Future Schedule</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate('/session/edit')}
                                className="px-4 py-2 bg-primary text-black font-bold text-sm rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Schedule Session
                            </button>
                        </div>
                    </div>

                    {/* Schedule List */}
                    <div className="space-y-4 animate-fade-in-up delay-300">
                        {events.length === 0 ? (
                            <div className="glass-panel p-12 rounded-xl text-center text-white/20 border border-dashed border-white/10">
                                <p>No upcoming sessions found.</p>
                            </div>
                        ) : (
                            events.map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => navigate('/session/edit', { state: { session: event } })}
                                    className="glass-panel p-4 rounded-xl flex items-center justify-between group hover:border-primary/50 transition-all cursor-pointer border border-white/5 hover:bg-white/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 group-hover:bg-primary/10 rounded-lg border border-white/10 group-hover:border-primary/30 transition-colors">
                                            <span className="text-[10px] text-text-muted group-hover:text-primary uppercase font-bold">
                                                {new Date(event.startTime.seconds * 1000).toLocaleDateString('en-US', { month: 'short' })}
                                            </span>
                                            <span className="text-xl font-black text-white group-hover:text-primary leading-none">
                                                {new Date(event.startTime.seconds * 1000).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold group-hover:text-primary transition-colors uppercase tracking-tight">{event.title}</h3>
                                            <p className="text-sm text-text-muted flex items-center gap-2">
                                                {event.venueName} • {new Date(event.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <span className="text-[10px] text-white/25 flex items-center gap-1">
                                                    <span className="text-white/40 font-semibold">Created:</span>
                                                    {event.createdAt
                                                        ? new Date(event.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                        : 'Unknown'}
                                                </span>
                                                <span className="text-white/15">·</span>
                                                <span className="text-[10px] flex items-center gap-1">
                                                    <span className="text-white/40 font-semibold">Last used:</span>
                                                    {event.lastUsedAt
                                                        ? <span className="text-primary/70">{new Date(event.lastUsedAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        : <span className="text-white/25 italic">Never run</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <span className="px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] font-bold uppercase tracking-widest border border-white/10 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                                            Edit
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {isCaptureOpen && (
                <MediaCaptureOverlay
                    onClose={() => setIsCaptureOpen(false)}
                    onSave={handleSaveClip}
                />
            )}

            {nextSession && (
                <PostGigModal
                    isOpen={isPostGigOpen}
                    onClose={() => setIsPostGigOpen(false)}
                    session={{
                        id: nextSession.id,
                        title: nextSession.title,
                        time: new Date(nextSession.startTime.seconds * 1000).toLocaleTimeString(),
                        location: nextSession.venueName || nextSession.location,
                        timestamp: nextSession.startTime.seconds
                    }}
                />
            )}
        </div>
    );
};
