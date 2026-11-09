import { Stripe } from 'stripe';
import { db } from '../db/db';
import { usersTable } from '../db/schema';
import { eq } from "drizzle-orm";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const PUBLIC_URL = process.env.NEXT_PUBLIC_WEBSITE_URL ? process.env.NEXT_PUBLIC_WEBSITE_URL : "http://localhost:3000"
export async function getStripePlan(email: string) {

    const user = await db.select().from(usersTable).where(eq(usersTable.email, email))
    const subscription = await stripe.subscriptions?.retrieve(
        user[0]?.plan
    );
    const productId = subscription.items.data[0].plan.product as string
    const product = await stripe.products.retrieve(productId)
    return product.name
}

export async function createStripeCustomer(id: string, email: string, name?: string) {
    console.log(id, email, 'createStripeCustomer');
    const customer = await stripe.customers.create({
        name: name ? name : "",
        email: email,
        metadata: {
            supabase_id: id
        }
    });
    // Create a new customer in Stripe
    return customer.id
}

export async function createStripeCheckoutSession(email: string) {
    console.log(email,'email');
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email))
    console.log(user, 'createStripeCheckoutSession');
    const customerSession = await stripe.customerSessions.create({
        customer: user[0]?.stripe_id,
        components: {
            pricing_table: {
                enabled: true,
            },
        },
    });
    return customerSession.client_secret
}

export async function generateStripeBillingPortalLink(email: string) {
    console.log(email,'email');
    const user = await db.select().from(usersTable).where(eq(usersTable.email, email))
    console.log(user,'generateStripeBillingPortalLink');
    const portalSession = await stripe.billingPortal.sessions.create({
        customer: user[0]?.stripe_id,
        return_url: `${PUBLIC_URL}/dashboard`,
    });
    return portalSession.url
}
