import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';

export const ScheduleView: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-white">Full Schedule</h1>
            </header>

            <div className="space-y-4">
                {/* Month Group */}
                <div className="sticky top-0 bg-black/80 backdrop-blur-xl py-2 z-10">
                    <h2 className="text-primary font-bold uppercase tracking-widest text-sm">February 2026</h2>
                </div>

                <div className="glass-panel p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-text-muted uppercase">FEB</span>
                            <span className="text-xl font-bold text-white">12</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Varsity Scrimmage</h3>
                            <p className="text-sm text-text-muted">Downtown Court • 4:00 PM</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                </div>

                <div className="glass-panel p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-text-muted uppercase">FEB</span>
                            <span className="text-xl font-bold text-white">15</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Skills Drill</h3>
                            <p className="text-sm text-text-muted">North Side Gym • 6:00 PM</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
                </div>

                <div className="glass-panel p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-colors opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-14 h-14 bg-white/5 rounded-lg border border-white/10">
                            <span className="text-xs text-text-muted uppercase">FEB</span>
                            <span className="text-xl font-bold text-white">18</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold">Team Photos</h3>
                            <p className="text-sm text-text-muted">Main Gym • 3:00 PM</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-white/40 border border-white/10 px-2 py-1 rounded">Tentative</span>
                </div>
            </div>

            <button
                onClick={() => navigate('/session/edit')}
                className="fixed bottom-6 right-6 px-6 py-3 bg-primary text-black font-bold rounded-full shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-transform hover:scale-105"
            >
                <Calendar className="w-5 h-5" /> Schedule New
            </button>
        </div>
    );
};
