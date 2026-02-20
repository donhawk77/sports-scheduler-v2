import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Event } from '../types/schema';
// import Stripe from 'stripe'; 
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

const db = admin.firestore();

/**
 * Callable Function: Creates a Stripe Payment Intent for booking.
 * Automatically splits payment between Platform, Venue, and Coach.
 */
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
    const { eventId } = data;
    const userId = context.auth?.uid;

    if (!userId) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in.');
    }

    const eventDoc = await db.collection('events').doc(eventId).get();
    const event = eventDoc.data() as Event;

    if (!event) throw new functions.https.HttpsError('not-found', 'Event not found.');

    // Calculate Splits
    const priceCents = event.financial.price_cents;
    const venueSharePercent = event.financial.venue_cut_percent; // e.g. 20%
    const coachSharePercent = event.financial.coach_cut_percent; // e.g. 80%

    // Platform Fee (e.g. 5% + $0.30) - SportsScheduler Revenue
    const platformFeeCents = Math.round(priceCents * 0.05) + 30;

    // Remaining to split
    const netRevenue = priceCents - platformFeeCents;
    const venueAmount = Math.round(netRevenue * (venueSharePercent / 100));
    const coachAmount = Math.round(netRevenue * (coachSharePercent / 100));

    // Stripe Connect: Direct Charge on behalf of Venue (or Coach)
    // Here we assume the Venue is the "Connected Account" owner of the event space
    // or the Coach is the Connected Account.
    // SCENARIO: Coach is the merchant of record (Coach Connect ID).

    /*
    const paymentIntent = await stripe.paymentIntents.create({
        amount: priceCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        application_fee_amount: platformFeeCents + venueAmount, // Platform takes its cut AND Venue's cut? 
                                                              // Or specific flows for separate transfers.
        transfer_data: {
            destination: 'acct_coach_connect_id', // The Coach receives the funds
        },
        metadata: {
            eventId: eventId,
            userId: userId,
            venueId: event.financial.venue_id
        }
    });

    // We would then async transfer the venueAmount to the Venue's Connect account
    // via a separate Transfer or by using 'destination' charges differently.
    */

    return {
        clientSecret: "pi_mock_secret_123", // paymentIntent.client_secret
        split_details: {
            total: priceCents,
            coach: coachAmount,
            venue: venueAmount,
            platform: platformFeeCents
        }
    };
});
