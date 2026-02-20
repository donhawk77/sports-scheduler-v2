import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface AddCourtModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (court: { name: string; type: string; surface: string; capacity: string }) => void;
}

export const AddCourtModal: React.FC<AddCourtModalProps> = ({ isOpen, onClose, onAdd }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        type: 'Indoor',
        surface: 'Hardwood',
        capacity: '20'
    });

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!formData.name) {
            showToast("Court name is required", "error");
            return;
        }
        onAdd(formData);
        showToast("Court added successfully!", "success");
        setFormData({ name: '', type: 'Indoor', surface: 'Hardwood', capacity: '20' }); // Reset
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl transform transition-all animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <h2 className="text-xl font-black italic text-white tracking-tighter">ADD NEW COURT</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Court Name</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. North Gym"
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Type</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary appearance-none"
                            >
                                <option value="Indoor">Indoor</option>
                                <option value="Outdoor">Outdoor</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-text-muted">Surface</label>
                            <select
                                value={formData.surface}
                                onChange={(e) => setFormData({ ...formData, surface: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary appearance-none"
                            >
                                <option value="Hardwood">Hardwood</option>
                                <option value="Concrete">Concrete</option>
                                <option value="Rubber">Rubber</option>
                                <option value="Turf">Turf</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-text-muted">Capacity (Players)</label>
                        <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full py-4 bg-primary text-black font-black italic text-lg rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mt-4"
                    >
                        <Check className="w-5 h-5" /> ADD COURT
                    </button>
                </div>
            </div>
        </div>
    );
};
