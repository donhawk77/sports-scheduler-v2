import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, Square, CheckCircle, SkipForward, RotateCcw, ArrowRight, Video, Film, MessageCircle } from 'lucide-react';
import { MediaCaptureOverlay } from '../components/media/MediaCaptureOverlay';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface DrillItem {
    id: string;
    text: string;
    completed: boolean;
}

interface Drill {
    id: number;
    name: string;
    durationMinutes: number;
    category: string;
    items: DrillItem[];
}

import { useToast } from '../context/ToastContext';

export const ActiveSessionView: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const location = useLocation();
    const isPlayer = location.state?.role === 'player';
    const [isCaptureOpen, setIsCaptureOpen] = useState(false);

    const passedSession = location.state?.session as any;
    const sessionId = location.state?.sessionId as string | undefined;
    const hasStampedRef = useRef(false);

    // Initialize Drills from passed session or fallback to mock
    const [sessionDrills, setSessionDrills] = useState<Drill[]>(() => {
        if (passedSession?.drills) {
            return passedSession.drills.map((d: any) => ({
                id: d.id,
                name: d.name,
                durationMinutes: d.duration || d.durationMinutes || 10,
                category: d.category || 'Exercise',
                items: d.items || [
                    { id: `${d.id}-1`, text: `Complete ${d.name}`, completed: false }
                ]
            }));
        }
        return [
            {
                id: 1,
                name: "Dynamic Warmup",
                durationMinutes: 1,
                category: "Warmup",
                items: [
                    { id: "d1-1", text: "High Knees (2 lengths)", completed: false },
                    { id: "d1-2", text: "Butt Kicks (2 lengths)", completed: false },
                    { id: "d1-3", text: "Lunges with Twist", completed: false }
                ]
            },
            {
                id: 2,
                name: "Layup Lines",
                durationMinutes: 20,
                category: "Finishing",
                items: [
                    { id: "d2-1", text: "Right Hand Finishes", completed: false },
                    { id: "d2-2", text: "Left Hand Finishes", completed: false },
                    { id: "d2-3", text: "Reverse Layups", completed: false }
                ]
            }
        ];
    });

    const [activeDrillIndex, setActiveDrillIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(sessionDrills[0]?.durationMinutes * 60 || 0);
    const [isRunning, setIsRunning] = useState(false);
    const [isDrillFinished, setIsDrillFinished] = useState(false);

    const activeDrill = sessionDrills[activeDrillIndex] || sessionDrills[0];
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Stamp lastUsedAt in Firestore the first time the coach hits Play
    const handlePlay = () => {
        if (!isRunning && !hasStampedRef.current && sessionId) {
            hasStampedRef.current = true;
            updateDoc(doc(db, 'events', sessionId), {
                lastUsedAt: serverTimestamp()
            }).catch(err => console.warn('Could not stamp lastUsedAt:', err));
        }
        setIsRunning(!isRunning);
    };

    // Timer Logic
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        setIsRunning(false);
                        setIsDrillFinished(true);

                        // Auto-complete all items for this drill
                        const newDrills = [...sessionDrills];
                        newDrills[activeDrillIndex].items.forEach(item => item.completed = true);
                        setSessionDrills(newDrills);

                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isRunning, timeLeft, activeDrillIndex, sessionDrills]);

    const formatTime = (secs: number) => {
        const mins = Math.floor(secs / 60);
        const seconds = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleItem = (drillIndex: number, itemId: string) => {
        const newDrills = [...sessionDrills];
        const drill = newDrills[drillIndex];
        const item = drill.items.find(i => i.id === itemId);
        if (item) item.completed = !item.completed;
        setSessionDrills(newDrills);
    };

    const nextDrill = () => {
        if (activeDrillIndex < sessionDrills.length - 1) {
            const nextIndex = activeDrillIndex + 1;
            setActiveDrillIndex(nextIndex);
            setTimeLeft(sessionDrills[nextIndex].durationMinutes * 60);
            setIsRunning(false); // Requiring manual start for next drill
            setIsDrillFinished(false);
        } else {
            // End of Session
            navigate('/coach'); // Or to a summary page
        }
    };

    const resetDrill = () => {
        setTimeLeft(activeDrill.durationMinutes * 60);
        setIsRunning(false);
        setIsDrillFinished(false);
    };

    const handleSaveClip = (blob: Blob) => {
        console.log("Saved video clip:", blob);
        setIsCaptureOpen(false);
        showToast("Clip saved successfully!", "success");
    };

    const progressPercentage = ((activeDrill.durationMinutes * 60 - timeLeft) / (activeDrill.durationMinutes * 60)) * 100;

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col relative pb-32">

            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}></span>
                        {isRunning ? 'Live Session' : 'Ready to Start'}
                    </h1>
                    <p className="text-text-muted text-sm">{isPlayer ? "Player View" : "Coach View"} • Downtown Rec</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/messages')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/5"
                        title="Messages"
                    >
                        <MessageCircle className="w-5 h-5 text-green-400" />
                    </button>

                    {!isPlayer && (
                        <>
                            <button
                                onClick={() => navigate('/coach/library')}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/5"
                                title="Media Library"
                            >
                                <Film className="w-5 h-5 text-blue-400" />
                            </button>
                            <button
                                onClick={() => setIsCaptureOpen(true)}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-primary transition-colors border border-white/5 hover:border-primary/50"
                                title="Record Clip"
                            >
                                <Video className="w-5 h-5" />
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => navigate(isPlayer ? '/player' : '/coach')}
                        className={`p-2 rounded-full hover:bg-white/10 transition-colors ${isPlayer ? 'text-red-400 hover:text-red-300' : 'text-white/50 hover:text-white'}`}
                        title={isPlayer ? "Leave Session" : "End Session"}
                    >
                        <Square className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* 1. Active Drill (Pinned to Top) */}
            <div className={`glass-panel p-8 rounded-3xl mb-6 relative overflow-hidden transition-all duration-500 ${isDrillFinished ? 'border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : ''}`}>
                {/* Progress Bar Background */}
                <div
                    className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-1000 ease-linear"
                    style={{ width: `${progressPercentage}%` }}
                />

                <div className="flex flex-col items-center justify-center py-8">
                    {/* Category removed for prominence */}
                    <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-8 leading-tight tracking-tight">{activeDrill.name}</h2>

                    <div className={`text-8xl font-mono font-bold tracking-tighter mb-8 tabular-nums transition-colors ${timeLeft < 10 && isRunning ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {formatTime(timeLeft)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4">
                        {!isDrillFinished ? (
                            <>
                                <button
                                    onClick={resetDrill}
                                    className="p-4 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <RotateCcw className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={handlePlay}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 ${isRunning
                                        ? 'bg-white/10 text-white border-2 border-white/10'
                                        : 'bg-primary text-black shadow-[0_0_40px_rgba(250,204,21,0.4)]'
                                        }`}
                                >
                                    {isRunning ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                                </button>

                                <button
                                    onClick={nextDrill}
                                    className="p-4 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <SkipForward className="w-6 h-6" />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={nextDrill}
                                className="px-8 py-4 bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition-all flex items-center gap-3 shadow-lg shadow-green-500/20"
                            >
                                <span>Next Drill</span>
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Checklist */}
                <div className="mt-8 pt-8 border-t border-white/10">
                    <h3 className="text-text-muted font-bold uppercase text-xs tracking-wider mb-4 text-center">Checklist</h3>
                    <div className="grid gap-3">
                        {activeDrill.items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => toggleItem(activeDrillIndex, item.id)}
                                className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all group ${item.completed
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-white/5 border-white/5 hover:border-white/20'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${item.completed
                                    ? 'border-green-500 bg-green-500 text-black'
                                    : 'border-white/20 group-hover:border-white/50'
                                    }`}>
                                    {item.completed && <CheckCircle className="w-4 h-4" />}
                                </div>
                                <span className={`font-medium transition-colors ${item.completed ? 'text-green-500 line-through' : 'text-white'}`}>
                                    {item.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Up Next Preview */}
            {activeDrillIndex < sessionDrills.length - 1 && (
                <div className="mb-8 px-4">
                    <p className="text-text-muted text-xs uppercase font-bold mb-2 text-center">Up Next</p>
                    <div className="flex items-center justify-center gap-4 opacity-60">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center font-bold text-white/50 text-sm">
                            {activeDrillIndex + 2}
                        </div>
                        <div className="text-center md:text-left">
                            <h4 className="text-white font-bold">{sessionDrills[activeDrillIndex + 1].name}</h4>
                            <p className="text-xs text-text-muted">{sessionDrills[activeDrillIndex + 1].durationMinutes} Mins • {sessionDrills[activeDrillIndex + 1].category}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Completed Exercises (Accumulated) */}
            {activeDrillIndex > 0 && (
                <div className="mb-8 glass-panel p-6 rounded-2xl border border-white/5 bg-black/20">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <h3 className="text-text-muted font-bold uppercase text-xs tracking-wider">Completed Exercises</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {sessionDrills.slice(0, activeDrillIndex).flatMap(drill => drill.items).map((item) => (
                            <div key={item.id} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-xs text-green-500/80">
                                <CheckCircle className="w-3 h-3" />
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Future Drills (Queue) */}
            {activeDrillIndex < sessionDrills.length - 2 && (
                <div className="space-y-4">
                    <h3 className="text-text-muted font-bold uppercase text-xs tracking-wider ml-2">Coming Up</h3>
                    {sessionDrills.slice(activeDrillIndex + 2).map((drill, index) => (
                        <div key={drill.id} className="glass-panel p-4 rounded-xl border border-white/5 opacity-40 hover:opacity-100 transition-opacity flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white/50 text-xs">
                                    {activeDrillIndex + index + 3}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{drill.name}</h3>
                                    <p className="text-xs text-text-muted">{drill.durationMinutes} Mins • {drill.category}</p>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                        </div>
                    ))}
                </div>
            )}

            {/* End Session Button */}
            {activeDrillIndex >= sessionDrills.length - 1 && isDrillFinished && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => navigate('/coach')}
                        className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" /> Finish Session
                    </button>
                </div>
            )}

            {isCaptureOpen && (
                <MediaCaptureOverlay
                    onClose={() => setIsCaptureOpen(false)}
                    onSave={handleSaveClip}
                />
            )}
        </div>
    );
};
