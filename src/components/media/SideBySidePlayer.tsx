import React, { useRef, useState } from 'react';
import { Play, Pause, X, RotateCcw, Film } from 'lucide-react';

interface SideBySidePlayerProps {
    userVideoUrl: string;
    proVideoUrl: string; // In MVP this might be a placeholder or static asset
    onClose: () => void;
}

export const SideBySidePlayer: React.FC<SideBySidePlayerProps> = ({ userVideoUrl, proVideoUrl, onClose }) => {
    const userVideoRef = useRef<HTMLVideoElement>(null);
    const proVideoRef = useRef<HTMLVideoElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isSynced, setIsSynced] = useState(true);

    // Mock Pro Video if empty (for MVP)
    const effectiveProUrl = proVideoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"; // Valid sample for testing

    const togglePlay = () => {
        const nextState = !isPlaying;
        setIsPlaying(nextState);

        if (nextState) {
            userVideoRef.current?.play();
            if (isSynced) proVideoRef.current?.play();
        } else {
            userVideoRef.current?.pause();
            if (isSynced) proVideoRef.current?.pause();
        }
    };

    const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
        // Drive the slider from the user video primary
        setCurrentTime(e.currentTarget.currentTime);

        // Sync check (simple version)
        if (isSynced && proVideoRef.current && userVideoRef.current) {
            const diff = Math.abs(proVideoRef.current.currentTime - userVideoRef.current.currentTime);
            if (diff > 0.3) {
                proVideoRef.current.currentTime = userVideoRef.current.currentTime;
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);

        if (userVideoRef.current) userVideoRef.current.currentTime = time;
        if (proVideoRef.current && isSynced) proVideoRef.current.currentTime = time;
    };

    const changeSpeed = () => {
        const newRate = playbackRate === 1 ? 0.5 : playbackRate === 0.5 ? 0.25 : 1;
        setPlaybackRate(newRate);

        if (userVideoRef.current) userVideoRef.current.playbackRate = newRate;
        if (proVideoRef.current) proVideoRef.current.playbackRate = newRate;
    };

    const handleLoadedMetadata = () => {
        if (userVideoRef.current) {
            setDuration(userVideoRef.current.duration);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <Film className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Pro Analysis</h2>
                        <p className="text-text-muted text-xs">Compare your form side-by-side</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Video Container */}
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-4 p-4 overflow-hidden">

                {/* User Video */}
                <div className="relative flex-1 aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 group">
                    <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur text-white text-xs font-bold rounded-lg border border-white/10">
                        YOU
                    </span>
                    <video
                        ref={userVideoRef}
                        src={userVideoUrl}
                        className="w-full h-full object-contain"
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        playsInline
                    />
                </div>

                {/* Pro Video */}
                <div className="relative flex-1 aspect-video bg-black rounded-2xl overflow-hidden border border-indigo-500/30 group shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                    <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg">
                        PRO
                    </span>
                    <video
                        ref={proVideoRef}
                        src={effectiveProUrl}
                        className="w-full h-full object-contain opacity-80"
                        playsInline
                        muted // Auto-play policies often require muted
                        loop
                    />
                </div>

            </div>

            {/* Controls */}
            <div className="p-6 pb-8 bg-black/50 border-t border-white/10">
                <div className="max-w-3xl mx-auto space-y-4">
                    {/* Scrubber */}
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary-light"
                    />

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={changeSpeed}
                            className="text-xs font-bold font-mono text-white/60 hover:text-primary w-12 text-center"
                        >
                            {playbackRate}x
                        </button>

                        <button
                            onClick={() => {
                                if (userVideoRef.current) userVideoRef.current.currentTime = 0;
                                if (proVideoRef.current) proVideoRef.current.currentTime = 0;
                            }}
                            className="p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="p-4 bg-primary text-black rounded-full hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20"
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>

                        <button
                            onClick={() => setIsSynced(!isSynced)}
                            className={`p-3 rounded-full transition-colors ${isSynced ? 'text-green-400 bg-green-400/10' : 'text-white/40 hover:text-white'}`}
                            title="Toggle Sync"
                        >
                            <span className="text-xs font-bold tracking-widest">SYNC</span>
                        </button>

                        <div className="w-12"></div> {/* Spacer balance */}
                    </div>
                </div>
            </div>
        </div>
    );
};
