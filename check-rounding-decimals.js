// Replace the import with require
const Stripe = require('stripe');
require('dotenv').config();


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-10-28.acacia' });

// Main function to run the script
async function main() {
    // Process in batches of 25 concurrent requests
    const batchSize = 5;
    const totalSteps = 95000;

    for (let i = totalSteps; i >= 1; i -= batchSize) {
        const promises = [];
        
        // Create batch of concurrent requests
        for (let j = 0; j < batchSize && (i - j) >= 1; j++) {
            const targetAmount = (i - j) / 100; // Convert cents back to euros
            promises.push(processAmount(targetAmount));
        }

        await Promise.all(promises);
        // Add 250ms delay between batches
        await new Promise(resolve => setTimeout(resolve, 250));
    }
}

async function processAmount(targetAmount) {
    try {
        console.log('Starting to process amount:', targetAmount);
        const totalAmount = calculateTotalAmount(targetAmount);
        
        const paymentIntent = await createStripePaymentIntent(totalAmount.totalAmountInCents);
        const stripeProcessingFee = await retrieveStripeProcessingFee(paymentIntent.id);
        const isValid = await validatePaymentIntent(totalAmount.targetAmountInCents, stripeProcessingFee.net);

        if (!isValid) {
            // Save mismatch details to a CSV file
            const fs = require('fs');
            const csvLine = `${new Date().toISOString()},${totalAmount.targetAmountInCents/100},${stripeProcessingFee.net/100},${stripeProcessingFee.fee/100},${totalAmount.roundedTotalAmount}\n`;
            fs.appendFileSync('fee_mismatches.csv', csvLine, { encoding: 'utf8' });
            console.error(
                `Mismatch detected\n --- Target Amount: €${totalAmount.targetAmountInCents/100}\n --- Net Amount: €${stripeProcessingFee.net/100}\n --- Stripe Fee: €${stripeProcessingFee.fee/100}\n ---Total Amount: €${totalAmount.roundedTotalAmount}`
            );
        }
    } catch (error) {
        console.error(`Error processing amount €${targetAmount}:`, error.message);
        console.error('Full error:', error); // Let's see the full error
    }
}

// Function to calculate Total Amount
function calculateTotalAmount(targetAmount) {
    // Convert target amount to a number and ensure 2 decimal places
    const target = Math.round(targetAmount * 100) / 100;
    const targetAmountInCents = Math.round(targetAmount * 100);
    
    // For amounts where 0.5% would exceed €5, we can simply add €5
    // To determine this, we need to check if 0.5% of (target + 5) > 5
    const totalWithMaxFee = target + 5;
    const feeAtMax = totalWithMaxFee * 0.005;
    
    let totalAmount;
    if (feeAtMax > 5) {
        // If 0.5% of (target + 5) > 5, then we use the fixed €5 fee
        totalAmount = target + 5;
    } else {
        // Otherwise, use the proportional formula
        totalAmount = target / (1 - 0.005);
    }

    const totalAmountInCents = Math.round(totalAmount * 100);
    const roundedTotalAmount = Math.round(totalAmount * 100) / 100;
    
    return {targetAmountInCents, roundedTotalAmount, totalAmountInCents};
}

// Function to create a Stripe payment intent
async function createStripePaymentIntent(totalAmountInCents) {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmountInCents,
            currency: 'eur',
            payment_method_types: ['customer_balance'],
            payment_method_data: {
                type: 'customer_balance'
            },
            payment_method_options: {
                customer_balance: {
                    bank_transfer: {
                        eu_bank_transfer: {
                            country: 'BE'
                        },
                        type: 'eu_bank_transfer'
                    },
                    funding_type: 'bank_transfer'
                }
            },
            capture_method: 'automatic',
            confirm: true,
            customer: 'cus_RF17jhuIThsmEA',
            description: 'Fee calculation test',
            statement_descriptor: 'Test-payouts'
        });
        
        return paymentIntent;
    } catch (error) {
        console.error('Error creating payment intent:', error.message);
        throw error;
    }
}

// Function to retrieve the Stripe processing fee
async function retrieveStripeProcessingFee(paymentIntentId) {
    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId,
            {
                expand: ['latest_charge.balance_transaction'],
            }
        );
        
        const balanceTransaction = paymentIntent.latest_charge.balance_transaction;
        const fee = balanceTransaction.fee;
        const net = balanceTransaction.net;
        
        return { fee, net };
    } catch (error) {
        console.error('Error retrieving processing fee:', error);
        throw error;
    }
}

// Function to validate the payment intent
async function validatePaymentIntent(targetAmountInCents, net) {
    const isEqual = targetAmountInCents === net;
    console.log(isEqual);

    return isEqual;
}

// Run the script
main().catch((error) => {
    console.error('Error running script:', error);
});
