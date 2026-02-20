import { db } from './lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getGeohash } from './lib/location';

export const seedTestData = async () => {
    const eventsRef = collection(db, 'events');

    const testEvents = [
        {
            title: "San Antonio Skills Camp",
            location: "Downtown Rec Center",
            city: "San Antonio",
            state: "TX",
            coordinates: { lat: 29.4241, lng: -98.4936 },
            geohash: getGeohash(29.4241, -98.4936),
            startTime: Timestamp.now(),
            endTime: Timestamp.now(),
            organizerId: "coach_pro",
            attendees: [],
            capacity: { max_attendees: 20, current_attendees: 5, waitlist_enabled: true, waitlist_count: 0 },
            policy: { cancellation_deadline_hours: 24, refund_percentage: 100, auto_promote_waitlist: true },
            financial: { price_cents: 2500, venue_id: "v1", coach_id: "coach_pro", payment_status: 'pending' },
            durationMinutes: 60
        },
        {
            title: "Austin Elite Run",
            location: "Northside Gym",
            city: "Austin",
            state: "TX",
            coordinates: { lat: 30.2672, lng: -97.7431 },
            geohash: getGeohash(30.2672, -97.7431),
            startTime: Timestamp.now(),
            endTime: Timestamp.now(),
            organizerId: "coach_pro",
            attendees: [],
            capacity: { max_attendees: 15, current_attendees: 2, waitlist_enabled: true, waitlist_count: 0 },
            policy: { cancellation_deadline_hours: 24, refund_percentage: 100, auto_promote_waitlist: true },
            financial: { price_cents: 3500, venue_id: "v2", coach_id: "coach_pro", payment_status: 'pending' },
            durationMinutes: 90
        }
    ];

    for (const event of testEvents) {
        await addDoc(eventsRef, event);
        console.log(`Added test event: ${event.title}`);
    }
};

// This is just a template, I'll run logic via browser subagent or manual check
