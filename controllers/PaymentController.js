import Stripe from "stripe";
import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import UserMembership from "../models/UserMembership.js";
import Membership from "../models/MemeberShipModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const processPayment = async (req, res) => {
  try {
    console.log("The Payment Stop Here ");
    const { orderId, amount, currency = "usd" } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents
      currency,
      metadata: { orderId: order._id.toString() },
    });

    // Save the payment information in the database
    const payment = new Payment({
      amount,
      currency,
      stripePaymentId: paymentIntent.id,
      status: "pending", // Initially pending
    });

    await payment.save();

    // Link this payment to the order
    order.payment = payment._id;
    await order.save();
    console.log("Heree");
    res.status(200).json({ clientSecret: paymentIntent.client_secret }); // Return to frontend for confirmation
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const stripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(
      req.body.toString(),
      sig,
      process.env.WEBHOOK_SECRET_KEY
    );
    // Handle successful payment intent
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const stripePaymentId = paymentIntent.id;
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentId },
        { status: "succeeded" }
      );

      if (payment) {
        await Order.findOneAndUpdate(
          { payment: payment._id },
          { paymentStatus: "completed" }
        );
      }
    }

    // Handle chargeback (dispute) event
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object;
      const stripePaymentId = dispute.payment_intent; // Get associated payment intent ID

      // Mark payment and order as incomplete due to dispute
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentId },
        { status: "chargeback" }
      );

      if (payment) {
        await Order.findOneAndUpdate(
          { payment: payment._id },
          { paymentStatus: "cancelled" }
        );
      }
    }

    // Handle successful subscription payment
    if (event.type === "invoice.payment_succeeded") {
      console.log("Payment successful");
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription; // Assuming this is the subscription ID from Stripe
      const email = invoice.customer_email; // Assuming the email is passed along
      const planId = invoice.lines.data[0].plan.id; // Access plan ID

      const user = await User.findOne({ email });
      const membership = await Membership.findOne({ paymentId: planId });
      // Check if user exists
      if (user) {
        // Check if the user already has a membership
        let userMembership = await UserMembership.findOne({ userId: user._id });

        if (userMembership) {
          // If membership exists, update it
          userMembership.subscriptionId = subscriptionId;
          userMembership.status = "active";
          userMembership.endDate =
            membership.duration === "year"
              ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
              : new Date(new Date().setMonth(new Date().getMonth() + 1));
          await userMembership.save();
        } else {
          // If no membership exists, create a new one
          userMembership = new UserMembership({
            userId: user._id,
            subscriptionId,
            membershipStatus: "active",
            membershipId: membership._id,
          });
          userMembership.endDate =
            membership.duration === "year"
              ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
              : new Date(new Date().setMonth(new Date().getMonth() + 1));
          await userMembership.save();
        }

        // Update the user's membership status in the User model
        await User.findOneAndUpdate(
          { email }, // You can change this to use stripeCustomerId instead of email if needed
          { membershipStatus: "active", subscriptionId }
        );
      } else {
        console.log(`User not found for email: ${email}`);
      }
    }

    // Handle subscription cancellation or expiration
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const email = invoice.customer_email;

      const user = await User.findOne({ email });
      await UserMembership.findOneAndUpdate(
        { userId: user._id },
        { status: "expiration", subscriptionId: subscription.id }
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.log(`Webhook error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
//
