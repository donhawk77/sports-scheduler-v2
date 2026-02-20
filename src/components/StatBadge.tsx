import React from 'react';

interface StatBadgeProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
}

export const StatBadge: React.FC<StatBadgeProps> = ({ label, value, icon, trend }) => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
            {icon && <div className="mb-2 text-primary opacity-80">{icon}</div>}
            <div className="text-2xl font-black text-white mb-1">{value}</div>
            <div className="text-xs text-text-muted uppercase tracking-wider font-bold">{label}</div>
            {trend === 'up' && <div className="text-[10px] text-green-500 mt-1">▲ Trending Up</div>}
        </div>
    );
};
