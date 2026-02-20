import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, CheckCircle, Loader2 } from 'lucide-react';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CheckoutModal } from '../components/payments/CheckoutModal';
import type { Event } from '../types/schema';

export const SessionDetailView: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const { showToast } = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Booking State
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
    const [userStatus, setUserStatus] = useState<'none' | 'booked' | 'waitlisted'>('none');

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            try {
                const eventRef = doc(db, 'events', id);
                const eventSnap = await getDoc(eventRef);

                if (eventSnap.exists()) {
                    setEvent({ id: eventSnap.id, ...eventSnap.data() } as Event);

                    // Check if current user is already booked
                    if (user) {
                        const bookingsRef = collection(db, 'bookings');
                        const q = query(
                            bookingsRef,
                            where('eventId', '==', id),
                            where('userId', '==', user.uid)
                        );
                        const bookingSnap = await getDocs(q);
                        if (!bookingSnap.empty) {
                            const bookingData = bookingSnap.docs[0].data();
                            setUserStatus(bookingData.status === 'confirmed' ? 'booked' : 'booked'); // Simplified for now
                        }
                    }
                } else {
                    showToast('Event not found', 'error');
                    navigate('/explore');
                }
            } catch (error) {
                console.error('Error fetching event:', error);
                showToast('Failed to load event details', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id, user, navigate, showToast]);

    const handleBookingInitiation = async () => {
        if (!user) {
            showToast('Please login to book sessions', 'info');
            navigate('/login');
            return;
        }

        if (!userData?.waiverAgreed) {
            showToast('Please sign the waiver in your profile first', 'warning');
            return;
        }

        setBookingLoading(true);
        try {
            // Create a pending booking first
            const bookingRef = await addDoc(collection(db, 'bookings'), {
                eventId: id,
                eventTitle: event?.title,
                userId: user.uid,
                userEmail: user.email,
                userName: userData?.displayName || 'Unknown Player',
                status: 'pending_payment',
                paymentStatus: 'unpaid',
                createdAt: serverTimestamp(),
                price_cents: event?.price_cents || 0,
                venueId: event?.organizerId, // Assuming organizer is the venue
                organizerId: event?.organizerId
            });

            setCurrentBookingId(bookingRef.id);
            setIsCheckoutOpen(true);
        } catch (error) {
            console.error('Error creating booking:', error);
            showToast('Failed to initiate booking', 'error');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 bg-[#0a0a0a]">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-text-muted font-medium animate-pulse uppercase tracking-widest text-xs">Fetching Session Intel...</p>
                </div>
            </div>
        );
    }

    if (!event) return null;

    const isFull = (event.currentPlayers || 0) >= (event.maxPlayers || 30);

    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-24">
            {/* Hero Image / Header */}
            <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
                <img
                    src={event.imageUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=2000"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-6 p-2 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/10"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
                <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <div className="flex gap-2 mb-3">
                                <span className="px-2 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-wider rounded">
                                    {event.type}
                                </span>
                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${isFull ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                    {isFull ? 'Sold Out' : `${(event.maxPlayers || 0) - (event.currentPlayers || 0)} Spots Left`}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-heading font-black italic text-white tracking-tighter uppercase leading-none">
                                {event.title}
                            </h1>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-text-muted text-xs font-bold uppercase tracking-widest mb-1">Entry Fee</span>
                            <span className="text-3xl font-black text-primary">${((event.price_cents || 0) / 100).toFixed(0)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10 shrink-0">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">{new Date(event.startTime.seconds * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                    <p className="text-text-muted text-sm">{new Date(event.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date((event.startTime.seconds + (event.durationMinutes * 60)) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10 shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-bold">{event.venueName}</p>
                                    <p className="text-text-muted text-sm">{event.address || "Location TBD"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Intel</h3>
                            <p className="text-white/80 leading-relaxed text-sm">
                                {event.description || "No description provided for this session. Show up ready to work."}
                            </p>
                        </div>
                    </div>

                    {/* Booking Action */}
                    <div className="pt-8 border-t border-white/5">
                        {userStatus === 'booked' ? (
                            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex items-center gap-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                                <div>
                                    <h4 className="text-green-500 font-bold uppercase tracking-tight">You're Locked In</h4>
                                    <p className="text-green-500/60 text-xs">Check your dashboard for gear and arrival logistics.</p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={handleBookingInitiation}
                                disabled={isFull || bookingLoading}
                                className={`w-full py-5 rounded-2xl font-black italic uppercase tracking-tighter text-xl transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-3 ${isFull
                                    ? 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                                    : 'bg-primary text-black hover:bg-orange-400 hover:scale-[1.01] active:scale-[0.99]'
                                    }`}
                            >
                                {bookingLoading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Processing Order...
                                    </>
                                ) : (
                                    <>
                                        {isFull ? 'SESSION FULL' : 'RESERVE SPOT'}
                                    </>
                                )}
                            </button>
                        )}
                        <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-widest font-bold">
                            Secure payment via Stripe • Instant Confirmation • Zero Fees for Players
                        </p>
                    </div>
                </div>
            </div>

            {/* Checkout Modal Overlay */}
            {isCheckoutOpen && event && currentBookingId && (
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    amount={event.price_cents || 0}
                    venueName={event.venueName || event.location}
                    bookingTitle={event.title}
                    destinationAccountId={event.financial?.venue_id || ''}
                    bookingId={currentBookingId}
                />
            )}
        </div>
    );
};
