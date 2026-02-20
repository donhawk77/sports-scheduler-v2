import React from 'react';

type StatusType = 'active' | 'pending' | 'suspended' | 'verified';

interface StatusBadgeProps {
    status: string;
    type?: StatusType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
    let colorClass = 'bg-gray-500/20 text-gray-400 border-gray-500/20';

    const normalizedStatus = (type || status).toLowerCase();

    if (normalizedStatus === 'active' || normalizedStatus === 'verified') {
        colorClass = 'bg-green-500/20 text-green-400 border-green-500/20';
    } else if (normalizedStatus === 'pending') {
        colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20';
    } else if (normalizedStatus === 'suspended' || normalizedStatus === 'banned') {
        colorClass = 'bg-red-500/20 text-red-500 border-red-500/20';
    }

    return (
        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${colorClass}`}>
            {status}
        </span>
    );
};
