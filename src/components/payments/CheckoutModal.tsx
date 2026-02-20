import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { X, Loader2, Lock } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { WaiverModal } from '../auth/WaiverModal';

// Initialize Stripe (Replace with your Publishable Key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    amount: number; // in cents
    venueName: string;
    bookingTitle: string;
    destinationAccountId: string; // The Venue's Stripe Account ID
    bookingId: string; // Required for backend tracking
}

const CheckoutForm: React.FC<{ amount: number, onClose: () => void, onSuccess: () => void }> = ({ amount, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setLoading(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL where the customer should be redirected after the payment
                return_url: window.location.href,
            },
            redirect: 'if_required', // Handle redirect manually if needed, or stick to 'always'
        });

        if (error) {
            setErrorMessage(error.message || 'Payment failed');
            showToast(error.message || 'Payment failed', 'error');
            setLoading(false);
        } else {
            // Payment Succeeded
            showToast('Payment successful!', 'success');
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {errorMessage && <div className="text-red-500 text-sm mt-2">{errorMessage}</div>}

            <button
                type="submit"
                disabled={!stripe || loading}
                className="w-full mt-6 py-3 bg-[#635BFF] hover:bg-[#5349E0] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <Lock className="w-4 h-4" /> Pay ${(amount / 100).toFixed(2)}
                    </>
                )}
            </button>
        </form>
    );
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, amount, venueName, bookingTitle, destinationAccountId, bookingId }) => {
    const { userData } = useAuth();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const { showToast } = useToast();
    const [showWaiver, setShowWaiver] = useState(false);

    // Initial Waiver Check
    useEffect(() => {
        if (isOpen && userData && !userData.waiverAgreed) {
            setShowWaiver(true);
        }
    }, [isOpen, userData]);

    useEffect(() => {
        if (isOpen && amount > 0 && destinationAccountId && !showWaiver) { // Only force create PI if waiver is satisfied or not needed
            // Create PaymentIntent when modal opens
            const createPI = async () => {
                try {
                    const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
                    const result = await createPaymentIntent({
                        amount,
                        currency: 'usd',
                        destinationAccountId,
                        bookingId, // Pass the ID
                    });
                    const data = result.data as { clientSecret: string };
                    setClientSecret(data.clientSecret);
                } catch (error: any) {
                    console.error("Failed to init payment:", error);
                    showToast("Failed to initialize payment", "error");
                }
            };
            createPI();
        }
    }, [isOpen, amount, destinationAccountId, showWaiver, bookingId]);

    const handleWaiverSuccess = () => {
        setShowWaiver(false);
        // Payment intent will trigger via effect
    };

    if (!isOpen) return null;

    return (
        <>
            <WaiverModal
                isOpen={showWaiver}
                onClose={() => { setShowWaiver(false); onClose(); }}
                onSuccess={handleWaiverSuccess}
            />

            {/* Only show checkout if waiver not showing (or allow it to render behind? Better to hide or show underneath) */}
            {/* We'll keep it rendered but maybe obscured by waiver modal (z-index) */}

            <div className={`fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in ${showWaiver ? 'invisible' : ''}`}>
                <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in relative">

                    {/* Header */}
                    <div className="p-6 border-b border-white/10 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-white">Secure Checkout</h2>
                            <div className="mt-1 text-sm text-text-muted">
                                Paying <span className="text-white font-bold">{venueName}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-white text-sm">{bookingTitle}</h3>
                                <p className="text-xs text-text-muted">One-time payment</p>
                            </div>
                            <div className="text-xl font-black text-white">
                                ${(amount / 100).toFixed(2)}
                            </div>
                        </div>

                        {clientSecret ? (
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', labels: 'floating' } }}>
                                <CheckoutForm
                                    amount={amount}
                                    onClose={onClose}
                                    onSuccess={() => {
                                        onClose();
                                        // Trigger booking confirmation logic here
                                    }}
                                />
                            </Elements>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                                <p className="text-sm text-text-muted">Initializing secure payment...</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-black/20 text-center text-[10px] text-white/30 border-t border-white/5">
                        <Lock className="w-3 h-3 inline-block mr-1" />
                        Payments processed securely by Stripe. Your card information is never stored on our servers.
                    </div>
                </div>
            </div>
        </>
    );
};
