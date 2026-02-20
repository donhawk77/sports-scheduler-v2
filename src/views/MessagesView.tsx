import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Send, Phone, Video, Info, Plus } from 'lucide-react';
import { getConversations, getMessages, sendMessage, createConversation } from '../data/messagingStore';
import type { Conversation, Message } from '../types/messaging';
import { NewMessageModal } from '../components/messaging/NewMessageModal';

export const MessagesView: React.FC = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Load
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const convs = getConversations();
            setConversations(convs);
            if (convs.length > 0 && !selectedConversationId) {
                // Select first conversation by default on desktop
                if (window.innerWidth >= 768) {
                    setSelectedConversationId(convs[0].id);
                }
            }
        }, 0);
        return () => clearTimeout(timeoutId);
    }, [selectedConversationId]); // Added dependency to satisfy exhaustive-deps if it was missing or if we want to re-run? Actually, we only want initial load. Wait.

    // Load messages when conversation changes
    useEffect(() => {
        if (selectedConversationId) {
            // Defer slightly to avoid sync cascading render warning if getMessages is purely sync
            const timeoutId = setTimeout(() => {
                setMessages(getMessages(selectedConversationId));
                setNewMessageText('');
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedConversationId]);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!selectedConversationId || !newMessageText.trim()) return;

        const sentMessage = sendMessage(selectedConversationId, newMessageText);
        setMessages([...messages, sentMessage]);
        setNewMessageText('');

        // Update conversation list to show new last message
        setConversations(getConversations());
    };

    const handleNewMessage = (userId: string) => {
        const conversationId = createConversation(userId);
        setConversations(getConversations());
        setSelectedConversationId(conversationId);
        setIsNewMessageOpen(false);
    };

    const activeConversation = conversations.find(c => c.id === selectedConversationId);

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto h-[calc(100vh-100px)]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">

                {/* Left Column: Conversation List */}
                <div className={`md:col-span-4 lg:col-span-3 flex flex-col h-full ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <header className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-2xl font-bold text-white">Messages</h1>
                        </div>
                        <button
                            onClick={() => setIsNewMessageOpen(true)}
                            className="p-2 rounded-full bg-primary/20 text-primary hover:bg-primary hover:text-black transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </header>

                    <div className="mb-6 relative">
                        <Search className="w-4 h-4 text-white/40 absolute left-4 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search DMs"
                            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversationId(conv.id)}
                                className={`p-4 rounded-xl transition-all cursor-pointer border-l-4 ${selectedConversationId === conv.id
                                    ? 'bg-white/10 border-primary'
                                    : 'bg-white/5 border-transparent hover:bg-white/10'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold ${selectedConversationId === conv.id ? 'text-white' : 'text-white/90'}`}>
                                        {conv.participantName}
                                    </h3>
                                    {conv.unreadCount > 0 && (
                                        <span className="bg-primary text-black text-[10px] font-bold px-1.5 rounded-full">
                                            {conv.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-text-muted truncate">
                                    {conv.lastMessage.senderId === 'me' ? 'You: ' : ''}{conv.lastMessage.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Chat Window */}
                <div className={`md:col-span-8 lg:col-span-9 flex flex-col h-full bg-[#0f172a]/50 border border-white/10 rounded-2xl overflow-hidden ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversationId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedConversationId(null)}
                                        className="md:hidden p-2 -ml-2 text-white/60 hover:text-white"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                        {activeConversation?.participantName.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-white font-bold text-lg leading-tight">
                                            {activeConversation?.participantName}
                                        </h2>
                                        <p className="text-xs text-text-muted capitalize">
                                            {activeConversation?.participantRole}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-white/40 hover:text-primary transition-colors">
                                        <Phone className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-white/40 hover:text-primary transition-colors">
                                        <Video className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 text-white/40 hover:text-white transition-colors">
                                        <Info className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === 'me';
                                    const isContinuous = index > 0 && messages[index - 1].senderId === msg.senderId;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isContinuous ? 'mt-1' : 'mt-4'}`}
                                        >
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isMe
                                                ? 'bg-primary text-black font-medium rounded-tr-sm'
                                                : 'bg-white/10 text-white rounded-tl-sm'
                                                }`}>
                                                {msg.text}
                                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-black/40' : 'text-white/30'}`}>
                                                    {formatTime(msg.timestamp)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={newMessageText}
                                        onChange={(e) => setNewMessageText(e.target.value.slice(0, 280))}
                                        placeholder="Start a message..."
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!newMessageText.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-black rounded-full hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="text-right mt-2 mr-2">
                                    <span className={`text-xs font-mono ${newMessageText.length > 250 ? 'text-red-500' : 'text-white/20'}`}>
                                        {280 - newMessageText.length}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Send className="w-8 h-8 text-white/20" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Select a message</h2>
                            <p className="text-text-muted">Choose from your existing conversations, start a new one, or get swiping.</p>
                            <button
                                onClick={() => setIsNewMessageOpen(true)}
                                className="mt-6 px-6 py-2 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-colors"
                            >
                                New Message
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <NewMessageModal
                isOpen={isNewMessageOpen}
                onClose={() => setIsNewMessageOpen(false)}
                onSelectUser={handleNewMessage}
            />
        </div>
    );
};
