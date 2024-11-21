require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function main() {
  try {
    console.log('Starting script...');
    // Extract session ID from your success URL


    const sessionId = 'session_id';
    console.log('Session ID:', sessionId);

    // 1. Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Setup Intent ID:', session.setup_intent);

    // 2. Retrieve the SetupIntent to get the payment method ID
    const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent);
    console.log('Payment Method ID:', setupIntent.payment_method);

  } catch (error) {
    console.error('Error:', error);
  }
}

main();