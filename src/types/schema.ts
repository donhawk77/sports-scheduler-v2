export type Timestamp = {
    seconds: number;
    nanoseconds: number;
};

export interface WaitlistEntry {
    userId: string;
    userEmail: string;
    joinedAt: Timestamp;
    status: 'pending' | 'offered' | 'expired' | 'promoted';
    notification_sent_at?: Timestamp;
    checkin_deadline?: Timestamp;
    authorizedPaymentId?: string;
}

export interface EventPolicy {
    cancellation_deadline_hours: number;
    refund_percentage: number;
    auto_promote_waitlist: boolean;
}

export interface EventFinancial {
    price_cents: number;
    venue_id: string;
    coach_id: string;
    venue_cut_percent: number;
    coach_cut_percent: number;
    stripe_product_id?: string;
    payment_status: 'pending' | 'held' | 'distributed';
}

export interface EventCapacity {
    max_attendees: number;
    current_attendees: number;
    waitlist_enabled: boolean;
    waitlist_count: number;
}

export interface Event {
    id: string;
    title: string;
    description?: string;
    startTime: Timestamp;
    endTime: Timestamp;
    location: string;
    organizerId: string;
    attendees: string[]; // User IDs

    // Automation Fields
    capacity: EventCapacity;
    policy: EventPolicy;
    financial: EventFinancial;

    // Computed/Convenience Fields (Redundant with nested but useful for queries/display)
    venueName?: string;
    price_cents?: number;
    imageUrl?: string;
    type?: string;
    maxPlayers?: number;
    currentPlayers?: number;
    durationMinutes: number;
    address?: string;
    drills?: {
        id: number;
        name: string;
        duration: number;
        category: string;
    }[];

    // Location fields
    city?: string;
    state?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    geohash?: string;

    // Audit fields
    createdAt?: Timestamp;
    lastUsedAt?: Timestamp;
}

export interface Transaction {
    id: string;
    type: 'booking' | 'refund' | 'payout';
    amount_cents: number;
    status: 'succeeded' | 'failed' | 'pending';
    metadata: {
        eventId: string;
        userId: string;
        split_venue_amount?: number;
        split_coach_amount?: number;
    };
    stripe_charge_id: string;
    created_at: Timestamp;
}

export interface Booking {
    id: string;
    eventId: string;
    eventTitle?: string;
    userId: string;
    userEmail: string;
    userName: string;
    status: 'pending_payment' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
    paymentStatus: 'unpaid' | 'paid' | 'refunded';
    price_cents: number;
    venueId: string;
    organizerId: string;
    createdAt: Timestamp;
}

export interface Gig {
    id: string;
    type: 'sub_coach' | 'referee';
    eventId: string;
    venueName: string;
    startTime: Timestamp;
    endTime: Timestamp;
    pay_rate_cents: number;
    postedByUserId: string;
    claimedByUserId?: string;
    status: 'open' | 'claimed' | 'completed';
    requirements: string[]; // e.g. "U12 Certified"
    description?: string;
}
export interface Venue {
    id: string;
    name: string;
    address: string;
    type: string;
    amenities: string[];
    courts: {
        name: string;
        type: string;
        surface: string;
        capacity: number;
    }[];
    ownerId: string;
    createdAt: Timestamp;

    // Location fields
    city: string;
    state: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    geohash: string;
    cancellationPolicy?: string;
    autoRefund?: boolean;
}
