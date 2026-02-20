import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { MediaLibrary } from '../components/media/MediaLibrary';
import type { MediaClip } from '../types/media';
import { ClipOptionsModal } from '../components/media/ClipOptionsModal';
import { ProSelector } from '../components/media/ProSelector';
import { SideBySidePlayer } from '../components/media/SideBySidePlayer';

import { useToast } from '../context/ToastContext';

import { ShareSheet } from '../components/ui/ShareSheet';

export const MediaLibraryView: React.FC = () => {
    // ... imports and existing state
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Workflow State
    const [refreshLibrary, setRefreshLibrary] = useState(0);
    const [selectedClip, setSelectedClip] = useState<MediaClip | null>(null);
    const [isProSelectorOpen, setIsProSelectorOpen] = useState(false);
    const [analyzingClipUrl, setAnalyzingClipUrl] = useState<string | null>(null);
    const [proClipUrl, setProClipUrl] = useState<string | null>(null);

    // Share State
    const [shareConfig, setShareConfig] = useState<{ isOpen: boolean, title: string, text: string } | null>(null);

    // ... (handlers remain same)

    // 1. Select Clip -> Options
    const handleSelectClip = (clip: MediaClip) => {
        setSelectedClip(clip);
    };

    // 2. Option: Analyze -> Open Pro Selector
    const handleInitiateAnalysis = () => {
        if (selectedClip) {
            setIsProSelectorOpen(true);
        }
    };

    // 3. Pro Selected -> Open Side-by-Side
    const handleSelectPro = (proUrl: string) => {
        if (selectedClip) {
            setAnalyzingClipUrl(selectedClip.url);
            setProClipUrl(proUrl);
            setIsProSelectorOpen(false);
            setSelectedClip(null);
        }
    };

    const handleShareClip = () => {
        if (selectedClip) {
            setShareConfig({
                isOpen: true,
                title: `Check out my clip: ${selectedClip.title}`,
                text: `I just captured this awesome moment! Watch here.`
                // url: selectedClip.url (if we had public URLs)
            });
            // Keeping the modal open or closing it? closing for now
            // setSelectedClip(null); 
        }
    };

    const handleDeleteClip = () => {
        if (selectedClip) {
            const existing = localStorage.getItem('coach_media_library');
            if (existing) {
                let list = JSON.parse(existing);
                list = list.filter((c: MediaClip) => c.id !== selectedClip.id);
                localStorage.setItem('coach_media_library', JSON.stringify(list));
                setRefreshLibrary((prev) => prev + 1);
            }
            setSelectedClip(null);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto flex flex-col pb-36">
            {/* Header ... */}
            <header className="flex items-center justify-between mb-8 animate-fade-in-down">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        aria-label="Go Back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-heading font-black italic tracking-tighter text-white">Media Library</h1>
                        <p className="text-text-muted text-sm tracking-widest uppercase">All Recordings & Analysis</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <Home className="w-6 h-6" />
                </button>
            </header>

            {/* Main Library Grid */}
            <div className="flex-1 animate-fade-in-up delay-100">
                <MediaLibrary
                    onSelectClip={handleSelectClip}
                    refreshTrigger={refreshLibrary}
                />
            </div>

            {/* Modals & Overlays */}
            {selectedClip && (
                <ClipOptionsModal
                    clip={selectedClip}
                    onClose={() => setSelectedClip(null)}
                    onAnalyze={handleInitiateAnalysis}
                    onTagPlayer={() => showToast("Tag Player Feature Coming Soon!", "info")}
                    onShare={handleShareClip}
                    onDelete={handleDeleteClip}
                />
            )}

            {/* ... other modals */}
            {isProSelectorOpen && (
                <ProSelector
                    onSelect={handleSelectPro}
                    onClose={() => setIsProSelectorOpen(false)}
                />
            )}

            {analyzingClipUrl && proClipUrl && (
                <SideBySidePlayer
                    userVideoUrl={analyzingClipUrl}
                    proVideoUrl={proClipUrl}
                    onClose={() => {
                        setAnalyzingClipUrl(null);
                        setProClipUrl(null);
                    }}
                />
            )}

            {shareConfig && (
                <ShareSheet
                    isOpen={shareConfig.isOpen}
                    onClose={() => setShareConfig(null)}
                    title={shareConfig.title}
                    text={shareConfig.text}
                />
            )}
        </div>
    );
};
