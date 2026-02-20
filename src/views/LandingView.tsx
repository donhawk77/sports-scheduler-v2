import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ClipboardList, Building2, Shield, LayoutDashboard } from 'lucide-react';
import { TestimonialCarousel } from '../components/marketing/TestimonialCarousel';
import { useAuth } from '../context/AuthContext';
import { AdminEntryModal } from '../components/auth/AdminEntryModal';

export const LandingView: React.FC = () => {
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const [showAdminModal, setShowAdminModal] = useState(false);


    const getDashboardPath = () => {
        if (!userData) return '/explore';
        const dashboardMap: Record<string, string> = {
            player: '/player',
            coach: '/coach',
            venue: '/venue',
            admin: '/admin'
        };
        return dashboardMap[userData.role] || '/explore';
    };

    return (
        <div className="min-h-screen p-4 md:p-6 max-w-5xl mx-auto flex flex-col items-center">
            {/* Header - Reduced Height */}
            <header className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl mb-8 group">
                <nav className="absolute z-30 w-full flex justify-between items-center px-6 py-6 md:px-12 top-0 left-0">
                    <div className="flex items-center gap-2">
                    </div>
                    {user ? (
                        <button
                            onClick={() => navigate(getDashboardPath())}
                            className="flex items-center gap-2 text-sm font-bold text-primary hover:text-white transition-colors uppercase tracking-widest border border-primary/20 bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary/20 backdrop-blur-md"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-bold text-white/80 hover:text-white transition-colors uppercase tracking-widest border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10 backdrop-blur-md"
                        >
                            Log In
                        </button>
                    )}
                </nav>

                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                    src="/assets/hero_basketball_low_angle.png"
                    alt="Basketball Court"
                    className="w-full h-full object-cover object-bottom transition-transform duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-4">
                    <div className="flex flex-col items-center mb-6 animate-fade-in-up">
                        <h1 className="text-5xl md:text-8xl font-heading font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 drop-shadow-2xl transform -skew-x-6">
                            SportsScheduler
                        </h1>
                        <div className="h-2 w-32 bg-primary transform -skew-x-12 mt-2" />
                    </div>

                    <p className="text-sm md:text-lg text-white/90 font-bold tracking-[0.3em] uppercase drop-shadow-md animate-fade-in-up delay-100">
                        It's not a game. It's practice.
                    </p>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-3xl text-center">

                <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">

                    {/* Primary: Player */}
                    <button
                        className="glass-panel p-8 md:p-12 rounded-3xl flex flex-col md:flex-row items-center gap-6 md:gap-8 hover:border-blue-500/50 transition-all hover:-translate-y-1 group relative overflow-hidden w-full text-center md:text-left"
                        onClick={() => navigate('/explore')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors flex-shrink-0">
                            <Activity className="w-10 h-10 md:w-12 md:h-12 text-blue-500" />
                        </div>

                        <div className="relative z-10 flex-1">
                            <h3 className="text-3xl md:text-4xl font-black text-white italic tracking-tighter mb-2">I'M A PLAYER</h3>
                            <p className="text-lg text-text-muted">Browse local runs, track your stats, and build your squad.</p>
                        </div>

                        <div className="relative z-10 bg-blue-500 text-black font-bold uppercase tracking-wider py-3 px-8 rounded-full opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300 hidden md:block">
                            Enter
                        </div>
                    </button>

                    {/* Secondary: Coach & Venue */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Coach Card */}
                        <button
                            className="glass-panel p-6 rounded-2xl flex flex-col items-center gap-3 hover:border-primary/50 transition-all hover:-translate-y-1 group"
                            onClick={() => navigate('/coach')}
                        >
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-1 group-hover:bg-primary/20 transition-colors">
                                <ClipboardList className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-white">I'm a Coach</h3>
                            <p className="text-xs text-text-muted">Schedule & manage teams.</p>
                        </button>

                        {/* Venue Owner */}
                        <button
                            className="glass-panel p-6 rounded-2xl flex flex-col items-center gap-3 hover:border-purple-500/50 transition-all hover:-translate-y-1 group"
                            onClick={() => navigate('/venue')}
                        >
                            <div className="w-14 h-14 rounded-full bg-purple-500/10 flex items-center justify-center mb-1 group-hover:bg-purple-500/20 transition-colors">
                                <Building2 className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">I own a Venue</h3>
                            <p className="text-xs text-text-muted">List your court.</p>
                        </button>
                    </div>

                </div>

            </main>

            {/* Testimonials */}
            <TestimonialCarousel />

            {/* Enhanced Footer - Slim Version - Aligned Width */}
            <footer className="w-full max-w-4xl mx-auto py-6 px-6 border-t border-white/5 mt-6 bg-black/40 backdrop-blur-md rounded-3xl mb-12">
                <div className="flex flex-col items-center text-center gap-4">

                    {/* Logo & Tagline */}
                    <div className="flex flex-col items-center gap-1">
                        <h2 className="text-base font-heading font-black italic tracking-tighter text-white opacity-80">
                            SportsScheduler
                        </h2>
                    </div>

                    {/* Disclaimer */}
                    <div className="max-w-2xl text-xs text-text-muted leading-relaxed opacity-60">
                        <p>
                            SportsScheduler acts solely as a venue booking and team management platform.
                            We are not responsible for facility conditions, cancellations, or injuries sustained during activities.
                            Participation is at your own risk.
                        </p>
                    </div>

                    {/* Copyright & Admin */}
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] text-white/20">
                            © 2026
                        </span>

                        {/* Subtle Admin Access - Always Visible but Password Protected */}
                        <button
                            onClick={() => setShowAdminModal(true)}
                            className="text-white/10 hover:text-white/50 transition-colors p-1 rounded-full hover:bg-white/5"
                            title="System Administration"
                        >
                            <Shield className="w-3 h-3" />
                        </button>
                    </div>

                </div>
            </footer>

            <AdminEntryModal
                isOpen={showAdminModal}
                onClose={() => setShowAdminModal(false)}
            />
        </div>
    );
};

