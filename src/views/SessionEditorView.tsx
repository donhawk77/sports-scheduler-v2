import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Clock, MapPin, Activity } from 'lucide-react';
import { collection, addDoc, serverTimestamp, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LocationSelectorModal } from '../components/session/LocationSelectorModal';
import { getGeohash } from '../lib/location';

import { useLocation } from 'react-router-dom';

export const SessionEditorView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { showToast } = useToast();

    const existingSession = location.state?.session as any;

    // State for the session being edited
    const [sessionDetails, setSessionDetails] = useState(() => {
        if (existingSession) {
            const start = existingSession.startTime?.seconds ? new Date(existingSession.startTime.seconds * 1000) : new Date();
            const end = existingSession.endTime?.seconds ? new Date(existingSession.endTime.seconds * 1000) : new Date();

            // Fix timezone formatting properly
            const startHH = String(start.getHours()).padStart(2, '0');
            const startMM = String(start.getMinutes()).padStart(2, '0');
            const endHH = String(end.getHours()).padStart(2, '0');
            const endMM = String(end.getMinutes()).padStart(2, '0');

            return {
                id: existingSession.id,
                title: existingSession.title || "The Lab",
                date: start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0') + '-' + String(start.getDate()).padStart(2, '0'),
                timeStart: `${startHH}:${startMM}`,
                timeEnd: `${endHH}:${endMM}`,
                venue: existingSession.venueName || "Downtown Rec Center",
                court: existingSession.location?.includes('-') ? existingSession.location.split(' - ')[1] : "Court 2",
                city: existingSession.city || "San Antonio",
                lat: existingSession.coordinates?.lat || 29.4241,
                lng: existingSession.coordinates?.lng || -98.4936,
                intensity: existingSession.type || "SWEAT"
            };
        }
        return {
            title: "The Lab",
            date: new Date().toISOString().split('T')[0],
            timeStart: "18:00",
            timeEnd: "20:00",
            venue: "Downtown Rec Center",
            court: "Court 2",
            city: "San Antonio",
            lat: 29.4241,
            lng: -98.4936,
            intensity: "SWEAT"
        };
    });

    interface Drill {
        id: number;
        name: string;
        duration: number;
        category: string;
    }

    const [drills, setDrills] = useState<Drill[]>(() => {
        if (existingSession?.drills && existingSession.drills.length > 0) {
            return existingSession.drills;
        }
        return [
            { id: 1, name: "Dynamic Warmup", duration: 15, category: "Warmup" },
            { id: 2, name: "Layup Lines", duration: 20, category: "Finishing" },
            { id: 3, name: "3-Man Weave", duration: 25, category: "Transition" }
        ];
    });

    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    // Pro Drill Database
    const drillLibrary = [
        { id: 101, name: "Form Shooting", duration: 10, category: "Warmup" },
        { id: 102, name: "Mikan Drill", duration: 10, category: "Finishing" },
        { id: 103, name: "Elbow Jumpers", duration: 15, category: "Shooting" },
        { id: 104, name: "X-Out Layups", duration: 15, category: "Finishing" },
        { id: 105, name: "Box Out War", duration: 20, category: "Defense" },
        { id: 106, name: "Shell Drill", duration: 25, category: "Defense" },
        { id: 107, name: "5-Man Weave", duration: 20, category: "Transition" },
        { id: 108, name: "Suicides", duration: 10, category: "Conditioning" }
    ];

    const addDrill = React.useCallback((drill: Drill) => {
        const newDrill = { ...drill, id: Date.now() };
        setDrills(prev => [...prev, newDrill]);
        setIsLibraryOpen(false);
    }, []);

    const addCustomDrill = () => {
        const newDrill: Drill = {
            id: Date.now(),
            name: "Custom Exercise",
            duration: 10,
            category: "Custom"
        };
        setDrills(prev => [...prev, newDrill]);
    };

    const handleSave = async () => {
        if (!user) {
            showToast("You must be logged in to save sessions", "error");
            return;
        }

        try {
            const start = new Date(`${sessionDetails.date}T${sessionDetails.timeStart}`);
            const end = new Date(`${sessionDetails.date}T${sessionDetails.timeEnd}`);
            const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

            const baseEventData = {
                title: sessionDetails.title,
                description: `Drills: ${drills.map(d => d.name).join(', ')}`,
                drills: drills.map(d => ({
                    id: d.id,
                    name: d.name,
                    duration: d.duration,
                    category: d.category
                })),
                startTime: Timestamp.fromDate(start),
                endTime: Timestamp.fromDate(end),
                location: `${sessionDetails.venue} - ${sessionDetails.court}`,
                venueName: sessionDetails.venue,
                type: sessionDetails.intensity,
                durationMinutes,
                city: sessionDetails.city,
                coordinates: { lat: sessionDetails.lat, lng: sessionDetails.lng },
                geohash: getGeohash(sessionDetails.lat, sessionDetails.lng),
            };

            if ((sessionDetails as any).id) {
                // Update existing
                await updateDoc(doc(db, 'events', (sessionDetails as any).id), baseEventData);
                showToast("Session updated successfully!", "success");
            } else {
                // Create new
                const eventData = {
                    ...baseEventData,
                    organizerId: user.uid,
                    attendees: [],
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
                        price_cents: 2000, // Default $20
                        venue_id: 'default_venue',
                        coach_id: user.uid,
                        venue_cut_percent: 20,
                        coach_cut_percent: 80,
                        payment_status: 'pending' as const
                    },
                    createdAt: serverTimestamp()
                };
                await addDoc(collection(db, 'events'), eventData);
                showToast("Session published successfully!", "success");
            }
            navigate('/coach');
        } catch (error) {
            console.error("Error saving session:", error);
            showToast("Failed to save session", "error");
        }
    };

    const removeDrill = (id: number) => {
        setDrills(drills.filter(d => d.id !== id));
    };

    const moveDrill = (index: number, direction: 'up' | 'down') => {
        const newDrills = [...drills];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newDrills.length) {
            [newDrills[index], newDrills[targetIndex]] = [newDrills[targetIndex], newDrills[index]];
            setDrills(newDrills);
        }
    };

    return (
        <div className="min-h-screen p-4 pb-24 md:p-8 max-w-4xl mx-auto relative">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/coach')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <input
                            type="text"
                            value={sessionDetails.title}
                            onChange={(e) => setSessionDetails({ ...sessionDetails, title: e.target.value })}
                            className="bg-transparent text-2xl font-heading font-black italic tracking-tighter text-white border-b border-transparent hover:border-white/20 focus:border-primary outline-none px-0 w-full"
                        />
                        <p className="text-text-muted text-sm tracking-widest uppercase">Session Builder</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Logistics & Vibe */}
                <div className="space-y-6">
                    {/* Logistics Card */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" /> Logistics
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Date</label>
                                <input
                                    type="date"
                                    value={sessionDetails.date}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary/50 outline-none"
                                    onChange={(e) => setSessionDetails({ ...sessionDetails, date: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">Start</label>
                                    <input
                                        type="time"
                                        value={sessionDetails.timeStart}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm text-white focus:border-primary/50 outline-none appearance-none"
                                        onChange={(e) => setSessionDetails({ ...sessionDetails, timeStart: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">End</label>
                                    <input
                                        type="time"
                                        value={sessionDetails.timeEnd}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-3 text-sm text-white focus:border-primary/50 outline-none appearance-none"
                                        onChange={(e) => setSessionDetails({ ...sessionDetails, timeEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-1">Venue & Court</label>
                                <button
                                    onClick={() => setIsLocationModalOpen(true)}
                                    className="w-full flex items-center justify-between bg-black/40 border border-white/10 rounded-lg p-3 text-white hover:border-primary/50 transition-colors group text-left"
                                >
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <span className="font-medium text-sm">{sessionDetails.venue} • {sessionDetails.court}</span>
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-text-muted bg-white/5 py-1 px-2 rounded group-hover:text-white transition-colors">
                                        Change
                                    </div>
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-text-muted uppercase mb-1">City</label>
                                    <input
                                        type="text"
                                        value={sessionDetails.city}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-primary/50 outline-none"
                                        onChange={(e) => setSessionDetails({ ...sessionDetails, city: e.target.value })}
                                        placeholder="e.g. San Antonio"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[8px] font-bold text-text-muted uppercase mb-1">Lat</label>
                                        <input
                                            type="number"
                                            value={sessionDetails.lat}
                                            step="0.0001"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-[10px] text-white focus:border-primary/50 outline-none"
                                            onChange={(e) => setSessionDetails({ ...sessionDetails, lat: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] font-bold text-text-muted uppercase mb-1">Lng</label>
                                        <input
                                            type="number"
                                            value={sessionDetails.lng}
                                            step="0.0001"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-[10px] text-white focus:border-primary/50 outline-none"
                                            onChange={(e) => setSessionDetails({ ...sessionDetails, lng: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vibe Check */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-500" /> Vibe Check
                        </h2>
                        <div className="flex bg-black/40 p-1 rounded-xl">
                            {['CHILL', 'SWEAT', 'BURN'].map((vibe) => (
                                <button
                                    key={vibe}
                                    onClick={() => setSessionDetails({ ...sessionDetails, intensity: vibe })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${sessionDetails.intensity === vibe
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-text-muted hover:text-white'
                                        }`}
                                >
                                    {vibe}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Drill Manager */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Session Routine</h2>
                            <span className="text-text-muted text-sm">Total: {drills.reduce((acc, d) => acc + d.duration, 0)} mins</span>
                        </div>

                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px]">
                            {drills.map((drill, index) => (
                                <div key={drill.id} className="group flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-xl hover:border-white/20 transition-all animate-fade-in-up">
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => moveDrill(index, 'up')}
                                            disabled={index === 0}
                                            className="text-white/20 hover:text-white disabled:opacity-0 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                        </button>
                                        <button
                                            onClick={() => moveDrill(index, 'down')}
                                            disabled={index === drills.length - 1}
                                            className="text-white/20 hover:text-white disabled:opacity-0 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                        </button>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 font-mono text-sm">
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={drill.name}
                                            onChange={(e) => {
                                                const newDrills = [...drills];
                                                newDrills[index].name = e.target.value;
                                                setDrills(newDrills);
                                            }}
                                            className="bg-transparent text-white font-bold border-b border-transparent hover:border-white/20 focus:border-primary outline-none w-full"
                                        />
                                        <p className="text-xs text-text-muted">{drill.category}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="relative group/dur">
                                            <input
                                                type="number"
                                                value={drill.duration}
                                                onChange={(e) => {
                                                    const newDrills = [...drills];
                                                    newDrills[index].duration = parseInt(e.target.value) || 0;
                                                    setDrills(newDrills);
                                                }}
                                                className="w-16 bg-black/40 text-white font-mono text-sm px-2 py-1 rounded border border-transparent hover:border-white/20 focus:border-primary outline-none transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/dur:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10">
                                                Duration (m)
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => removeDrill(drill.id)}
                                            className="p-2 text-white/20 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Drill Buttons */}
                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button
                                    onClick={() => setIsLibraryOpen(true)}
                                    className="border-2 border-dashed border-white/10 rounded-xl p-4 flex items-center justify-center gap-2 text-text-muted hover:border-primary hover:text-primary transition-all group"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-sm uppercase tracking-wider">From Library</span>
                                </button>
                                <button
                                    onClick={addCustomDrill}
                                    className="border-2 border-dashed border-white/10 rounded-xl p-4 flex items-center justify-center gap-2 text-text-muted hover:border-white/30 hover:text-white transition-all group bg-white/5"
                                >
                                    <Activity className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
                                    <span className="font-bold text-sm uppercase tracking-wider">Add Custom</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Drill Library Modal */}
            {isLibraryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#0f172a] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-scale-in">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Drill Library</h2>
                                <p className="text-text-muted text-sm">Select a drill to add to your session.</p>
                            </div>
                            <button
                                onClick={() => setIsLibraryOpen(false)}
                                className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors"
                            >
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            {drillLibrary.map((drill) => (
                                <button
                                    onClick={() => addDrill(drill)}
                                    key={drill.id}
                                    className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-primary/50 transition-all text-left group"
                                >
                                    <div>
                                        <h3 className="text-white font-bold group-hover:text-primary transition-colors">{drill.name}</h3>
                                        <p className="text-xs text-text-muted">{drill.category}</p>
                                    </div>
                                    <span className="text-white/40 font-mono text-xs bg-black/20 px-2 py-1 rounded border border-white/5">{drill.duration}m</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <LocationSelectorModal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                onSelect={(venue, court) => {
                    setSessionDetails({ ...sessionDetails, venue, court });
                }}
            />
        </div>
    );
};
