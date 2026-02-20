export interface Message {
    id: string;
    senderId: string;
    text: string;
    timestamp: string; // ISO string
    isRead: boolean;
}

export interface Conversation {
    id: string;
    participantId: string; // The ID of the OTHER person in the chat
    participantName: string;
    participantAvatar?: string; // URL to avatar image
    participantRole: 'coach' | 'player' | 'venue';
    lastMessage: Message;
    unreadCount: number;
}
