import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings, LogOut, Bell, Shield, Save, Edit2, MapPin, ScrollText } from 'lucide-react';
import { PlayerCard } from '../components/PlayerCard';
import { WaiverModal } from '../components/auth/WaiverModal';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const ProfileView: React.FC = () => {
    const navigate = useNavigate();
    const { user, userData, signOut } = useAuth();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);

    // Profile State
    const [profile, setProfile] = useState({
        name: "",
        position: "PG",
        height: "",
        weight: "",
        bio: "",
        homeLocation: "",
        workLocation: ""
    });

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setProfile(prev => ({ ...prev, ...docSnap.data() }));
                } else {
                    // Initialize if first time
                    setProfile(prev => ({ ...prev, name: user.displayName || "" }));
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        try {
            await setDoc(doc(db, 'users', user.uid), {
                ...profile,
                updatedAt: serverTimestamp()
            }, { merge: true });
            showToast("Profile updated successfully!", "success");
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving profile:", error);
            showToast("Failed to save profile", "error");
        }
    };

    const playerStats = [
        { label: "GAMES", value: 42 },
        { label: "MVP", value: 3 },
        { label: "SQD", value: 8 }, // Squad size
        { label: "RATING", value: 5.0 }, // Sportsmanship rating? Or just remove.
        // Let's stick to fun stuff.
        { label: "VIBES", value: 99 },
        { label: "ATT", value: 100 } // Attendance
    ];

    return (
        <div className="min-h-screen p-4 pb-36 md:p-8 md:pb-36 max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
            {/* Left Column: Player Card */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="self-start md:hidden mb-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="sticky top-8 animate-fade-in-down">
                    <PlayerCard
                        name={profile.name}
                        position={profile.position}
                        overallRating={11} // Jersey Number
                        stats={playerStats}
                        imageUrl="https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000"
                    />
                    <div className="mt-6 text-center">
                        <p className="text-text-muted text-xs uppercase tracking-widest mb-1">Archetype</p>
                        <h3 className="text-xl font-bold text-white">Social Playmaker</h3>
                    </div>
                </div>
            </div>

            {/* Right Column: Details & Settings */}
            <div className="flex-1 space-y-8 animate-fade-in-up">
                {/* Header (Desktop) */}
                <header className="hidden md:flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
                </header>

                {/* Editable Details */}
                <section className="glass-panel p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> Player Details
                        </h2>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isEditing ? 'bg-green-500 text-black hover:bg-green-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isEditing ? (
                                <span className="flex items-center gap-2"><Save className="w-4 h-4" /> Save Changes</span>
                            ) : (
                                <span className="flex items-center gap-2"><Edit2 className="w-4 h-4" /> Edit Profile</span>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Display Name</label>
                            <input
                                type="text"
                                value={profile.name}
                                disabled={!isEditing}
                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Position</label>
                            <select
                                value={profile.position}
                                disabled={!isEditing}
                                onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                            >
                                <option>PG</option>
                                <option>SG</option>
                                <option>SF</option>
                                <option>PF</option>
                                <option>C</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Height</label>
                            <input
                                type="text"
                                value={profile.height}
                                disabled={!isEditing}
                                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Weight</label>
                            <input
                                type="text"
                                value={profile.weight}
                                disabled={!isEditing}
                                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-text-muted uppercase">Bio</label>
                            <textarea
                                value={profile.bio}
                                disabled={!isEditing}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                rows={3}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                            />
                        </div>

                        {/* Location Settings */}
                        <div className="md:col-span-2 pt-4 border-t border-white/10 mt-4">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> Location Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase">Home Address</label>
                                    <input
                                        type="text"
                                        value={profile.homeLocation}
                                        placeholder="Enter home address"
                                        disabled={!isEditing}
                                        onChange={(e) => setProfile({ ...profile, homeLocation: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-text-muted uppercase">Work Address</label>
                                    <input
                                        type="text"
                                        value={profile.workLocation}
                                        placeholder="Enter work address"
                                        disabled={!isEditing}
                                        onChange={(e) => setProfile({ ...profile, workLocation: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Settings Links */}
                <section className="glass-panel p-1 rounded-xl overflow-hidden">
                    <button className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                        <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Settings className="w-5 h-5" /></div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm">Account Settings</h3>
                            <p className="text-text-muted text-xs">Manage email and password</p>
                        </div>
                    </button>
                    <button className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                        <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400"><Bell className="w-5 h-5" /></div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm">Notifications</h3>
                            <p className="text-text-muted text-xs">Push alerts and emails</p>
                        </div>
                    </button>
                    <button className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left border-b border-white/5">
                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400"><Shield className="w-5 h-5" /></div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm">Privacy & Security</h3>
                            <p className="text-text-muted text-xs">2FA and data control</p>
                        </div>
                    </button>
                    <button
                        onClick={() => setIsWaiverModalOpen(true)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                    >
                        <div className={`p-2 rounded-lg ${userData?.waiverAgreed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-500'}`}>
                            <ScrollText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-sm">Liability Waiver</h3>
                            <p className="text-text-muted text-xs">
                                {userData?.waiverAgreed ? 'Signed and agreed' : 'Action Required: Click to sign'}
                            </p>
                        </div>
                    </button>
                </section>

                <button
                    onClick={async () => {
                        await signOut();
                        navigate('/');
                    }}
                    className="w-full p-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center gap-2 font-bold hover:bg-red-500/20 transition-colors"
                >
                    <LogOut className="w-5 h-5" /> Sign Out
                </button>
            </div>

            <WaiverModal
                isOpen={isWaiverModalOpen}
                onClose={() => setIsWaiverModalOpen(false)}
                onSuccess={() => setIsWaiverModalOpen(false)}
            />
        </div>
    );
};
