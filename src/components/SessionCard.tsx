import React from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface SessionCardProps {
    date: string;
    time: string;
    title: string;
    coachName: string;
    venueName: string;
    status?: 'upcoming' | 'completed' | 'cancelled';
    imageUrl?: string;
    onClick?: () => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
    date,
    time,
    title,
    coachName,
    venueName,
    status = 'upcoming',
    imageUrl,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 active:scale-95 cursor-pointer min-w-[280px] w-full md:w-[320px] flex-shrink-0"
        >
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/90 z-10" />
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                />
            )}

            {/* Content */}
            <div className="relative z-20 p-5 h-full flex flex-col justify-end min-h-[180px]">
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                    {status === 'upcoming' && (
                        <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-primary/20">
                            Upcoming
                        </div>
                    )}
                    {status === 'completed' && (
                        <div className="px-2 py-1 rounded bg-gray-500/20 text-gray-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                            Completed
                        </div>
                    )}
                </div>

                <div className="space-y-1 mb-3">
                    <p className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> {date}
                    </p>
                    <h3 className="text-xl font-black text-white leading-tight group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                </div>

                <div className="space-y-2 text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        <span>{time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{venueName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        <span>{coachName}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
