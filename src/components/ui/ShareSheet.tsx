import React, { useState } from 'react';
import { X, Facebook, Instagram, Mail, Link, Share2, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ShareSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    url?: string;
    text?: string;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ isOpen, onClose, title, url = window.location.href, text }) => {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const shareData = {
        title: title,
        text: text,
        url: url
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            showToast('Link copied to clipboard!', 'success');
            setTimeout(() => {
                setCopied(false);
                onClose();
            }, 1000);
        });
    };

    const handleShare = (platform: 'facebook' | 'instagram' | 'email' | 'system') => {
        const encodedUrl = encodeURIComponent(url);
        const encodedText = encodeURIComponent(text || '');

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
                break;
            case 'instagram':
                // Instagram doesn't have a direct web share intent for posts, usually just opens the app or profile
                // We'll just copy the link and tell them
                handleCopyLink();
                showToast('Link copied! Open Instagram to paste/share.', 'info');
                break;
            case 'email':
                window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}%0A%0A${encodedUrl}`;
                break;
            case 'system':
                if (typeof navigator.share === 'function') {
                    navigator.share(shareData).catch(console.error);
                } else {
                    handleCopyLink();
                }
                break;
        }
        if (platform !== 'instagram' && platform !== 'system') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-slide-up">

                {/* Header */}
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-primary" />
                        Share to...
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 grid grid-cols-4 gap-4">
                    <button
                        onClick={() => handleShare('facebook')}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[#1877F2]/20 text-[#1877F2] flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-all border border-[#1877F2]/30">
                            <Facebook className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-text-muted font-medium">Facebook</span>
                    </button>

                    <button
                        onClick={() => handleShare('instagram')}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-pink-600/20 text-pink-500 flex items-center justify-center group-hover:bg-gradient-to-tr group-hover:from-purple-500 group-hover:to-pink-500 group-hover:text-white transition-all border border-pink-500/30">
                            <Instagram className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-text-muted font-medium">Instagram</span>
                    </button>

                    <button
                        onClick={() => handleShare('email')}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center group-hover:bg-green-500 group-hover:text-black transition-all border border-green-500/30">
                            <Mail className="w-6 h-6" />
                        </div>
                        <span className="text-xs text-text-muted font-medium">Email</span>
                    </button>

                    <button
                        onClick={handleCopyLink}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${copied ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-white/10 text-white border-white/10 group-hover:bg-white/20'}`}>
                            {copied ? <Check className="w-6 h-6" /> : <Link className="w-6 h-6" />}
                        </div>
                        <span className="text-xs text-text-muted font-medium">{copied ? 'Copied' : 'Copy Link'}</span>
                    </button>

                    {typeof navigator.share === 'function' && (
                        <button
                            onClick={() => handleShare('system')}
                            className="col-span-4 mt-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                        >
                            More Options
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
