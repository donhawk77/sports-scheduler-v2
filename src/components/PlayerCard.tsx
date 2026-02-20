import React from 'react';
import { User } from 'lucide-react';

interface PlayerCardProps {
    name: string;
    position: string;
    overallRating: number;
    imageUrl?: string;
    stats: {
        label: string;
        value: number;
    }[];
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    name,
    position,
    overallRating,
    imageUrl,
    stats
}) => {
    return (
        <div className="relative w-full max-w-[320px] aspect-[2/3] mx-auto bg-gradient-to-br from-yellow-600/20 to-black border-2 border-yellow-500/50 rounded-xl p-4 flex flex-col items-center text-white shadow-[0_0_40px_rgba(234,179,8,0.2)] overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

            {/* Top Section: Rating & Position */}
            <div className="w-full flex justify-between items-start z-10 mb-2">
                <div className="flex flex-col items-center">
                    <span className="text-5xl font-black text-yellow-400 leading-none">#{overallRating}</span>
                    <span className="text-xl font-bold uppercase tracking-wider">{position}</span>
                </div>
                <div className="w-12 h-12">
                    {/* Team Logo Placeholder */}
                    <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-white/50" />
                    </div>
                </div>
            </div>

            {/* Player Image */}
            <div className="relative w-40 h-40 mb-2 z-10 rounded-full overflow-hidden border-4 border-yellow-500/30">
                {imageUrl ? (
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center">
                        <User className="w-20 h-20 text-white/50" />
                    </div>
                )}
            </div>

            {/* Name */}
            <h2 className="text-2xl font-black uppercase tracking-tighter text-center mb-4 z-10 truncate w-full border-b-2 border-yellow-500/50 pb-2">
                {name}
            </h2>

            {/* Stats Grid */}
            <div className="w-full grid grid-cols-2 gap-x-8 gap-y-2 px-4 z-10">
                {stats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center text-sm font-bold">
                        <span className="text-text-muted">{stat.label}</span>
                        <span className="text-yellow-400">{stat.value}</span>
                    </div>
                ))}
            </div>

            {/* Bottom Shine */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none"></div>
        </div>
    );
};
