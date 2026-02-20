import React from 'react';
import { X, PlayCircle } from 'lucide-react';

interface ProClip {
    id: string;
    player: string;
    desc: string;
    url: string;
    type: 'Shooting' | 'Dribbling' | 'Defense';
}

const MOCK_PRO_CLIPS: ProClip[] = [
    {
        id: 'steph_side',
        player: 'Steph Curry',
        desc: 'Jump Shot - Side View',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', // Mock
        type: 'Shooting'
    },
    {
        id: 'sabrina_front',
        player: 'Sabrina Ionescu',
        desc: 'Deep 3 - Front View',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', // Mock
        type: 'Shooting'
    },
    {
        id: 'kyrie_dribble',
        player: 'Kyrie Irving',
        desc: 'Crossover Package',
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', // Mock
        type: 'Dribbling'
    }
];

interface ProSelectorProps {
    onSelect: (url: string) => void;
    onClose: () => void;
}

export const ProSelector: React.FC<ProSelectorProps> = ({ onSelect, onClose }) => {
    return (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-6 flex justify-between items-center border-b border-white/10">
                <div>
                    <h2 className="text-2xl font-black italic text-white tracking-tighter">SELECT PRO REFERENCE</h2>
                    <p className="text-text-muted text-sm uppercase tracking-widest">Compare against the best</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_PRO_CLIPS.map((clip) => (
                        <div
                            key={clip.id}
                            onClick={() => onSelect(clip.url)}
                            className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary transition-all cursor-pointer relative"
                        >
                            <div className="aspect-video bg-black relative">
                                <video src={clip.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" muted />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <PlayCircle className="w-12 h-12 text-white/50 group-hover:text-primary transition-colors" />
                                </div>
                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] font-bold text-white uppercase border border-white/10">
                                    {clip.type}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-white font-bold text-lg leading-none mb-1 group-hover:text-primary transition-colors">{clip.player}</h3>
                                <p className="text-text-muted text-sm">{clip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
