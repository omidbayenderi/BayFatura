import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { priceId, successUrl, cancelUrl } = await req.json();

        if (!priceId) {
            throw new Error('Price ID is required');
        }

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            throw new Error('STRIPE_SECRET_KEY is missing');
        }

        const stripe = new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        });

        console.log('Creating checkout session for price:', priceId);

        const origin = req.headers.get('origin') || 'http://localhost:5173';

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription', // Change to 'payment' if this is a one-time purchase
            success_url: successUrl || `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || origin,
            allow_promotion_codes: true,
        });

        console.log('Session created:', session.id);

        return new Response(
            JSON.stringify({ url: session.url }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error creating checkout session:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        );
    }
});
