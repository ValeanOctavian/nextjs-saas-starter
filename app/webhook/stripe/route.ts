import { db } from '@/utils/db/db'
import { usersTable } from '@/utils/db/schema'
import { eq } from "drizzle-orm";
import { stripe } from '@/utils/stripe'; // Ensure stripe is properly imported

export async function POST(request: Request) {
    console.log('Webhook received')

    const sig = request.headers.get("stripe-signature") as string;
    const body = await request.text(); // Stripe requires raw body
    try {
        const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
        console.log("Webhook Event:", event);
        const response = await request.json()
        console.log(response)
        // On subscribe, write to db
        console.log(response.data.object.customer)
        await db.update(usersTable).set({ plan: response.data.object.id }).where(eq(usersTable.stripe_id, response.data.object.customer));
        // Process the webhook payload
    } catch (error: any) {
        return new Response(`Webhook error: ${error.message}`, {
            status: 400,
        })
    }
    return new Response('Success', { status: 200 })
}
