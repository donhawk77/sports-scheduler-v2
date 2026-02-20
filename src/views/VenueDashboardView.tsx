import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Plus, Zap, ShieldCheck, PenBox, MessageCircle, Loader2, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, deleteDoc, arrayUnion, Timestamp, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FlashDealModal } from '../components/venue/FlashDealModal';
import { AddCourtModal } from '../components/venue/AddCourtModal';
import { EditBookingModal, type BookingData } from '../components/venue/EditBookingModal';
import { CreateBookingModal } from '../components/venue/CreateBookingModal';
import { ConnectPayouts } from '../components/payments/ConnectPayouts';
import type { Event, Venue } from '../types/schema';

export const VenueDashboardView: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
    const [cancellationPolicy, setCancellationPolicy] = useState('24h');
    const [autoRefund, setAutoRefund] = useState(true);
    const [isFlashDealOpen, setIsFlashDealOpen] = useState(false);
    const [isAddCourtOpen, setIsAddCourtOpen] = useState(false);
    const [isCreateBookingOpen, setIsCreateBookingOpen] = useState(false);

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

    // Booking Management State
    const [isEditBookingOpen, setIsEditBookingOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);

    // Real Data State
    const [events, setEvents] = useState<Event[]>([]);
    const [venue, setVenue] = useState<Venue | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ todayBookings: 0, revenue: 0 });
    const [coaches, setCoaches] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!user) return;

        // 1. Fetch Venue (Real-time)
        const venuesRef = collection(db, 'venues');
        const venueQ = query(venuesRef, where('ownerId', '==', user.uid));
        const unsubscribeVenue = onSnapshot(venueQ, (snapshot) => {
            if (!snapshot.empty) {
                const vData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Venue;
                setVenue(vData);
                if (vData.cancellationPolicy) setCancellationPolicy(vData.cancellationPolicy);
                if (vData.autoRefund !== undefined) setAutoRefund(vData.autoRefund);
            }
        }, (error) => {
            console.error('Venue snapshot error:', error);
            showToast('Lost connection to venue profile', 'error');
        });

        // 2. Fetch Events (Real-time)
        const eventsRef = collection(db, 'events');
        const q = query(
            eventsRef,
            where('organizerId', '==', user.uid),
            orderBy('startTime', 'asc')
        );

        const unsubscribeEvents = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Event[];

            setEvents(fetchedEvents);

            // Calculate Simple Stats for Today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const todaysEvents = fetchedEvents.filter(e => {
                if (!e.startTime) return false;
                const start = new Date(e.startTime.seconds * 1000);
                return start >= today && start < tomorrow;
            });

            const totalRevenue = todaysEvents.reduce((acc, curr) => {
                const price = curr.financial?.price_cents || 0;
                const attendees = curr.capacity?.current_attendees || 0;
                return acc + (price * attendees);
            }, 0);

            setStats({
                todayBookings: todaysEvents.length,
                revenue: totalRevenue / 100
            });
            setLoading(false);

            // 3. Resolve Coach Names (One-time check per update)
            const coachIds = [...new Set(fetchedEvents.map(e => e.financial?.coach_id).filter(Boolean))];
            coachIds.forEach(async (id) => {
                if (id && !coaches[id]) {
                    try {
                        const coachDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', id)));
                        if (!coachDoc.empty) {
                            setCoaches(prev => ({
                                ...prev,
                                [id as string]: coachDoc.docs[0].data().displayName || coachDoc.docs[0].data().name || 'Unknown Coach'
                            }));
                        }
                    } catch (e) {
                        console.error('Error resolving coach name:', e);
                    }
                }
            });

        }, (error) => {
            console.error('Events snapshot error:', error);
            showToast('Lost connection to live schedule', 'error');
            setLoading(false);
        });

        return () => {
            unsubscribeVenue();
            unsubscribeEvents();
        };
    }, [user, showToast]);

    const updateVenueSetting = async (key: string, value: any) => {
        if (!venue) return;
        try {
            const venueRef = doc(db, 'venues', venue.id);
            await updateDoc(venueRef, { [key]: value });
            showToast('Settings updated', 'success');
        } catch (error) {
            console.error('Error updating venue setings:', error);
            showToast('Failed to update setting', 'error');
        }
    };

    const handleBookingClick = (e: Event) => {
        // Adapt Event to BookingData for the Modal
        const bookingData: BookingData = {
            id: e.id,
            title: e.title,
            coach: e.financial?.coach_id ? (coaches[e.financial.coach_id] || 'Loading...') : 'Assigned Coach',
            startTime: new Date(e.startTime.seconds * 1000).toISOString(),
            endTime: new Date(e.endTime.seconds * 1000).toISOString(),
            courtName: e.location,
            price: e.financial?.price_cents ? e.financial.price_cents / 100 : undefined
        };
        setSelectedBooking(bookingData);
        setIsEditBookingOpen(true);
    };

    const handleUpdateBooking = async (updatedBooking: BookingData) => {
        try {
            const eventRef = doc(db, 'events', updatedBooking.id);
            await updateDoc(eventRef, {
                title: updatedBooking.title,
                startTime: Timestamp.fromDate(new Date(updatedBooking.startTime)),
                endTime: Timestamp.fromDate(new Date(updatedBooking.endTime)),
                location: updatedBooking.courtName
            });
            showToast("Session updated successfully", "success");
            setIsEditBookingOpen(false);
        } catch (error) {
            console.error("Error updating session:", error);
            showToast("Failed to update session", "error");
        }
    };

    const handleCancelBooking = async (bookingId: string) => {
        if (!window.confirm("Are you sure you want to cancel this session?")) return;
        try {
            await deleteDoc(doc(db, 'events', bookingId));
            showToast("Session cancelled", "success");
            setIsEditBookingOpen(false);
            setEvents(prev => prev.filter(e => e.id !== bookingId));
        } catch (error) {
            console.error("Error cancelling session:", error);
            showToast("Failed to cancel session", "error");
        }
    };

    const handleAddCourt = async (newCourt: any) => {
        if (!venue) return;
        try {
            const venueRef = doc(db, 'venues', venue.id);
            await updateDoc(venueRef, {
                courts: arrayUnion({
                    name: newCourt.name,
                    type: newCourt.type,
                    surface: newCourt.surface,
                    capacity: parseInt(newCourt.capacity)
                })
            });
            showToast("Court added successfully", "success");
            setIsAddCourtOpen(false);
            // Refresh venue state locally
            setVenue(prev => prev ? {
                ...prev,
                courts: [...prev.courts, { ...newCourt, capacity: parseInt(newCourt.capacity) }]
            } : null);
        } catch (error) {
            console.error("Error adding court:", error);
            showToast("Failed to add court", "error");
        }
    };

    const handleDeleteCourt = async (index: number) => {
        if (!venue) return;
        if (!window.confirm("Are you sure you want to delete this court? It will be removed from your venue.")) return;

        try {
            const updatedCourts = [...venue.courts];
            updatedCourts.splice(index, 1);

            const venueRef = doc(db, 'venues', venue.id);
            await updateDoc(venueRef, {
                courts: updatedCourts
            });

            setVenue(prev => prev ? {
                ...prev,
                courts: updatedCourts
            } : null);

            showToast("Court deleted successfully", "success");
        } catch (error) {
            console.error("Error deleting court:", error);
            showToast("Failed to delete court", "error");
        }
    };


    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 max-w-6xl mx-auto flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 animate-fade-in-down">
                <div className="flex items-center gap-4">
                    {/* Removed redundant MapPin button */}
                    {/* Removed default MessageCircle button */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-black italic tracking-tighter text-white">
                            {venue?.name || 'Venue Manager'}
                        </h1>
                        <p className="text-text-muted text-sm tracking-widest uppercase">{venue?.address || 'Dashboard'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/messages')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        aria-label="Messages"
                    >
                        <MessageCircle className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => navigate('/venue/create')}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-white font-bold text-xs rounded-lg hover:bg-white/10 transition-colors uppercase tracking-wider flex items-center gap-2"
                    >
                        <PenBox className="w-4 h-4" /> Manage Venues
                    </button>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        aria-label="Log Out"
                        title="Log Out"
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500 text-orange-500 flex items-center justify-center font-bold">
                        DR
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'overview' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                >
                    Overview
                    {activeTab === 'overview' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'settings' ? 'text-primary' : 'text-text-muted hover:text-white'}`}
                >
                    Settings
                    {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>}
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-text-muted">Analyzing venue operations...</p>
                </div>
            ) : activeTab === 'overview' ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-fade-in-up">
                        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-green-500">
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Today's Sessions</p>
                            <h3 className="text-3xl font-black text-white mt-1">{stats.todayBookings}</h3>
                            <p className="text-green-500 text-xs font-bold mt-2 flex items-center gap-1">
                                Live schedule active
                            </p>
                        </div>
                        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-blue-500">
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Projected Revenue</p>
                            <h3 className="text-3xl font-black text-white mt-1">${stats.revenue.toFixed(0)}</h3>
                            <p className="text-blue-500 text-xs font-bold mt-2">Based on current bookings</p>
                        </div>
                        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-purple-500">
                            <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Total Sessions</p>
                            <h3 className="text-3xl font-black text-white mt-1">{events.length}</h3>
                            <p className="text-purple-500 text-xs font-bold mt-2">All time platform total</p>
                        </div>
                    </div>

                    {/* Command Center Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in-up delay-100">

                        {/* Main: Live Event Status */}
                        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Live Session Status</h2>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsCreateBookingOpen(true)}
                                        className="px-4 py-2 bg-primary text-black font-bold text-xs rounded-lg hover:bg-primary/90 transition-colors uppercase tracking-wider flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Create Session
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {events.slice(0, 5).map((event) => {
                                    const isFull = event.capacity.current_attendees >= event.capacity.max_attendees;
                                    const startTime = new Date(event.startTime.seconds * 1000);

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => handleBookingClick(event)}
                                            className="group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                                        >
                                            <div className={`absolute top-0 left-0 w-1 h-full ${isFull ? 'bg-red-500' : 'bg-green-500'}`}></div>

                                            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-white font-bold text-lg">{event.title}</h3>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isFull ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                                            {isFull ? 'Full' : 'Open'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-text-muted uppercase tracking-wider">
                                                        {event.location} • {event.capacity.current_attendees}/{event.capacity.max_attendees} Players
                                                    </p>
                                                </div>

                                                <div className="flex flex-col md:items-end gap-1">
                                                    <div className="flex items-center gap-2 text-white/60 text-xs">
                                                        <Clock className="w-3 h-3" />
                                                        {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •
                                                        {startTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <p className="text-xs text-primary underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Manage Details</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {events.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                                        <p className="text-text-muted text-sm italic">No sessions found. Create your first one to get started!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Side: Flash Deal Monitor */}
                        <div className="glass-panel p-6 rounded-2xl flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-text-muted text-xs font-bold uppercase tracking-[0.2em]">Active Deals</h3>
                                <button
                                    onClick={() => setIsFlashDealOpen(true)}
                                    className="p-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-black transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-white/10 rounded-xl mb-4 bg-white/5">
                                <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                                <h4 className="text-white font-bold text-sm">No Active Flash Deals</h4>
                                <p className="text-text-muted text-xs mt-1">Boost attendance by offering limited-time discounts on upcoming slots.</p>
                                <button
                                    onClick={() => setIsFlashDealOpen(true)}
                                    className="mt-4 px-4 py-2 bg-primary text-black font-bold text-xs rounded uppercase tracking-wider hover:bg-primary/90 transition-colors"
                                >
                                    Launch Deal
                                </button>
                            </div>

                            {/* Today's Revenue Mini-Stat */}
                            <div className="mt-auto pt-4 border-t border-white/10">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <span className="text-text-muted text-[10px] font-bold uppercase tracking-wider">Today's Revenue</span>
                                        <p className="text-2xl font-bold text-white flex items-center gap-1">
                                            <span className="text-green-500">$</span> {stats.revenue.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Schedule List */}
                    <div className="flex items-center justify-between mb-4 animate-fade-in-up delay-200">
                        <h2 className="text-xl font-bold text-white">Full Schedule</h2>
                        <button
                            onClick={() => navigate('/schedule')}
                            className="text-primary text-sm font-medium hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div className="space-y-3 animate-fade-in-up delay-300">
                        {events.slice(0, 3).map(e => (
                            <div key={e.id} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-white/5 flex flex-col items-center justify-center border border-white/10">
                                        <span className="text-[10px] text-text-muted uppercase">
                                            {new Date(e.startTime.seconds * 1000).toLocaleDateString([], { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-bold text-white">
                                            {new Date(e.startTime.seconds * 1000).toLocaleDateString([], { day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">{e.title}</h3>
                                        <p className="text-text-muted text-xs">
                                            {e.location} • {new Date(e.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                /* === SETTINGS TAB === */
                <div className="animate-fade-in-up">
                    <h2 className="text-2xl font-black italic text-white mb-6">Venue Configuration</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Cancellation Policy */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-orange-500/20 text-orange-500">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Booking Policies</h3>
                                    <p className="text-text-muted text-xs">Manage refunds and cancellations</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold uppercase text-white/60 mb-2 block">Cancellation Deadline</label>
                                    <select
                                        className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-primary"
                                        value={cancellationPolicy}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCancellationPolicy(val);
                                            updateVenueSetting('cancellationPolicy', val);
                                        }}
                                    >
                                        <option value="24h">24 Hours Before (Standard)</option>
                                        <option value="48h">48 Hours Before (Strict)</option>
                                        <option value="72h">72 Hours Before (Very Strict)</option>
                                        <option value="0h">Anytime (Flexible)</option>
                                    </select>
                                    <p className="text-xs text-text-muted mt-2">
                                        Players must cancel before this time to receive a refund.
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div>
                                        <p className="text-white font-bold text-sm">Refund Check-Ins</p>
                                        <p className="text-xs text-text-muted">Auto-refund if player cancels on time</p>
                                    </div>
                                    <div
                                        onClick={() => {
                                            const newVal = !autoRefund;
                                            setAutoRefund(newVal);
                                            updateVenueSetting('autoRefund', newVal);
                                        }}
                                        className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${autoRefund ? 'bg-green-500' : 'bg-white/20'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoRefund ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Court Management */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Court Management</h3>
                                        <p className="text-text-muted text-xs">{venue?.courts?.length || 0} active courts</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAddCourtOpen(true)}
                                    className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary hover:text-black transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {venue?.courts?.map((court: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between group">
                                        <div>
                                            <p className="text-white font-bold text-sm">{court.name}</p>
                                            <p className="text-xs text-text-muted">{court.type} • {court.capacity} cap</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCourt(idx)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                            title="Delete Court"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {(!venue?.courts || venue.courts.length === 0) && (
                                    <p className="text-center py-4 text-text-muted text-xs italic">No courts added yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Financials / Stripe Connect */}
                        <ConnectPayouts />
                    </div>
                </div>
            )}

            <FlashDealModal
                isOpen={isFlashDealOpen}
                onClose={() => setIsFlashDealOpen(false)}
                courts={venue?.courts}
            />

            <AddCourtModal
                isOpen={isAddCourtOpen}
                onClose={() => setIsAddCourtOpen(false)}
                onAdd={handleAddCourt}
            />

            <CreateBookingModal
                isOpen={isCreateBookingOpen}
                onClose={() => setIsCreateBookingOpen(false)}
                courts={venue?.courts}
                onCreate={async (booking) => {
                    if (!user || !venue) return;
                    try {
                        const eventData = {
                            title: booking.title,
                            description: `Quick booking created from Venue Dashboard`,
                            startTime: Timestamp.fromDate(new Date(booking.startTime)),
                            endTime: Timestamp.fromDate(new Date(booking.endTime)),
                            location: booking.courtName,
                            venueName: venue.name,
                            organizerId: user.uid,
                            attendees: [],
                            type: 'SWEAT',
                            durationMinutes: 90,
                            capacity: {
                                max_attendees: 15,
                                current_attendees: 0,
                                waitlist_enabled: true,
                                waitlist_count: 0
                            },
                            policy: {
                                cancellation_deadline_hours: 24,
                                refund_percentage: 100,
                                auto_promote_waitlist: true
                            },
                            financial: {
                                price_cents: (booking.price || 0) * 100,
                                venue_id: venue.id,
                                coach_id: user.uid, // Default to owner as coach for quick create
                                venue_cut_percent: 100,
                                coach_cut_percent: 0,
                                payment_status: 'pending' as const
                            },
                            createdAt: serverTimestamp()
                        };
                        await addDoc(collection(db, 'events'), eventData);
                        showToast("Booking created successfully", "success");
                        setIsCreateBookingOpen(false);
                    } catch (error) {
                        console.error("Error creating quick booking:", error);
                        showToast("Failed to create booking", "error");
                    }
                }}
            />

            <EditBookingModal
                isOpen={isEditBookingOpen}
                onClose={() => setIsEditBookingOpen(false)}
                booking={selectedBooking}
                onUpdate={handleUpdateBooking}
                onCancel={handleCancelBooking}
            />
        </div>
    );
};

