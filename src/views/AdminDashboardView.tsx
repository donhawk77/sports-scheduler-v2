import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, MapPin, ExternalLink, Plus, X, LogOut, Calendar, Loader2 } from 'lucide-react';
import { AdminTable } from '../components/AdminTable';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { collection, query, where, onSnapshot, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Event, Venue } from '../types/schema';
import { Play } from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
    const navigate = useNavigate();
    const { signOut } = useAuth();
    const { showToast } = useToast();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
            showToast('Logged out successfully', 'success');
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Failed to logout', 'error');
        }
    };
    const [activeTab, setActiveTab] = useState<'overview' | 'coaches' | 'players' | 'venues' | 'sessions' | 'links'>('overview');
    const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // --- STATE ---
    const [coaches, setCoaches] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [sessions, setSessions] = useState<Event[]>([]);

    // REAL-TIME DATA FETCHING
    React.useEffect(() => {
        setLoading(true);

        // Fetch Coaches
        const coachesQuery = query(collection(db, 'users'), where('role', '==', 'coach'));
        const unsubscribeCoaches = onSnapshot(coachesQuery, (snapshot) => {
            setCoaches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch Players
        const playersQuery = query(collection(db, 'users'), where('role', '==', 'player'));
        const unsubscribePlayers = onSnapshot(playersQuery, (snapshot) => {
            setPlayers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch Venues
        const unsubscribeVenues = onSnapshot(collection(db, 'venues'), (snapshot) => {
            setVenues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Venue[]);
        });

        // Fetch Sessions (Events)
        const sessionsQuery = query(collection(db, 'events'), orderBy('startTime', 'desc'));
        const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
            setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[]);
            setLoading(false);
        });

        return () => {
            unsubscribeCoaches();
            unsubscribePlayers();
            unsubscribeVenues();
            unsubscribeSessions();
        };
    }, []);

    // NEW VENUE FORM STATE
    const [newVenue, setNewVenue] = useState({
        name: '',
        type: 'Indoor',
        rate: '',
        status: 'Active',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
    });

    const handleAddVenue = () => {
        if (!newVenue.name || !newVenue.rate) return;

        console.log("Creating new venue with owner:", {
            venue: newVenue.name,
            owner: newVenue.ownerName,
            email: newVenue.ownerEmail,
            password: newVenue.ownerPassword // Logged for verification only
        });

        const venue = {
            id: Date.now(), // Mock ID
            name: newVenue.name,
            type: newVenue.type,
            rate: newVenue.rate,
            status: newVenue.status
        };
        setVenues([...venues, venue as any]);
        setNewVenue({
            name: '',
            type: 'Indoor',
            rate: '',
            status: 'Active',
            ownerName: '',
            ownerEmail: '',
            ownerPassword: ''
        });
        setIsAddVenueOpen(false);
    };

    const handleDelete = async (type: 'coach' | 'player' | 'venue' | 'session', id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                const collectionName = type === 'session' ? 'events' : type === 'venue' ? 'venues' : 'users';
                await deleteDoc(doc(db, collectionName, id));
                showToast(`${type} deleted successfully`, 'success');
            } catch (error) {
                console.error(`Error deleting ${type}:`, error);
                showToast(`Failed to delete ${type}`, 'error');
            }
        }
    };

    const linkGroups = [
        {
            title: "Public & General",
            links: [
                { path: '/', label: 'Landing Page', desc: 'Main marketing site' },
                { path: '/login', label: 'Auth Portal', desc: 'Login & Signup' },
                { path: '/explore', label: 'Explore', desc: 'Map & Venue Finder' }
            ]
        },
        {
            title: "Coach Tools",
            links: [
                { path: '/coach', label: 'Command Center', desc: 'Main Coach Dashboard' },
                { path: '/session/active', label: 'Live Session', desc: 'Active Practice Mode' },
                { path: '/coach/library', label: 'Media Library', desc: 'Video Analysis' },
                { path: '/schedule', label: 'Scheduler', desc: 'Calendar & Planning' }
            ]
        },
        {
            title: "Player Experience",
            links: [
                { path: '/player', label: 'Player Dashboard', desc: 'Main Player View' },
                { path: '/bookings', label: 'My Bookings', desc: 'Class & Game History' },
                { path: '/profile', label: 'Social Profile', desc: 'Stats & Identity' }
            ]
        },
        {
            title: "Venue Management",
            links: [
                { path: '/venue', label: 'Venue Dashboard', desc: 'Owner Controls' }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 pb-36">
            {/* ... Header and Tabs ... */}
            <header className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                        aria-label="Log Out"
                        title="Log Out"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase relative inline-block">
                            <span className="relative z-10">Admin Portal</span>
                            <span className="absolute bottom-1 left-0 w-full h-3 bg-red-600 -skew-x-12 opacity-80 z-0"></span>
                        </h1>
                        <p className="text-text-muted text-sm mt-1">System Overview & Management</p>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {[
                    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                    { id: 'coaches', icon: Users, label: 'Coaches' },
                    { id: 'players', icon: Users, label: 'Players' },
                    { id: 'venues', icon: MapPin, label: 'Venues' },
                    { id: 'sessions', icon: Calendar, label: 'Sessions' },
                    { id: 'links', icon: ExternalLink, label: 'Quick Links' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-primary text-black'
                            : 'bg-white/5 text-text-muted hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <main className="animate-fade-in-up">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 glass-panel rounded-xl">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-text-muted font-bold animate-pulse">Synchronizing Data...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="glass-panel p-6 rounded-xl border border-white/10">
                                    <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Total Users</h3>
                                    <p className="text-4xl font-black text-white">{coaches.length + players.length + 1240}</p>
                                </div>
                                <div className="glass-panel p-6 rounded-xl border border-white/10">
                                    <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Active Sessions</h3>
                                    <p className="text-4xl font-black text-primary">{sessions.length}</p>
                                </div>
                                <div className="glass-panel p-6 rounded-xl border border-white/10">
                                    <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Revenue (Mo)</h3>
                                    <p className="text-4xl font-black text-green-400">$12.4k</p>
                                </div>
                                <div className="glass-panel p-6 rounded-xl border border-white/10">
                                    <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest mb-2">Venues</h3>
                                    <p className="text-4xl font-black text-yellow-400">{venues.length}</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'coaches' && (
                            <AdminTable
                                data={coaches}
                                columns={[
                                    { header: 'Display Name', accessor: (item) => item.displayName || item.name || 'Anonymous', className: 'font-bold text-white' },
                                    { header: 'Email', accessor: 'email' },
                                    { header: 'Status', accessor: (item) => <StatusBadge status={item.status || 'Active'} /> }
                                ]}
                                onDelete={(item) => handleDelete('coach', item.id)}
                            />
                        )}

                        {activeTab === 'sessions' && (
                            <AdminTable
                                data={sessions}
                                columns={[
                                    { header: 'Title', accessor: 'title', className: 'font-bold text-white' },
                                    { header: 'Venue', accessor: 'venueName' },
                                    {
                                        header: 'Date',
                                        accessor: (item) => item.startTime ? new Date(item.startTime.seconds * 1000).toLocaleDateString() : 'N/A'
                                    },
                                    {
                                        header: 'Attendees',
                                        accessor: (item) => `${item.capacity?.current_attendees || 0}/${item.capacity?.max_attendees || 0}`
                                    },
                                    {
                                        header: 'Practice',
                                        accessor: (item) => (
                                            <button
                                                onClick={() => navigate('/session/active', { state: { session: item, role: 'admin' } })}
                                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-black transition-all group"
                                                title="Practice Session"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                            </button>
                                        )
                                    }
                                ]}
                                onDelete={(item) => handleDelete('session', item.id)}
                            />
                        )}

                        {activeTab === 'players' && (
                            <AdminTable
                                data={players}
                                columns={[
                                    { header: 'Display Name', accessor: (item) => item.displayName || item.name || 'Anonymous', className: 'font-bold text-white' },
                                    { header: 'Email', accessor: 'email' },
                                    { header: 'Status', accessor: (item) => <StatusBadge status={item.status || 'Active'} /> }
                                ]}
                                onDelete={(item) => handleDelete('player', item.id)}
                            />
                        )}

                        {activeTab === 'venues' && (
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setIsAddVenueOpen(true)}
                                        className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add Venue
                                    </button>
                                </div>

                                {isAddVenueOpen && (
                                    <div className="glass-panel p-6 rounded-xl border border-white/10 animate-fade-in-up mb-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-white">Add New Venue</h3>
                                            <button onClick={() => setIsAddVenueOpen(false)} className="text-text-muted hover:text-white"><X className="w-5 h-5" /></button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <input
                                                type="text" placeholder="Venue Name"
                                                className="p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                                                value={newVenue.name} onChange={e => setNewVenue({ ...newVenue, name: e.target.value })}
                                            />
                                            <select
                                                className="p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                                                value={newVenue.type} onChange={e => setNewVenue({ ...newVenue, type: e.target.value })}
                                            >
                                                <option value="Indoor">Indoor</option>
                                                <option value="Outdoor">Outdoor</option>
                                                <option value="Complex">Complex</option>
                                            </select>
                                            <input
                                                type="text" placeholder="Rate (e.g. $90/hr)"
                                                className="p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                                                value={newVenue.rate} onChange={e => setNewVenue({ ...newVenue, rate: e.target.value })}
                                            />
                                            <select
                                                className="p-3 rounded-lg bg-black/50 border border-white/10 text-white"
                                                value={newVenue.status} onChange={e => setNewVenue({ ...newVenue, status: e.target.value })}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Verified">Verified</option>
                                                <option value="Pending">Pending</option>
                                            </select>
                                        </div>
                                        {/* ... Owner Account Setup ... */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleAddVenue}
                                                className="px-6 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors"
                                            >
                                                Save Venue
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <AdminTable
                                    data={venues}
                                    columns={[
                                        { header: 'Name', accessor: 'name', className: 'font-bold text-white' },
                                        { header: 'Type', accessor: 'type' },
                                        { header: 'City', accessor: 'city' },
                                        { header: 'Address', accessor: 'address' }
                                    ]}
                                    onDelete={(item) => handleDelete('venue', item.id)}
                                />
                            </div>
                        )}

                        {activeTab === 'links' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {linkGroups.map((group) => (
                                    <div key={group.title} className="space-y-3">
                                        <h3 className="text-text-muted text-xs font-bold uppercase tracking-widest border-l-2 border-primary pl-2">{group.title}</h3>
                                        <div className="space-y-2">
                                            {group.links.map(link => (
                                                <button
                                                    key={link.path}
                                                    onClick={() => navigate(link.path)}
                                                    className="w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all text-left group"
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-white font-bold text-sm group-hover:text-primary transition-colors">{link.label}</span>
                                                        <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-primary" />
                                                    </div>
                                                    <p className="text-text-muted text-xs">{link.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};
