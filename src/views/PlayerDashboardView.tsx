import React, { useState, useEffect } from 'react';
import { User, Bell, Activity, Flame, ChevronRight, Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { SessionCard } from '../components/SessionCard';
import { StatBadge } from '../components/StatBadge';
import type { Booking } from '../types/schema';

export const PlayerDashboardView: React.FC = () => {
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayerContent = async () => {
            if (!user) return;
            try {
                const bookingsRef = collection(db, 'bookings');
                const q = query(
                    bookingsRef,
                    where('userId', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    limit(5)
                );
                const querySnapshot = await getDocs(q);
                const fetchedBookings = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Booking[];
                setBookings(fetchedBookings);
            } catch (error) {
                console.error('Error fetching player dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerContent();
    }, [user]);

    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 md:pb-36 max-w-5xl mx-auto flex flex-col space-y-8">
            {/* Header */}
            <header className="flex items-center justify-between animate-fade-in-down">
                <div className="flex items-center gap-4">
                    <div
                        onClick={() => navigate('/profile')}
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-yellow-600 border-2 border-white/20 flex items-center justify-center text-black font-bold text-lg cursor-pointer uppercase"
                    >
                        {userData?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || 'P'}
                    </div>
                    <div>
                        <p className="text-text-muted text-xs uppercase tracking-widest">Welcome Back</p>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                            {userData?.displayName || 'Player'}
                        </h1>
                    </div>
                </div>
                <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors relative">
                    <Bell className="w-6 h-6" />
                    {bookings.some(b => b.status === 'confirmed') && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                </button>
            </header>

            {/* Stats Overview */}
            <section className="grid grid-cols-3 gap-3 md:gap-6 animate-fade-in-up">
                <StatBadge
                    label="Squad Active"
                    value="5"
                    icon={<User className="w-5 h-5" />}
                    trend="up"
                />
                <StatBadge
                    label="Sessions Made"
                    value={bookings.filter(b => b.paymentStatus === 'paid').length.toString()}
                    icon={<Activity className="w-5 h-5" />}
                />
                <StatBadge
                    label="Streak"
                    value="3 Days"
                    icon={<Flame className="w-5 h-5" />}
                />
            </section>

            {/* My Schedule (Horizontal Scroll) */}
            <section className="space-y-4 animate-fade-in-up delay-100">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Upcoming Sessions <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full">{bookings.length}</span>
                    </h2>
                    <button onClick={() => navigate('/bookings')} className="text-primary text-xs font-bold uppercase tracking-wider hover:text-white transition-colors">See All</button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {bookings.map(booking => (
                            <SessionCard
                                key={booking.id}
                                title={booking.eventTitle || 'Untitled Session'}
                                date="Confirmed"
                                time={booking.status === 'confirmed' ? 'Ready to play' : 'Payment Pending'}
                                coachName="Professional Coach"
                                venueName="Downtown Rec"
                                imageUrl="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000"
                                onClick={() => navigate(`/session/${booking.eventId}`)}
                            />
                        ))}

                        {/* "Find More" Card */}
                        <div
                            onClick={() => navigate('/explore')}
                            className="min-w-[150px] rounded-2xl bg-white/5 border border-dashed border-white/20 hover:border-primary hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary group-hover:text-black transition-colors">
                                <Search className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-text-muted group-hover:text-white">Find Session</span>
                        </div>
                    </div>
                )}
            </section>

            {/* Recent Activity */}
            <section className="space-y-4 animate-fade-in-up delay-200">
                <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                <div className="glass-panel rounded-2xl overflow-hidden">
                    {bookings.slice(0, 3).map((activity, index) => (
                        <div key={activity.id} className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${index !== bookings.length - 1 ? 'border-b border-white/5' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[10px] ${activity.status === 'confirmed' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                    {activity.status === 'confirmed' ? 'PAID' : 'PENDING'}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{activity.eventTitle}</h3>
                                    <p className="text-text-muted text-xs">
                                        {activity.createdAt?.seconds ? new Date(activity.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/20" />
                        </div>
                    ))}
                    {bookings.length === 0 && !loading && (
                        <div className="p-8 text-center text-text-muted italic">
                            No recent activity found. Book your first run!
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};
