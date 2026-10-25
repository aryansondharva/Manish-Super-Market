import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import User from "../models/User.js";
import Address from "../models/Address.js";

export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    const finalUserId = userId || req.user?._id;

    if (!finalUserId) {
      return res.json({ success: false, message: "User authentication required to place an order" });
    }

    if (!address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid Data: Address and items are required" });
    }

    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        amount += (product.offerPrice || product.price) * item.quantity;
      }
    }
    // 2% tax
    amount += Math.floor(amount * 0.02);

    let addressId = typeof address === "object" && address !== null ? address._id : address;

    // Verify or create address in MongoDB
    let validAddress = null;
    if (addressId) {
      validAddress = await Address.findById(addressId);
    }

    if (!validAddress) {
      const addrObj = typeof address === "object" && address !== null ? address : {};
      const newAddr = await Address.create({
        firstName: addrObj.firstName || "Customer",
        lastName: addrObj.lastName || "User",
        email: addrObj.email || "customer@grocery.com",
        street: addrObj.street || "123 Main Street",
        city: addrObj.city || "New York",
        state: addrObj.state || "NY",
        zipcode: addrObj.zipcode || "10001",
        country: addrObj.country || "USA",
        phone: addrObj.phone || "+1 555-0100",
        userId: finalUserId
      });
      addressId = newAddr._id;
    }

    const order = await Order.create({
      userId: finalUserId,
      items,
      amount,
      address: addressId,
      paymentType: "COD",
      status: "Order Placed"
    });

    try {
      await User.findByIdAndUpdate(finalUserId, { cartItems: {} });
    } catch (e) {
      // Ignore if user model update fails
    }

    return res.json({
      success: true,
      message: "Order Placed Successfully",
      orderId: order._id
    });
  } catch (error) {
    console.log("Error in placeOrderCOD:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, address } = req.body;
    const finalUserId = userId || req.user?._id;
    const { origin } = req.headers;

    if (!finalUserId) {
      return res.json({ success: false, message: "User authentication required" });
    }

    if (!address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid Data" });
    }

    let productData = [];
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (product) {
        productData.push({
          name: product.name,
          price: product.offerPrice || product.price,
          quantity: item.quantity
        });
        amount += (product.offerPrice || product.price) * item.quantity;
      }
    }
    amount += Math.floor(amount * 0.02);

    let addressId = typeof address === "object" && address !== null ? address._id : address;
    let validAddress = null;
    if (addressId) {
      validAddress = await Address.findById(addressId);
    }
    if (!validAddress) {
      const addrObj = typeof address === "object" && address !== null ? address : {};
      const newAddr = await Address.create({
        firstName: addrObj.firstName || "Customer",
        lastName: addrObj.lastName || "User",
        email: addrObj.email || "customer@grocery.com",
        street: addrObj.street || "123 Main Street",
        city: addrObj.city || "New York",
        state: addrObj.state || "NY",
        zipcode: addrObj.zipcode || "10001",
        country: addrObj.country || "USA",
        phone: addrObj.phone || "+1 555-0100",
        userId: finalUserId
      });
      addressId = newAddr._id;
    }

    const order = await Order.create({
      userId: finalUserId,
      items,
      amount,
      address: addressId,
      paymentType: "Online"
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        success: false,
        message: "Stripe key not configured. Please use COD (Cash On Delivery)."
      });
    }

    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const lineItems = productData.map((item) => {
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name
          },
          unit_amount: Math.floor(item.price + item.price * 0.02) * 100
        },
        quantity: item.quantity
      };
    });

    const session = await stripeInstance.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: finalUserId
      }
    });
    return res.json({ success: true, url: session.url });
  } catch (error) {
    console.log("Error in placeOrderStripe:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const stripeWebhooks = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(400).send("Stripe not configured");
  }
  const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const paymnetIntentId = paymentIntent.id;
        const session = await stripeInstance.checkout.sessions.list({
          payment_intent: paymnetIntentId
        });
        const { orderId, userId } = session.data[0].metadata;
        await Order.findByIdAndUpdate(orderId, { isPaid: true });
        await User.findByIdAndUpdate(userId, { cartItems: {} });
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
        break;
    }
    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export const getUserOrder = async (req, res) => {
  try {
    const userId = req.query?.userId || req.user?._id;
    if (!userId) {
      return res.json({ success: true, orders: [] });
    }
    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }]
    })
      .populate("items.product")
      .populate("address")
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    console.log("Error in getUserOrder:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }]
    })
      .populate("items.product")
      .populate("address")
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    console.log("Error in getAllOrders:", error.message);
    return res.json({ success: false, message: error.message });
  }
};
