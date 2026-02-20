export interface MediaClip {
    id: string;
    url: string;
    thumbnail?: string;
    date: string;
    duration?: number;
    title?: string; // User friendly title
    tags?: string[];
    playerId?: string;
    type: 'raw' | 'analysis';
}
