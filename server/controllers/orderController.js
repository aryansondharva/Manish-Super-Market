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

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Your cart is empty. Add items to buy." });
    }

    const userDoc = await User.findById(finalUserId);
    if (!userDoc) {
      return res.json({ success: false, message: "User account not found" });
    }

    const firstName = (userDoc.firstName || userDoc.name?.split(" ")[0] || "").trim();
    const lastName = (userDoc.lastName || userDoc.name?.split(" ").slice(1).join(" ") || "").trim();
    const phone = (userDoc.phone || "").trim();

    if (!firstName || !lastName || !phone) {
      return res.json({
        success: false,
        requireProfile: true,
        message: "Please complete your profile (First Name, Last Name, and Phone Number) before placing your order."
      });
    }

    if (!address) {
      return res.json({
        success: false,
        requireAddress: true,
        message: "Please add and select a valid delivery address before placing your order."
      });
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

    // Verify address in MongoDB
    let validAddress = null;
    if (addressId) {
      validAddress = await Address.findById(addressId);
    }

    // If an address object was passed directly without prior ID
    if (!validAddress && typeof address === "object" && address !== null && address.street) {
      validAddress = await Address.create({
        firstName: address.firstName || firstName,
        lastName: address.lastName || lastName,
        email: address.email || userDoc.email,
        street: address.street,
        city: address.city,
        state: address.state,
        zipcode: address.zipcode,
        country: address.country || "India",
        phone: address.phone || phone,
        userId: finalUserId
      });
      addressId = validAddress._id;
    }

    if (!validAddress) {
      return res.json({
        success: false,
        requireAddress: true,
        message: "Valid delivery address not found. Please add your real address before checkout."
      });
    }

    const orderTime = new Date();

    const order = await Order.create({
      userId: finalUserId,
      items,
      amount,
      address: addressId,
      paymentType: "COD",
      isPaid: false,
      status: "Order Placed",
      createdAt: orderTime,
      updatedAt: orderTime
    });

    // Clear user's cart in DB
    await User.findByIdAndUpdate(finalUserId, { cartItems: {} });

    return res.json({
      success: true,
      message: "Order placed successfully via Cash on Delivery!",
      orderId: order._id,
      createdAt: order.createdAt
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

    if (!items || items.length === 0) {
      return res.json({ success: false, message: "Your cart is empty. Add items to buy." });
    }

    const userDoc = await User.findById(finalUserId);
    if (!userDoc) {
      return res.json({ success: false, message: "User account not found" });
    }

    const firstName = (userDoc.firstName || userDoc.name?.split(" ")[0] || "").trim();
    const lastName = (userDoc.lastName || userDoc.name?.split(" ").slice(1).join(" ") || "").trim();
    const phone = (userDoc.phone || "").trim();

    if (!firstName || !lastName || !phone) {
      return res.json({
        success: false,
        requireProfile: true,
        message: "Please complete your profile (First Name, Last Name, and Phone Number) before placing your order."
      });
    }

    if (!address) {
      return res.json({
        success: false,
        requireAddress: true,
        message: "Please add and select a valid delivery address before placing your order."
      });
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

    if (!validAddress && typeof address === "object" && address !== null && address.street) {
      validAddress = await Address.create({
        firstName: address.firstName || firstName,
        lastName: address.lastName || lastName,
        email: address.email || userDoc.email,
        street: address.street,
        city: address.city,
        state: address.state,
        zipcode: address.zipcode,
        country: address.country || "India",
        phone: address.phone || phone,
        userId: finalUserId
      });
      addressId = validAddress._id;
    }

    if (!validAddress) {
      return res.json({
        success: false,
        requireAddress: true,
        message: "Valid delivery address not found. Please add your real address before checkout."
      });
    }

    const orderTime = new Date();

    const order = await Order.create({
      userId: finalUserId,
      items,
      amount,
      address: addressId,
      paymentType: "Online",
      isPaid: false,
      status: "Order Placed",
      createdAt: orderTime,
      updatedAt: orderTime
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
          currency: "inr",
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
        await Order.findByIdAndUpdate(orderId, { isPaid: true, updatedAt: new Date() });
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
    const orders = await Order.find({})
      .populate("items.product")
      .populate("address")
      .populate("userId", "name firstName lastName email phone")
      .sort({ createdAt: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    console.log("Error in getAllOrders:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Admin order status update
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status, isPaid } = req.body;
    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const updateFields = { updatedAt: new Date() };
    if (status) updateFields.status = status;
    if (typeof isPaid === "boolean") updateFields.isPaid = isPaid;

    const order = await Order.findByIdAndUpdate(orderId, updateFields, { new: true })
      .populate("items.product")
      .populate("address")
      .populate("userId", "name firstName lastName email phone");

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    return res.json({
      success: true,
      message: `Order #${orderId.slice(-6)} status updated to "${order.status}"`,
      order
    });
  } catch (error) {
    console.log("Error in updateOrderStatus:", error.message);
    return res.json({ success: false, message: error.message });
  }
};
