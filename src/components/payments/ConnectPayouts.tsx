import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase';
import { DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface ConnectPayoutsProps {
    className?: string;
}

export const ConnectPayouts: React.FC<ConnectPayoutsProps> = ({ className }) => {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    // const functions = getFunctions(); // Removed local init

    const handleConnect = async () => {
        setLoading(true);
        try {
            const createConnectAccount = httpsCallable(functions, 'createConnectAccount');
            const result = await createConnectAccount({
                redirectUrl: window.location.href, // Return to current page
            });

            const { url } = result.data as { url: string };
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No redirect URL returned');
            }
        } catch (error: any) {
            console.error('Payout Connect Error:', error);
            showToast(error.message || 'Failed to initiate payout connection', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-white/5 border border-white/10 rounded-xl p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 text-green-500 rounded-lg">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Accept Payments</h3>
                        <p className="text-sm text-white/60">Connect Stripe to receive payouts</p>
                    </div>
                </div>
            </div>

            <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-3 bg-[#635BFF] hover:bg-[#5349E0] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Connecting...
                    </>
                ) : (
                    <>
                        Setup Payouts <ExternalLink className="w-4 h-4" />
                    </>
                )}
            </button>
            <p className="text-xs text-center text-white/40 mt-3">
                Secure payments powered by Stripe Connect
            </p>
        </div>
    );
};
