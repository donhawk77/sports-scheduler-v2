import React, { useState } from 'react';
import { X, Search, Star, Building2 } from 'lucide-react';

interface LocationSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (venue: string, court: string) => void;
}

interface Venue {
    id: string;
    name: string;
    courts: string[];
    type: string;
    distance?: string;
}

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [activeTab, setActiveTab] = useState<'recents' | 'discover'>('recents');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    // Mock Data
    const recentVenues: Venue[] = [
        { id: '1', name: 'Downtown Rec Center', courts: ['Main Court', 'Court 2'], type: 'Community Center' },
        { id: '2', name: 'Northside High', courts: ['Gym A'], type: 'School' },
    ];

    const discoverVenues: Venue[] = [
        { id: '3', name: 'The Thunderdome', courts: ['Arena 1', 'Arena 2'], type: 'Private Complex', distance: '3.2 mi' },
        { id: '4', name: 'Uptown YMCA', courts: ['Court 1', 'Court 2', 'Court 3'], type: 'YMCA', distance: '5.1 mi' },
        { id: '5', name: 'Hoops Factory', courts: ['Showcase Court', 'Training Lab'], type: 'Training Facility', distance: '8.4 mi' },
    ];

    const handleSelect = (venue: string, court: string) => {
        onSelect(venue, court);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-scale-in">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Select Location</h2>
                        <p className="text-text-muted text-xs">Where are we working today?</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('recents')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'recents' ? 'text-primary' : 'text-text-muted hover:text-white'
                            }`}
                    >
                        Recent Spots
                        {activeTab === 'recents' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_-2px_10px_rgba(255,255,255,0.2)]"></div>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'discover' ? 'text-primary' : 'text-text-muted hover:text-white'
                            }`}
                    >
                        Discover New
                        {activeTab === 'discover' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary shadow-[0_-2px_10px_rgba(255,255,255,0.2)]"></div>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">

                    {activeTab === 'recents' ? (
                        <div className="space-y-4">
                            {recentVenues.map(venue => (
                                <div key={venue.id} className="bg-white/5 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-primary/20 rounded-lg">
                                            <Star className="w-4 h-4 text-primary fill-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold">{venue.name}</h3>
                                            <p className="text-xs text-text-muted">{venue.type}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {venue.courts.map(court => (
                                            <button
                                                key={court}
                                                onClick={() => handleSelect(venue.name, court)}
                                                className="px-3 py-2 bg-black/40 hover:bg-primary hover:text-black rounded-lg text-xs font-bold text-white/80 transition-colors text-center border border-white/5 hover:border-primary"
                                            >
                                                {court}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Search Bar */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="Search venues..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-primary/50 outline-none"
                                />
                            </div>

                            {discoverVenues.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase())).map(venue => (
                                <div key={venue.id} className="bg-white/5 border border-white/5 rounded-xl p-4 group hover:border-white/20 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                                <Building2 className="w-4 h-4 text-white group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <h3 className="text-white font-bold">{venue.name}</h3>
                                                <p className="text-xs text-text-muted">{venue.type} • {venue.distance} away</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {venue.courts.map(court => (
                                            <button
                                                key={court}
                                                onClick={() => handleSelect(venue.name, court)}
                                                className="px-3 py-1.5 bg-black/40 hover:bg-white/20 rounded text-[10px] font-bold text-white/60 hover:text-white transition-colors border border-white/5 uppercase tracking-wider"
                                            >
                                                {court}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
