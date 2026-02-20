import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Upload, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

export const VenueCreateView: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        type: 'Indoor Court',
        amenities: [] as string[],
        courts: [{ name: 'Main Court', type: 'Indoor', surface: 'Hardwood', capacity: 20 }]
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleAmenity = (amenity: string) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleSubmit = async () => {
        if (!user) {
            showToast("You must be logged in to list a venue", "error");
            return;
        }

        try {
            await addDoc(collection(db, 'venues'), {
                ...formData,
                ownerId: user.uid,
                createdAt: serverTimestamp()
            });
            showToast("Venue Created Successfully!", "success");
            navigate('/venue');
        } catch (error) {
            console.error("Error creating venue:", error);
            showToast("Failed to create venue", "error");
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto flex flex-col pb-36">
            {/* Header */}
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-black italic text-white tracking-tighter">LIST YOUR VENUE</h1>
                    <p className="text-text-muted text-sm uppercase tracking-widest">Step {step} of 3</p>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/10 rounded-full mb-8 overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                ></div>
            </div>

            {/* Step 1: Basic Info */}
            {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Venue Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="e.g. Downtown Rec Center"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="123 Main St, City, State"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-white focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Venue Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                        >
                            <option value="Indoor Court">Indoor Basketball Court</option>
                            <option value="Outdoor Court">Outdoor Street Court</option>
                            <option value="Training Facility">Training Facility / Gym</option>
                            <option value="School Gym">School Gymnasium</option>
                        </select>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!formData.name || !formData.address}
                        className="w-full py-4 bg-primary text-black font-black italic text-lg rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        NEXT STEP
                    </button>
                </div>
            )}

            {/* Step 2: Amenities */}
            {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-bold text-white mb-4">What does your venue offer?</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {['Parking', 'Showers', 'Locker Room', 'Scoreboard', 'Water Fountain', 'WiFi', 'Equipment Rental', 'Air Conditioning'].map((amenity) => (
                            <div
                                key={amenity}
                                onClick={() => toggleAmenity(amenity)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${formData.amenities.includes(amenity)
                                    ? 'bg-primary/20 border-primary text-white'
                                    : 'bg-white/5 border-white/10 text-text-muted hover:border-white/30'
                                    }`}
                            >
                                <span className="font-bold text-sm">{amenity}</span>
                                {formData.amenities.includes(amenity) && <Check className="w-4 h-4 text-primary" />}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            BACK
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="flex-1 py-4 bg-primary text-black font-black italic rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            NEXT STEP
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Photos & Confirmation */}
            {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                    <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                        <div className="p-4 bg-white/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-white/60" />
                        </div>
                        <h3 className="text-white font-bold text-lg">Upload Venue Photos</h3>
                        <p className="text-text-muted text-sm mt-2">Drag and drop or click to browse</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-white font-bold mb-4">Review Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Name</span>
                                <span className="text-white font-medium">{formData.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Type</span>
                                <span className="text-white font-medium">{formData.type}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Amenities</span>
                                <span className="text-white font-medium">{formData.amenities.length} selected</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-4 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                        >
                            BACK
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 py-4 bg-primary text-black font-black italic rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                        >
                            PUBLISH VENUE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
