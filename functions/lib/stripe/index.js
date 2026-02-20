"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = exports.createPaymentIntent = exports.createConnectAccount = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe_1 = require("stripe");
// Initialize Stripe with Secret Key (from Firebase Config)
// To set: firebase functions:config:set stripe.secret="sk_test_..."
const stripe = new stripe_1.default(((_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret) || "sk_test_placeholder", {
    apiVersion: "2023-10-16",
});
const db = admin.firestore();
/**
 * Creates a Stripe Connect Account for a user (Coach or Venue)
 * and returns an Account Link for onboarding.
 */
exports.createConnectAccount = functions.https.onCall(async (data, context) => {
    // 1. Authenticate User
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User profile not found.");
    }
    const userData = userDoc.data();
    let stripeAccountId = userData === null || userData === void 0 ? void 0 : userData.stripeAccountId;
    try {
        // 2. Create Stripe Account if not exists
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
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
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: data.redirectUrl || "https://sportsscheduler.firebaseapp.com/venue",
            return_url: data.redirectUrl || "https://sportsscheduler.firebaseapp.com/venue",
            type: "account_onboarding",
        });
        return { url: accountLink.url };
    }
    catch (error) {
        const err = error;
        console.error("Stripe Onboarding Error:", err);
        throw new functions.https.HttpsError("internal", err.message);
    }
});
/**
 * Creates a PaymentIntent for a split payment (Marketplace)
 * Splits funds between Platform (App) and Destination (Coach/Venue).
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
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
        const paymentIntent = await stripe.paymentIntents.create({
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
    }
    catch (error) {
        const err = error;
        console.error("Stripe Checkout Error:", err);
        throw new functions.https.HttpsError('internal', err.message);
    }
});
/**
 * Stripe Webhook Handler
 * Listens for payment_intent.succeeded to update booking status.
 */
exports.handleStripeWebhook = functions.https.onRequest(async (request, response) => {
    var _a, _b;
    const sig = request.headers['stripe-signature'];
    const endpointSecret = (_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.webhook_secret;
    let event;
    try {
        // request.rawBody is available in Firebase Functions
        event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
    }
    catch (err) {
        const error = err;
        console.error(`Webhook Error: ${error.message}`);
        response.status(400).send(`Webhook Error: ${error.message}`);
        return;
    }
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            const bookingId = paymentIntent.metadata.bookingId;
            if (bookingId) {
                console.log('Payment successful for booking:', bookingId);
                try {
                    await db.runTransaction(async (transaction) => {
                        var _a, _b;
                        const bookingRef = db.collection('bookings').doc(bookingId);
                        const bookingDoc = await transaction.get(bookingRef);
                        if (!bookingDoc.exists) {
                            console.error('Booking not found in transaction:', bookingId);
                            return;
                        }
                        const bookingData = bookingDoc.data();
                        // Prevent double-processing
                        if ((bookingData === null || bookingData === void 0 ? void 0 : bookingData.status) === 'confirmed') {
                            console.log('Booking already confirmed, skipping:', bookingId);
                            return;
                        }
                        const eventId = bookingData === null || bookingData === void 0 ? void 0 : bookingData.eventId;
                        const userId = bookingData === null || bookingData === void 0 ? void 0 : bookingData.userId;
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
                        const currentAttendees = ((_a = eventData === null || eventData === void 0 ? void 0 : eventData.capacity) === null || _a === void 0 ? void 0 : _a.current_attendees) || 0;
                        const maxAttendees = ((_b = eventData === null || eventData === void 0 ? void 0 : eventData.capacity) === null || _b === void 0 ? void 0 : _b.max_attendees) || 30;
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
                }
                catch (error) {
                    console.error('Transaction failed for booking confirmation:', error);
                    response.status(500).send(`Transaction Error: ${error}`);
                    return;
                }
            }
            else {
                console.error('No bookingId found in PaymentIntent metadata:', paymentIntent.id);
            }
            break;
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            const bookingId = paymentIntent.metadata.bookingId;
            if (bookingId) {
                console.log('Payment failed for booking:', bookingId);
                try {
                    await db.collection('bookings').doc(bookingId).update({
                        status: 'failed_payment',
                        paymentStatus: 'unpaid',
                        updatedAt: admin.firestore.Timestamp.now()
                    });
                }
                catch (error) {
                    console.error('Failed to update booking on payment failure:', error);
                }
            }
            break;
        }
        case 'charge.refunded': {
            const charge = event.data.object;
            // Charge metadata is typically inherited from the PaymentIntent
            const bookingId = charge.metadata.bookingId || charge.payment_intent && typeof charge.payment_intent !== 'string' ? (_b = charge.payment_intent.metadata) === null || _b === void 0 ? void 0 : _b.bookingId : null;
            if (bookingId) {
                console.log('Payment refunded for booking:', bookingId);
                try {
                    await db.runTransaction(async (transaction) => {
                        var _a, _b;
                        const bookingRef = db.collection('bookings').doc(bookingId);
                        const bookingDoc = await transaction.get(bookingRef);
                        if (!bookingDoc.exists)
                            return;
                        const eventId = (_a = bookingDoc.data()) === null || _a === void 0 ? void 0 : _a.eventId;
                        if (eventId) {
                            const eventRef = db.collection('events').doc(eventId);
                            // Free up the capacity
                            transaction.update(eventRef, {
                                'capacity.current_attendees': admin.firestore.FieldValue.increment(-1),
                                // Note: Removing user from attendees array would ideally require userId,
                                // which is in bookingDoc.data()?.userId
                                'attendees': admin.firestore.FieldValue.arrayRemove((_b = bookingDoc.data()) === null || _b === void 0 ? void 0 : _b.userId)
                            });
                        }
                        transaction.update(bookingRef, {
                            status: 'cancelled', // Or a distinct 'refunded' status
                            paymentStatus: 'refunded',
                            updatedAt: admin.firestore.Timestamp.now()
                        });
                    });
                }
                catch (error) {
                    console.error('Failed to update booking on refund:', error);
                }
            }
            else {
                console.log('Refund processed but no bookingId found in metadata for charge:', charge.id);
            }
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    response.json({ received: true });
});
//# sourceMappingURL=index.js.map