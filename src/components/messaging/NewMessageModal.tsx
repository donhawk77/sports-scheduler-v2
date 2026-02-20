import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { getUsers } from '../../data/messagingStore';

interface NewMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectUser: (userId: string) => void;
}

export const NewMessageModal: React.FC<NewMessageModalProps> = ({ isOpen, onClose, onSelectUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const users = getUsers();

    if (!isOpen) return null;

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-scale-in">

                {/* Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white">New Message</h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/5 rounded-full text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-white/10 relative">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search for people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-primary/50 outline-none"
                        autoFocus
                    />
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredUsers.length > 0 ? (
                        <div className="space-y-1">
                            {filteredUsers.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => onSelectUser(user.id)}
                                    className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-black transition-colors">
                                        {user.avatar}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">{user.name}</h3>
                                        <p className="text-xs text-text-muted">{user.role}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-text-muted text-sm">
                            No users found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
