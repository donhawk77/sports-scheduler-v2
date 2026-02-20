import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Listens for changes to Booking documents.
 * Triggers notifications when a booking is confirmed, failed, or refunded.
 */
export const onBookingStatusChange = functions.firestore
    .document('bookings/{bookingId}')
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        // Check if the status field changed
        if (before.status === after.status) {
            return null;
        }

        const userId = after.userId;
        const bookingId = context.params.bookingId;
        const eventTitle = after.eventTitle || 'Your Session';

        let notificationData = null;

        switch (after.status) {
            case 'confirmed':
                notificationData = {
                    userId: userId,
                    title: 'Booking Confirmed!',
                    message: `You are locked in for ${eventTitle}.`,
                    type: 'booking_confirmed',
                    link: `/profile`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    relatedId: bookingId
                };
                break;
            case 'failed_payment':
            case 'failed_overbooked':
                notificationData = {
                    userId: userId,
                    title: 'Booking Failed',
                    message: `Your booking for ${eventTitle} could not be completed.`,
                    type: 'booking_failed',
                    link: `/explore`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    relatedId: bookingId
                };
                break;
            case 'cancelled':
                if (after.paymentStatus === 'refunded') {
                    notificationData = {
                        userId: userId,
                        title: 'Booking Refunded',
                        message: `Your booking for ${eventTitle} has been cancelled and refunded.`,
                        type: 'booking_refunded',
                        link: `/profile`,
                        read: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        relatedId: bookingId
                    };
                }
                break;
            default:
                break;
        }

        if (notificationData) {
            try {
                // Write to a central notifications collection for the UI to consume
                await db.collection('notifications').add(notificationData);
                console.log(`Notification created for user ${userId} regarding booking ${bookingId}`);

                // TODO (Future phase): Trigger SendGrid email or FCM Push notification here
            } catch (error) {
                console.error('Error creating notification:', error);
            }
        }

        return null;
    });
