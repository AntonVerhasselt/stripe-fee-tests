require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentMethodId = 'pm_1QNYLsFZgnHzC8FsBpuD4aFd';

const customerIds = [
  'cus_RG3d9VG9juGXJ0',
  'cus_RG3eE1jJqoJ1Eb',
  'cus_RG3eVPcy4Gw4RU',
  'cus_RG3fSD4gVrhmM2',
  'cus_RG3fbQgHUEjrxK',
  'cus_RG3fZsIWTrOKxF',
  'cus_RG3gNnNI80mrIM',
  'cus_RG3ghAbaAIRzeX',
  'cus_RG3hV0VXlrv40K',
  'cus_RG3haVVxbt1e9d'
];

async function attachPaymentMethodToCustomers() {
  for (const customerId of customerIds) {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );
      console.log(`Successfully attached payment method to customer ${customerId}`);
    } catch (error) {
      console.error(`Error attaching payment method to customer ${customerId}:`, error.message);
    }
  }
}

attachPaymentMethodToCustomers();
