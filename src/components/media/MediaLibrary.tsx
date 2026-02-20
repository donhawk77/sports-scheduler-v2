import React, { useEffect, useState } from 'react';
import { Play, MoreVertical, Calendar } from 'lucide-react';

import type { MediaClip } from '../../types/media';

// Interface moved to shared types

interface MediaLibraryProps {
    onSelectClip: (clip: MediaClip) => void;
    refreshTrigger?: number; // Simple way to force reload
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({ onSelectClip, refreshTrigger }) => {
    const [clips, setClips] = useState<MediaClip[]>([]);

    useEffect(() => {
        // Load clips from local storage (Mock Cloud)
        const savedClips = localStorage.getItem('coach_media_library');
        if (savedClips) {
            setClips(JSON.parse(savedClips).sort((a: MediaClip, b: MediaClip) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
    }, [refreshTrigger]);

    if (clips.length === 0) {
        return (
            <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/5">
                <p className="text-text-muted text-sm">No clips recorded yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clips.map((clip) => (
                <div
                    key={clip.id}
                    onClick={() => onSelectClip(clip)}
                    className="group relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer border border-white/10 hover:border-primary/50 transition-all"
                >
                    <video
                        src={clip.url}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        preload="metadata"
                        muted // Important for thumbnails
                    />

                    {/* Overlay Info */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-3">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-white text-xs font-bold truncate">
                                    {clip.title || (clip.type === 'analysis' ? 'Analysis' : 'Raw Clip')}
                                </p>
                                <p className="text-white/60 text-[10px] flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(clip.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="p-1.5 bg-white/10 rounded-full hover:bg-white/20">
                                <MoreVertical className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Play Icon on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-3 bg-primary/90 rounded-full text-black shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
