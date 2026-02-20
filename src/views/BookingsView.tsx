import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';

export const BookingsView: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    // Mock Data
    const bookings = [
        {
            id: 1,
            title: "Advanced Ball Handling",
            coach: "Coach Carter",
            venue: "Downtown Rec",
            date: "Feb 14, 2026",
            time: "6:00 PM",
            status: "upcoming",
            image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000",
            spotsLeft: 4
        },
        {
            id: 2,
            title: "Shooting Mechanics",
            coach: "Coach K",
            venue: "North Side Gym",
            date: "Feb 16, 2026",
            time: "7:30 PM",
            status: "waitlist",
            image: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1000",
            spotsLeft: 0
        },
        {
            id: 3,
            title: "Defensive Drills",
            coach: "Coach Draymond",
            venue: "Westside Hoops",
            date: "Jan 20, 2026",
            time: "5:00 PM",
            status: "completed",
            image: "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&q=80&w=1000"
        }
    ];

    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'upcoming') return b.status === 'upcoming' || b.status === 'waitlist';
        return b.status === 'completed' || b.status === 'cancelled';
    });

    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 max-w-5xl mx-auto">
            <header className="mb-8 animate-fade-in-down flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors md:hidden"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-3xl font-heading font-black italic tracking-tighter text-white">My Bookings</h1>
                    <p className="text-text-muted text-sm tracking-widest uppercase">Manage Your Schedule</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex p-1 bg-white/5 rounded-xl mb-8 animate-fade-in-up">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-primary text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-primary text-black shadow-lg' : 'text-text-muted hover:text-white'}`}
                >
                    History
                </button>
            </div>

            {/* List */}
            <div className="space-y-4 animate-fade-in-up delay-100">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                        <div key={booking.id} className="glass-panel p-4 rounded-2xl flex gap-4 group hover:border-white/20 transition-all cursor-pointer">
                            {/* Image */}
                            <div className="w-24 h-24 rounded-xl overflow-hidden relative shrink-0">
                                <img src={booking.image} alt={booking.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className={`absolute top-0 left-0 w-full h-full bg-black/40 ${booking.status === 'completed' ? 'grayscale' : ''}`} />
                            </div>

                            {/* Info */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        {booking.status === 'waitlist' && <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded mb-1 inline-block">Waitlist</span>}
                                        {booking.status === 'completed' && <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-2 py-0.5 rounded mb-1 inline-block">Completed</span>}
                                        <h3 className={`text-lg font-bold text-white ${booking.status === 'completed' && 'text-white/60'}`}>{booking.title}</h3>
                                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-xs text-text-muted mt-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {booking.date}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.time}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
                                </div>

                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-text-muted">
                                        <User className="w-3 h-3" /> {booking.coach}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-text-muted">
                                        <MapPin className="w-3 h-3" /> {booking.venue}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-white/20">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No Bookings Found</h3>
                        <p className="text-text-muted text-sm mb-6">You haven't booked any sessions yet.</p>
                        <button
                            onClick={() => navigate('/explore')}
                            className="px-6 py-3 rounded-xl bg-primary text-black font-bold hover:bg-white transition-colors"
                        >
                            Find a Session
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
