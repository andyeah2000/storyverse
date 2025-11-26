// Supabase Edge Function: Billing + Stripe integration
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.5';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const proPriceId = Deno.env.get('STRIPE_PRICE_PRO_ID') ?? '';
const creditPriceId = Deno.env.get('STRIPE_PRICE_CREDITS_ID') ?? '';
const creditPackageAmount = Number(Deno.env.get('CREDIT_PACKAGE_AMOUNT') ?? '100');
const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:5173';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

const planFromPrice = (priceId: string | null | undefined): 'free' | 'pro' => {
  if (!priceId) return 'free';
  return priceId === proPriceId ? 'pro' : 'free';
};

const upsertSubscription = async ({
  userId,
  customerId,
  subscriptionId,
  priceId,
  status,
  currentPeriodEnd,
}: {
  userId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  priceId?: string | null;
  status?: string | null;
  currentPeriodEnd?: number | null;
}) => {
  const plan = planFromPrice(priceId);
  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId ?? undefined,
      stripe_subscription_id: subscriptionId ?? undefined,
      plan,
      status: status ?? 'inactive',
      current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    }, { onConflict: 'user_id' });
};

const ensureSubscriptionRecord = async (userId: string) => {
  await supabaseAdmin
    .from('subscriptions')
    .upsert({ user_id: userId }, { onConflict: 'user_id' });
};

const getUserFromAuthHeader = async (authHeader: string | null) => {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    if (url.pathname.endsWith('/create-checkout-session') && req.method === 'POST') {
      if (!stripe) {
        return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const user = await getUserFromAuthHeader(req.headers.get('Authorization'));
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const body = await req.json().catch(() => ({}));
      const priceId = body.priceId || proPriceId;
      if (!priceId) {
        return new Response(JSON.stringify({ error: 'Missing price configuration' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await ensureSubscriptionRecord(user.id);

      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        success_url: `${appUrl}/billing?status=success`,
        cancel_url: `${appUrl}/billing?status=cancelled`,
        customer: existing?.stripe_customer_id ?? undefined,
        customer_email: existing?.stripe_customer_id ? undefined : user.email ?? undefined,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { metadata: { user_id: user.id } },
        metadata: { user_id: user.id },
      });

      return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname.endsWith('/create-portal-session') && req.method === 'POST') {
      if (!stripe) {
        return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const user = await getUserFromAuthHeader(req.headers.get('Authorization'));
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: subscription } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!subscription?.stripe_customer_id) {
        return new Response(JSON.stringify({ error: 'No active subscription' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const portal = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${appUrl}/billing`,
      });

      return new Response(JSON.stringify({ url: portal.url }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname.endsWith('/create-credit-session') && req.method === 'POST') {
      if (!stripe || !creditPriceId) {
        return new Response(JSON.stringify({ error: 'Credit purchases not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const user = await getUserFromAuthHeader(req.headers.get('Authorization'));
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      await ensureSubscriptionRecord(user.id);

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${appUrl}/billing?status=topup_success`,
        cancel_url: `${appUrl}/billing?status=cancelled`,
        customer_email: user.email ?? undefined,
        line_items: [{ price: creditPriceId, quantity: 1 }],
        metadata: { user_id: user.id, type: 'credit_topup' },
      });

      return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (url.pathname.endsWith('/webhook') && req.method === 'POST') {
      if (!stripe || !stripeWebhookSecret) {
        return new Response(JSON.stringify({ error: 'Webhook not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const signature = req.headers.get('stripe-signature');
      const body = await req.text();

      let event;
      try {
        event = stripe.webhooks.constructEvent(body, signature ?? '', stripeWebhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed', err);
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      switch (event.type) {
        case 'checkout.session.completed': {
          if (!stripe) break;
          const session = event.data.object as Stripe.Checkout.Session;

          if (session.mode === 'subscription') {
            const subscriptionId = session.subscription?.toString();
            if (subscriptionId) {
              const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] });
              const userId = subscription.metadata?.user_id || session.metadata?.user_id;
              if (userId) {
                await upsertSubscription({
                  userId,
                  customerId: subscription.customer?.toString(),
                  subscriptionId: subscription.id,
                  priceId: subscription.items.data[0]?.price?.id,
                  status: subscription.status,
                  currentPeriodEnd: subscription.current_period_end,
                });
              }
            }
          } else if (session.mode === 'payment') {
            if (!creditPriceId) break;
            const expandedSession = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items'] });
            const priceId = expandedSession.line_items?.data?.[0]?.price?.id;
            const userId = session.metadata?.user_id;
            if (userId && priceId === creditPriceId) {
              await ensureSubscriptionRecord(userId);
              const { error } = await supabaseAdmin.rpc('add_credits', { target_user: userId, credit_amount: creditPackageAmount });
              if (error) {
                console.error('Failed to add credits', error);
              }
            }
          }
          break;
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.user_id;
          if (userId) {
            await upsertSubscription({
              userId,
              customerId: subscription.customer?.toString(),
              subscriptionId: subscription.id,
              priceId: subscription.items.data[0]?.price?.id,
              status: subscription.status,
              currentPeriodEnd: subscription.current_period_end,
            });
          }
          break;
        }
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const userId = subscription.metadata?.user_id;
          if (userId) {
            await upsertSubscription({
              userId,
              customerId: subscription.customer?.toString(),
              subscriptionId: subscription.id,
              priceId: subscription.items.data[0]?.price?.id,
              status: 'cancelled',
              currentPeriodEnd: subscription.current_period_end,
            });
          }
          break;
        }
        default:
          console.log('Unhandled event type', event.type);
      }

      return new Response(JSON.stringify({ received: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Billing function error', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
