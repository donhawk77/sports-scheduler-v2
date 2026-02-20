import React, { useState, useEffect } from 'react';
import { Search, Share2, Heart, Loader2, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ShareSheet } from '../components/ui/ShareSheet';
import type { Event } from '../types/schema';
import { calculateDistanceInMiles } from '../lib/location';
import { MapPin, SlidersHorizontal, ChevronDown } from 'lucide-react';

export const ExploreView: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [shareConfig, setShareConfig] = useState<{ isOpen: boolean, title: string, text: string } | null>(null);

    // Location & Filtering State
    const [showFilters, setShowFilters] = useState(false);
    const [radius, setRadius] = useState<number>(0); // 0 means no radius filter
    const [selectedCity, setSelectedCity] = useState<string>('');
    const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
    const [availableCities, setAvailableCities] = useState<string[]>([]);

    // Pagination State
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const eventsRef = collection(db, 'events');
                const q = query(eventsRef, orderBy('startTime', 'asc'), limit(15));
                const querySnapshot = await getDocs(q);

                const fetchedEvents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Event[];

                // Extract unique cities for the filter
                const cities = Array.from(new Set(fetchedEvents
                    .map(e => e.city)
                    .filter(Boolean))) as string[];
                setAvailableCities(cities.sort());

                setEvents(fetchedEvents);
                setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
                setHasMore(querySnapshot.docs.length === 15);
            } catch (error) {
                console.error('Error fetching events:', error);
                showToast('Failed to load sessions', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [showToast]);

    const loadMoreEvents = async () => {
        if (!lastVisible || loadingMore) return;
        setLoadingMore(true);
        try {
            const eventsRef = collection(db, 'events');
            const q = query(eventsRef, orderBy('startTime', 'asc'), startAfter(lastVisible), limit(15));
            const querySnapshot = await getDocs(q);

            const fetchedEvents = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Event[];

            const newCities = Array.from(new Set(fetchedEvents.map(e => e.city).filter(Boolean))) as string[];
            setAvailableCities(prev => Array.from(new Set([...prev, ...newCities])).sort());

            setEvents(prev => [...prev, ...fetchedEvents]);
            setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
            setHasMore(querySnapshot.docs.length === 15);
        } catch (error) {
            console.error('Error loading more events:', error);
            showToast('Failed to load more sessions', 'error');
        } finally {
            setLoadingMore(false);
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            showToast("Geolocation is not supported by your browser", "error");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserCoords([position.coords.latitude, position.coords.longitude]);
                setRadius(25); // Set a default radius once we have location
                showToast("Location updated", "success");
            },
            (error) => {
                console.error("Geolocation error:", error);
                showToast("Could not get your location", "error");
            }
        );
    };

    const handleShare = (venueName: string) => {
        setShareConfig({
            isOpen: true,
            title: `Join the run at ${venueName}`,
            text: `I'm heading to ${venueName} for a run. Come join!`
        });
    };

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (event.city || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCity = selectedCity === '' || event.city === selectedCity;

        let matchesRadius = true;
        if (radius > 0 && userCoords && event.coordinates) {
            const distance = calculateDistanceInMiles(userCoords, [event.coordinates.lat, event.coordinates.lng]);
            matchesRadius = distance <= radius;
        }

        return matchesSearch && matchesCity && matchesRadius;
    });

    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 max-w-5xl mx-auto">
            {/* Header */}
            <header className="mb-8 animate-fade-in-down flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-black italic tracking-tighter text-white">Find Practice</h1>
                    <p className="text-text-muted text-sm tracking-widest uppercase">Discover Open Sessions Nearby</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                        title="Settings & Profile"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center text-black font-bold text-xs border border-white/20">
                            {user?.email?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                    </button>
                </div>
            </header>

            {/* Search & Filters */}
            <div className="space-y-4 mb-8">
                <div className="flex gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by title, venue or city..."
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${showFilters
                            ? 'bg-primary border-primary text-black font-bold'
                            : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                            }`}
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        <span className="hidden md:block">Filters</span>
                    </button>
                </div>

                {showFilters && (
                    <div className="glass-panel p-6 rounded-2xl animate-scale-in origin-top">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* City Filter */}
                            <div>
                                <label className="block text-xs font-bold text-text-muted uppercase mb-3 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-primary" /> Filter by City
                                </label>
                                <div className="relative group">
                                    <select
                                        value={selectedCity}
                                        onChange={(e) => setSelectedCity(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">All Cities</option>
                                        {availableCities.map(city => (
                                            <option key={city} value={city}>{city}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-focus-within:text-primary transition-colors" />
                                </div>
                            </div>

                            {/* Radius Filter */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                                        <Search className="w-3 h-3 text-primary" /> Radius Range
                                    </label>
                                    {userCoords ? (
                                        <button
                                            onClick={() => { setUserCoords(null); setRadius(0); }}
                                            className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                                        >
                                            Active (Reset)
                                        </button>
                                    ) : (
                                        <button
                                            onClick={requestLocation}
                                            className="text-[10px] font-bold text-white hover:text-primary underline transition-colors"
                                        >
                                            Enable Location
                                        </button>
                                    )}
                                </div>
                                <div className="px-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="250"
                                        step="5"
                                        value={radius}
                                        onChange={(e) => setRadius(parseInt(e.target.value))}
                                        className="w-full accent-primary bg-white/5 h-1.5 rounded-lg appearance-none cursor-pointer"
                                        disabled={!userCoords}
                                    />
                                    <div className="flex justify-between mt-2">
                                        <span className="text-[10px] font-bold text-text-muted uppercase">0mi (Off)</span>
                                        <span className="text-[10px] font-bold text-primary uppercase">
                                            {radius > 0 ? `${radius} miles` : 'Radius Off'}
                                        </span>
                                        <span className="text-[10px] font-bold text-text-muted uppercase">250mi</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* loading state */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                    <p className="text-text-muted">Hunting for sessions...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 animate-fade-in-up delay-200">
                    {filteredEvents.map((event) => (
                        <div
                            key={event.id}
                            onClick={() => navigate(`/session/${event.id}`)}
                            className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 group hover:border-white/20 transition-all cursor-pointer"
                        >
                            {/* Image Placeholder */}
                            <div className="w-full md:w-32 h-32 rounded-xl overflow-hidden relative shrink-0 bg-white/5 flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-primary/40" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{event.title}</h3>
                                            <p className="text-primary text-sm font-bold uppercase tracking-wider">
                                                {new Date(event.startTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {event.location}
                                            </p>
                                        </div>
                                        <span className="text-xs text-text-muted flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                            <Clock className="w-3 h-3" /> {new Date(event.startTime.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-text-muted text-xs mt-2 line-clamp-2">
                                        {event.description || 'Join this session for high-intensity training.'}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 mt-4">
                                    <div className="flex-1 text-xs font-bold text-white/40 uppercase">
                                        {event.capacity.max_attendees - event.capacity.current_attendees} spots left
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleShare(event.location); }}
                                        className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 hover:text-green-400 transition-colors"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); }}
                                        className="p-2 rounded-lg bg-white/5 text-white hover:bg-white/10 hover:text-red-500 transition-colors"
                                    >
                                        <Heart className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredEvents.length === 0 && (
                        <div className="text-center py-12 text-text-muted">
                            <p>No sessions found matching your criteria.</p>
                        </div>
                    )}
                </div>
            )}

            {hasMore && !loading && (
                <div className="flex justify-center mt-8 pb-8 animate-fade-in-up">
                    <button
                        onClick={loadMoreEvents}
                        disabled={loadingMore}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10 flex items-center gap-2"
                    >
                        {loadingMore && <Loader2 className="w-5 h-5 animate-spin" />}
                        {loadingMore ? 'Loading...' : 'Load More Sessions'}
                    </button>
                </div>
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
