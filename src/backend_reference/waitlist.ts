import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Event, WaitlistEntry } from '../types/schema';

// Initialize Admin SDK (if running in Cloud Functions environment)
// admin.initializeApp();
const db = admin.firestore();

/**
 * Trigger: Runs when a user is removed from the 'attendees' array of an event.
 * Goal: Auto-promote the next person on the waitlist.
 */
export const onAttendeeCancellation = functions.firestore
    .document('events/{eventId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data() as Event;
        const previousData = change.before.data() as Event;

        // 1. Check if an attendee was removed
        const attendeeRemoved = newData.attendees.length < previousData.attendees.length;
        if (!attendeeRemoved) return null;

        // 2. Check if Auto-Promote is enabled
        if (!newData.policy.auto_promote_waitlist) return null;

        // 3. Check if there is capacity
        // (Just to be safe, though removal implies capacity)
        if (newData.capacity.current_attendees >= newData.capacity.max_attendees) return null;

        // 4. Fetch the oldest Waitlist Entry
        // This requires a composite index on [eventId, joinedAt]
        const waitlistSnapshot = await db.collection('events')
            .doc(context.params.eventId)
            .collection('waitlist')
            .where('status', '==', 'pending')
            .orderBy('joinedAt', 'asc')
            .limit(1)
            .get();

        if (waitlistSnapshot.empty) {
            console.log('No users on waitlist to promote.');
            return null;
        }

        const nextUserDoc = waitlistSnapshot.docs[0];
        const nextUser = nextUserDoc.data() as WaitlistEntry;

        // 5. Promote the User
        // Transaction to ensure atomic update
        return db.runTransaction(async (t) => {
            const eventRef = change.after.ref;
            const waitlistRef = nextUserDoc.ref;

            // Re-read event to ensure no race condition
            const eventDoc = await t.get(eventRef);
            const currentEvent = eventDoc.data() as Event;

            if (currentEvent.capacity.current_attendees >= currentEvent.capacity.max_attendees) {
                throw new Error('Event became full again before promotion.');
            }

            // Execute Promotion
            t.update(eventRef, {
                attendees: admin.firestore.FieldValue.arrayUnion(nextUser.userId),
                'capacity.current_attendees': admin.firestore.FieldValue.increment(1),
                'capacity.waitlist_count': admin.firestore.FieldValue.increment(-1)
            });

            t.update(waitlistRef, {
                status: 'promoted',
                notification_sent_at: admin.firestore.FieldValue.serverTimestamp()
            });

            // 6. Trigger Email Notification (Placeholder)
            // await sendEmail(nextUser.userEmail, 'You have been promoted!');
        });
    });

/**
 * Callable Function: Allows a user to join the waitlist.
 */
export const joinWaitlist = functions.https.onCall(async (data, context) => {
    const { eventId } = data;
    const userId = context.auth?.uid;

    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    }

    const eventRef = db.collection('events').doc(eventId);

    return db.runTransaction(async (t) => {
        const eventDoc = await t.get(eventRef);
        const event = eventDoc.data() as Event;

        if (!event) throw new functions.https.HttpsError('not-found', 'Event not found.');

        // Check if actually full
        if (event.capacity.current_attendees < event.capacity.max_attendees) {
            throw new functions.https.HttpsError('failed-precondition', 'Event is not full. Book directly.');
        }

        if (!event.capacity.waitlist_enabled) {
            throw new functions.https.HttpsError('failed-precondition', 'Waitlist is disabled.');
        }

        // Add to Waitlist Subcollection
        const waitlistRef = eventRef.collection('waitlist').doc(userId);

        t.set(waitlistRef, {
            userId,
            status: 'pending',
            joinedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Event Counters
        t.update(eventRef, {
            'capacity.waitlist_count': admin.firestore.FieldValue.increment(1)
        });

        return { success: true };
    });
});
