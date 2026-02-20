import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, User, PlusCircle, Calendar, MessageCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { userData } = useAuth();



    // Hide logic
    const hideNav = location.pathname === '/' ||
        location.pathname === '/login' ||
        location.pathname.startsWith('/session/');

    if (hideNav) return null;

    const isActive = (path: string) => location.pathname === path;

    // Check for admin bypass
    const hasAdminBypass = localStorage.getItem('admin_bypass') === 'true';

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] w-full max-w-md px-4">
            <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-2xl border border-white/10 backdrop-blur-xl bg-black/80">

                {/* ADMIN NAVIGATION */}
                {(userData?.role === 'admin' || hasAdminBypass) ? (
                    <>
                        <button
                            onClick={() => navigate('/admin')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/admin') ? 'text-red-500' : 'text-white/40 hover:text-white'}`}
                        >
                            <Shield className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/explore')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/explore') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <Map className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/messages')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/messages') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <MessageCircle className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <User className="w-6 h-6" />
                        </button>
                    </>
                ) : userData?.role === 'venue' ? (
                    /* VENUE NAVIGATION */
                    <>
                        <button
                            onClick={() => navigate('/venue')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/venue') ? 'text-purple-400' : 'text-white/40 hover:text-white'}`}
                        >
                            <Home className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/venue/calendar')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/venue/calendar') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <Calendar className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/messages')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/messages') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <MessageCircle className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => navigate('/profile')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <User className="w-6 h-6" />
                        </button>
                    </>
                ) : userData?.role === 'coach' ? (
                    /* COACH NAVIGATION */
                    <>
                        <button
                            onClick={() => navigate('/coach')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/coach') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <Home className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/schedule')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/schedule') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <Calendar className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/session/edit')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/session/edit') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <PlusCircle className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/messages')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/messages') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <MessageCircle className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <User className="w-10 h-10 border border-primary/20 rounded-full flex items-center justify-center bg-primary/10 overflow-hidden shadow-inner transform scale-90 group-hover:scale-100 transition-transform">
                                <User className="w-6 h-6" />
                            </User>
                        </button>
                    </>
                ) : (
                    /* PLAYER NAVIGATION (DEFAULT) */
                    <>
                        <button
                            onClick={() => navigate('/player')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/player') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <Home className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/explore')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/explore') ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
                        >
                            <Map className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/bookings')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/bookings') ? 'text-green-400' : 'text-white/40 hover:text-white'}`}
                        >
                            <Calendar className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/messages')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/messages') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <MessageCircle className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? 'text-primary' : 'text-white/40 hover:text-white'}`}
                        >
                            <User className="w-6 h-6" />
                        </button>
                    </>
                )}

            </div>
        </div>
    );
};
