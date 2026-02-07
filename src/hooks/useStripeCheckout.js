import { supabase } from '../lib/supabase';

export const useStripeCheckout = () => {
    const redirectToCheckout = async (priceId) => {
        try {
            if (!priceId || priceId.startsWith('price_xxx') || priceId.startsWith('price_test')) {
                alert('⚠️ Stripe not configured yet!\n\nPlease create products in Stripe Dashboard and update .env file with actual Price IDs.');
                return;
            }

            // Call Supabase Edge Function to create checkout session
            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    priceId,
                    successUrl: import.meta.env.VITE_SUCCESS_URL || window.location.origin + '/BayRechnung/success',
                    cancelUrl: import.meta.env.VITE_CANCEL_URL || window.location.origin + '/BayRechnung/',
                },
            });

            if (error) {
                console.error('Checkout session creation error:', error);
                alert('❌ Failed to create checkout session: ' + error.message);
                return;
            }

            if (data?.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err) {
            console.error('Stripe checkout error:', err);
            alert('❌ Failed to initialize payment: ' + err.message);
        }
    };

    return { redirectToCheckout };
};
