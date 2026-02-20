import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Event } from '../types/schema';
// import Stripe from 'stripe'; 
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const db = admin.firestore();

/**
 * Callable Function: Allows a player to cancel their booking.
 * Enforces cancellation deadline and triggers refund if eligible.
 */
export const cancelBooking = functions.https.onCall(async (data, context) => {
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

        // 1. Verify user is booked
        if (!event.attendees.includes(userId)) {
            throw new functions.https.HttpsError('failed-precondition', 'User is not booked for this event.');
        }

        // 2. Check Cancellation Policy
        const now = admin.firestore.Timestamp.now();
        const eventStart = event.startTime; // Firestore Timestamp
        const hoursUntilStart = (eventStart.seconds - now.seconds) / 3600;

        const deadlineHours = event.policy.cancellation_deadline_hours;
        const isEligibleForRefund = hoursUntilStart >= deadlineHours;

        // 3. Process Refund (if eligible)
        if (isEligibleForRefund && event.financial.payment_status === 'paid') {
            // Mock Stripe Refund
            console.log(`Processing full refund for user ${userId}`);
            // await stripe.refunds.create({ payment_intent: 'pi_...' });
        } else {
            console.log(`Cancellation after deadline. No refund.`);
        }

        // 4. Update Event (Remove Attendee)
        t.update(eventRef, {
            attendees: admin.firestore.FieldValue.arrayRemove(userId),
            'capacity.current_attendees': admin.firestore.FieldValue.increment(-1)
        });

        return {
            success: true,
            refund_processed: isEligibleForRefund,
            message: isEligibleForRefund ? 'Booking cancelled. Refund initiated.' : 'Booking cancelled. No refund based on policy.'
        };
    });
});
