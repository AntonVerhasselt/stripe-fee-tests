require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function main() {
  try {
    // 1. Create the setup session
    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: 'customer_id', // Your existing customer ID
      payment_method_types: ['sepa_debit'],
      currency: 'eur',
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/cancel',
    });

    // 2. Print the checkout URL - you'll need to open this in a browser
    console.log('Open this URL to setup SEPA payment:', session.url);
    
    // Note: At this point, you'll need to:
    // 1. Open the URL in a browser
    // 2. Complete the SEPA setup form
    // 3. After success, you'll be redirected to your success_url
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the script
main();

