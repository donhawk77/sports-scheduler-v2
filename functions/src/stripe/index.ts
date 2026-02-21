import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import { defineSecret } from "firebase-functions/params";

// Define strict secrets using Google Cloud Secret Manager via Firebase Params
// These will be requested during a fresh deployment
const stripeSecret = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Initialize Stripe lazily inside the function execution context
// to ensure the secret has been loaded from the manager.
const getStripe = () => {
    return new Stripe(stripeSecret.value(), {
        apiVersion: "2023-10-16",
    });
};

const db = admin.firestore();

interface CreateConnectAccountData {
    redirectUrl?: string;
}

/**
 * Creates a Stripe Connect Account for a user (Coach or Venue)
 * and returns an Account Link for onboarding.
 */
export const createConnectAccount = functions.runWith({ secrets: [stripeSecret] }).https.onCall(async (data: CreateConnectAccountData, context: functions.https.CallableContext) => {
    // 1. Authenticate User
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User profile not found.");
    }

    const userData = userDoc.data();
    let stripeAccountId = userData?.stripeAccountId;

    try {
        // 2. Create Stripe Account if not exists
        const stripeClient = getStripe();
        if (!stripeAccountId) {
            const account = await stripeClient.accounts.create({
                type: "standard",
                email: context.auth.token.email,
                business_type: "individual", // Can be updated during onboarding
                metadata: {
                    firebaseUid: uid,
                },
            });
            stripeAccountId = account.id;

            // Save to Firestore
            await userRef.update({ stripeAccountId });
        }

        // 3. Create Account Link (Onboarding URL)
        const accountLink = await stripeClient.accountLinks.create({
            account: stripeAccountId,
            refresh_url: data.redirectUrl || "https://sportsscheduler.firebaseapp.com/venue",
            return_url: data.redirectUrl || "https://sportsscheduler.firebaseapp.com/venue",
            type: "account_onboarding",
        });

        return { url: accountLink.url };
    } catch (error) {
        const err = error as Error;
        console.error("Stripe Onboarding Error:", err);
        throw new functions.https.HttpsError("internal", err.message);
    }
});

interface CreatePaymentIntentData {
    amount: number;
    currency?: string;
    destinationAccountId: string;
    applicationFeeAmount?: number;
    bookingId: string; // Required for tracking
}

/**
 * Creates a PaymentIntent for a split payment (Marketplace)
 * Splits funds between Platform (App) and Destination (Coach/Venue).
 */
export const createPaymentIntent = functions.runWith({ secrets: [stripeSecret] }).https.onCall(async (data: CreatePaymentIntentData, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { amount, currency = 'usd', destinationAccountId, applicationFeeAmount, bookingId } = data;

    if (!amount || !destinationAccountId || !bookingId) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount, Destination Account ID, and Booking ID are required.');
    }

    try {
        // Create PaymentIntent with Destination Charge
        // The funds go to the Platform first, then transfer to the Destination less the fee.

        const stripeClient = getStripe();
        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: amount,
            currency: currency,
            automatic_payment_methods: { enabled: true },
            application_fee_amount: applicationFeeAmount || Math.round(amount * 0.10), // Default 10% fee
            transfer_data: {
                destination: destinationAccountId,
            },
            metadata: {
                payerId: context.auth.uid,
                bookingId: bookingId // Crucial for webhook matching
            }
        });

        return {
            clientSecret: paymentIntent.client_secret
        };

    } catch (error) {
        const err = error as Error;
        console.error("Stripe Checkout Error:", err);
        throw new functions.https.HttpsError('internal', err.message);
    }
});

/**
 * Stripe Webhook Handler
 * Listens for payment_intent.succeeded to update booking status.
 */
export const handleStripeWebhook = functions.runWith({ secrets: [stripeSecret, stripeWebhookSecret] }).https.onRequest(async (request, response) => {
    const sig = request.headers['stripe-signature'];
    const endpointSecret = stripeWebhookSecret.value();
    const stripeClient = getStripe();

    let event;

    try {
        // request.rawBody is available in Firebase Functions
        event = stripeClient.webhooks.constructEvent(request.rawBody, sig as string, endpointSecret);
    } catch (err) {
        const error = err as Error;
        console.error(`Webhook Error: ${error.message}`);
        response.status(400).send(`Webhook Error: ${error.message}`);
        return;
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const bookingId = paymentIntent.metadata.bookingId;

            if (bookingId) {
                console.log('Payment successful for booking:', bookingId);

                try {
                    await db.runTransaction(async (transaction) => {
                        const bookingRef = db.collection('bookings').doc(bookingId);
                        const bookingDoc = await transaction.get(bookingRef);

                        if (!bookingDoc.exists) {
                            console.error('Booking not found in transaction:', bookingId);
                            return;
                        }

                        const bookingData = bookingDoc.data();

                        // Prevent double-processing
                        if (bookingData?.status === 'confirmed') {
                            console.log('Booking already confirmed, skipping:', bookingId);
                            return;
                        }

                        const eventId = bookingData?.eventId;
                        const userId = bookingData?.userId;

                        if (!eventId || !userId) {
                            console.error('Missing eventId or userId in booking:', bookingId);
                            return;
                        }

                        const eventRef = db.collection('events').doc(eventId);
                        const eventDoc = await transaction.get(eventRef);

                        if (!eventDoc.exists) {
                            console.error('Event not found for booking:', bookingId);
                            transaction.update(bookingRef, { status: 'failed_event_not_found' });
                            return;
                        }

                        const eventData = eventDoc.data();
                        const currentAttendees = eventData?.capacity?.current_attendees || 0;
                        const maxAttendees = eventData?.capacity?.max_attendees || 30;

                        // Atomic Capacity Check
                        if (currentAttendees >= maxAttendees) {
                            console.warn(`Overbooking detected for event ${eventId}. Capacity: ${maxAttendees}, Current: ${currentAttendees}`);
                            transaction.update(bookingRef, {
                                status: 'failed_overbooked',
                                paymentStatus: 'paid_pending_refund',
                                paymentIntentId: paymentIntent.id,
                                updatedAt: admin.firestore.Timestamp.now()
                            });
                            return;
                        }

                        // Update Booking
                        transaction.update(bookingRef, {
                            status: 'confirmed',
                            paymentStatus: 'paid',
                            paymentIntentId: paymentIntent.id,
                            updatedAt: admin.firestore.Timestamp.now()
                        });

                        // Update Event Capacity & Attendees
                        transaction.update(eventRef, {
                            'capacity.current_attendees': admin.firestore.FieldValue.increment(1),
                            'attendees': admin.firestore.FieldValue.arrayUnion(userId)
                        });
                    });
                    console.log('Atomic booking confirmation successful:', bookingId);
                } catch (error) {
                    console.error('Transaction failed for booking confirmation:', error);
                    response.status(500).send(`Transaction Error: ${error}`);
                    return;
                }
            } else {
                console.error('No bookingId found in PaymentIntent metadata:', paymentIntent.id);
            }
            break;
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const bookingId = paymentIntent.metadata.bookingId;

            if (bookingId) {
                console.log('Payment failed for booking:', bookingId);
                try {
                    await db.collection('bookings').doc(bookingId).update({
                        status: 'failed_payment',
                        paymentStatus: 'unpaid',
                        updatedAt: admin.firestore.Timestamp.now()
                    });
                } catch (error) {
                    console.error('Failed to update booking on payment failure:', error);
                }
            }
            break;
        }
        case 'charge.refunded': {
            const charge = event.data.object as Stripe.Charge;
            // Charge metadata is typically inherited from the PaymentIntent
            const bookingId = charge.metadata.bookingId || charge.payment_intent && typeof charge.payment_intent !== 'string' ? (charge.payment_intent as Stripe.PaymentIntent).metadata?.bookingId : null;

            if (bookingId) {
                console.log('Payment refunded for booking:', bookingId);
                try {
                    await db.runTransaction(async (transaction) => {
                        const bookingRef = db.collection('bookings').doc(bookingId);
                        const bookingDoc = await transaction.get(bookingRef);

                        if (!bookingDoc.exists) return;

                        const eventId = bookingDoc.data()?.eventId;
                        if (eventId) {
                            const eventRef = db.collection('events').doc(eventId);
                            // Free up the capacity
                            transaction.update(eventRef, {
                                'capacity.current_attendees': admin.firestore.FieldValue.increment(-1),
                                // Note: Removing user from attendees array would ideally require userId,
                                // which is in bookingDoc.data()?.userId
                                'attendees': admin.firestore.FieldValue.arrayRemove(bookingDoc.data()?.userId)
                            });
                        }

                        transaction.update(bookingRef, {
                            status: 'cancelled', // Or a distinct 'refunded' status
                            paymentStatus: 'refunded',
                            updatedAt: admin.firestore.Timestamp.now()
                        });
                    });
                } catch (error) {
                    console.error('Failed to update booking on refund:', error);
                }
            } else {
                console.log('Refund processed but no bookingId found in metadata for charge:', charge.id);
            }
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    response.json({ received: true });
});
