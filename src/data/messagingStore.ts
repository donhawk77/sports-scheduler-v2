import type { Conversation, Message } from '../types/messaging';

// Mock Data
const MOCK_MESSAGES: Record<string, Message[]> = {
    'conv_1': [
        { id: 'm1', senderId: 'venue_1', text: 'Flash Deal! 50% off Court 2 Friday. Book now to secure your spot.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), isRead: true },
        { id: 'm2', senderId: 'me', text: 'Thanks! I might take you up on that.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9).toISOString(), isRead: true },
    ],
    'conv_2': [
        { id: 'm3', senderId: 'player_1', text: 'Hey Coach, are we still on for 6pm?', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isRead: true },
        { id: 'm4', senderId: 'me', text: 'Yes, see you then.', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(), isRead: true },
        { id: 'm5', senderId: 'player_1', text: 'Running 10 mins late, traffic!', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), isRead: false },
    ],
    'conv_3': [
        { id: 'm6', senderId: 'system', text: 'New "Rebounding Details" clip added to your library.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: true },
    ]
};

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv_1',
        participantId: 'venue_1',
        participantName: 'Downtown Rec',
        participantRole: 'venue',
        lastMessage: MOCK_MESSAGES['conv_1'][1], // "Thanks!..."
        unreadCount: 0
    },
    {
        id: 'conv_2',
        participantId: 'player_1',
        participantName: 'Sarah J.',
        participantRole: 'player',
        lastMessage: MOCK_MESSAGES['conv_2'][2], // "Running 10 mins late..."
        unreadCount: 1
    },
    {
        id: 'conv_3',
        participantId: 'system',
        participantName: 'System',
        participantRole: 'venue',
        lastMessage: MOCK_MESSAGES['conv_3'][0],
        unreadCount: 0
    }
];

// Helper to get conversation list
export const getConversations = (): Conversation[] => {
    return MOCK_CONVERSATIONS.sort((a, b) =>
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
};

// Helper to get messages for a conversation
export const getMessages = (conversationId: string): Message[] => {
    return MOCK_MESSAGES[conversationId] || [];
};

// Mock Users for Directory
const MOCK_USERS = [
    { id: 'coach_1', name: 'Coach Carter', role: 'Head Coach', avatar: 'CC' },
    { id: 'player_1', name: 'Sarah J.', role: 'Player', avatar: 'SJ' },
    { id: 'player_2', name: 'Jaxson P.', role: 'Player', avatar: 'JP' },
    { id: 'venue_1', name: 'Downtown Rec', role: 'Venue', avatar: 'DR' },
    { id: 'parent_1', name: 'Mike Anderson', role: 'Parent', avatar: 'MA' },
];

export const getUsers = () => MOCK_USERS;

// Helper to create or get existing conversation
export const createConversation = (participantId: string): string => {
    // Check if conversation already exists
    const existing = MOCK_CONVERSATIONS.find(c => c.participantId === participantId);
    if (existing) return existing.id;

    // Create new
    const user = MOCK_USERS.find(u => u.id === participantId);
    if (!user) throw new Error('User not found');

    const newId = `conv_${Date.now()}`;
    const newConv: Conversation = {
        id: newId,
        participantId: user.id,
        participantName: user.name,
        participantRole: (user.role === 'admin' ? 'venue' : user.role) as 'venue' | 'coach' | 'player',
        participantAvatar: user.avatar,
        lastMessage: {
            id: `init_${Date.now()}`,
            senderId: 'system',
            text: 'Started a new conversation',
            timestamp: new Date().toISOString(),
            isRead: true
        },
        unreadCount: 0
    };

    MOCK_CONVERSATIONS.unshift(newConv);
    MOCK_MESSAGES[newId] = [];

    return newId;
};

// Helper to send a message
export const sendMessage = (conversationId: string, text: string): Message => {
    const newMessage: Message = {
        id: `m_${Date.now()}`,
        senderId: 'me', // Mocking current user
        text,
        timestamp: new Date().toISOString(),
        isRead: true
    };

    if (!MOCK_MESSAGES[conversationId]) {
        MOCK_MESSAGES[conversationId] = [];
    }
    MOCK_MESSAGES[conversationId].push(newMessage);

    // Update conversation last message
    const convIndex = MOCK_CONVERSATIONS.findIndex(c => c.id === conversationId);
    if (convIndex !== -1) {
        MOCK_CONVERSATIONS[convIndex].lastMessage = newMessage;
        // Move to top
        const updatedConv = MOCK_CONVERSATIONS.splice(convIndex, 1)[0];
        MOCK_CONVERSATIONS.unshift(updatedConv);
    }

    return newMessage;
};
