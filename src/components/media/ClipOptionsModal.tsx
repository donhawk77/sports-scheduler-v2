import React from 'react';
import { X, UserPlus, SplitSquareHorizontal, Share2, Trash2 } from 'lucide-react';
import type { MediaClip } from '../../types/media';

interface ClipOptionsModalProps {
    clip: MediaClip;
    onClose: () => void;
    onAnalyze: () => void;
    onShare: () => void;
    onTagPlayer: () => void;
    onDelete: () => void;
}

export const ClipOptionsModal: React.FC<ClipOptionsModalProps> = ({ clip, onClose, onAnalyze, onShare, onTagPlayer, onDelete }) => {
    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1a1a1a] w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="text-white font-bold">Clip Options</h3>
                    <button onClick={onClose} className="p-1 text-white/40 hover:text-white rounded-full hover:bg-white/10">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Preview (Small) */}
                <div className="aspect-video bg-black w-full relative">
                    <video src={clip.url} className="w-full h-full object-contain" muted />
                </div>

                {/* Actions List */}
                <div className="p-2 space-y-1">
                    <button
                        onClick={onAnalyze}
                        className="w-full text-left px-4 py-4 hover:bg-white/5 rounded-xl flex items-center gap-4 group transition-colors"
                    >
                        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <SplitSquareHorizontal className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Side-by-Side Analysis</p>
                            <p className="text-text-muted text-xs">Compare with Pro Example</p>
                        </div>
                    </button>

                    <button
                        onClick={onTagPlayer}
                        className="w-full text-left px-4 py-4 hover:bg-white/5 rounded-xl flex items-center gap-4 group transition-colors"
                    >
                        <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Tag Player</p>
                            <p className="text-text-muted text-xs">Assign to specific athlete</p>
                        </div>
                    </button>

                    <button
                        onClick={onShare}
                        className="w-full text-left px-4 py-4 hover:bg-white/5 rounded-xl flex items-center gap-4 group transition-colors"
                    >
                        <div className="p-2 bg-green-500/20 text-green-400 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors">
                            <Share2 className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Share Clip</p>
                            <p className="text-text-muted text-xs">Post to social or send link</p>
                        </div>
                    </button>

                    <div className="h-px bg-white/10 my-2"></div>

                    <button
                        onClick={onDelete}
                        className="w-full text-left px-4 py-3 hover:bg-red-500/10 rounded-xl flex items-center gap-4 group text-red-500 transition-colors"
                    >
                        <Trash2 className="w-5 h-5 ml-1" />
                        <span className="font-bold text-sm">Delete Clip</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
