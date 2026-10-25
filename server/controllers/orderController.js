import Order from "../models/Order.js";
import Product from "../models/Product.js";
import stripe from "stripe";
import User from "../models/User.js";
import Address from "../models/Address.js";

// Helper to resolve stable creation date
const resolveOrderWithTimestamp = (order) => {
  const obj = order.toObject ? order.toObject() : { ...order };
  if (!obj.createdAt) {
    if (obj._id) {
      try {
        const hex = obj._id.toString().substring(0, 8);
        const ts = parseInt(hex, 16) * 1000;
        if (!isNaN(ts) && ts > 0) {
          obj.createdAt = new Date(ts);
        }
      } catch (e) {}
    }
  }
  return obj;
};

// Automatic one-time self-healing of legacy orders missing createdAt
const healLegacyOrders = async () => {
  try {
    const legacyOrders = await Order.find({ createdAt: { $exists: false } }).limit(50);
    for (const lo of legacyOrders) {
      try {
        const hex = lo._id.toString().substring(0, 8);
        const ts = parseInt(hex, 16) * 1000;
        const d = new Date(ts);
        await Order.findByIdAndUpdate(lo._id, { createdAt: d, updatedAt: d });
      } catch (e) {}
    }
  } catch (e) {}
};

export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address, fulfillmentType } = req.body;
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

    const isPickup = fulfillmentType === "Pickup";

    let addressId = typeof address === "object" && address !== null ? address._id : address;
    let validAddress = null;

    if (addressId) {
      validAddress = await Address.findById(addressId);
    }

    if (isPickup) {
      // Store Pickup: Self-pickup at Manish Super Market
      if (!validAddress) {
        validAddress = await Address.findOne({
          userId: finalUserId,
          street: "Manish Super Market Counter (Self-Pickup)"
        });

        if (!validAddress) {
          validAddress = await Address.create({
            firstName,
            lastName,
            email: userDoc.email,
            street: "Manish Super Market Counter (Self-Pickup)",
            city: "Shop Counter Pickup",
            state: "Store Counter",
            zipcode: "380001",
            country: "India",
            phone,
            userId: finalUserId
          });
        }
        addressId = validAddress._id;
      }
    } else {
      // Home Delivery: require street address
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

    const orderTime = new Date();

    const order = await Order.create({
      userId: finalUserId,
      items,
      amount,
      address: addressId,
      fulfillmentType: isPickup ? "Pickup" : "Delivery",
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
      message: isPickup
        ? "Order placed successfully! Please come and take your order from the shop counter."
        : "Order placed successfully via Cash on Delivery!",
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
    const { userId, items, address, fulfillmentType } = req.body;
    const finalUserId = userId || req.user?._id;

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

    const isPickup = fulfillmentType === "Pickup";

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

    if (isPickup) {
      if (!validAddress) {
        validAddress = await Address.findOne({
          userId: finalUserId,
          street: "Manish Super Market Counter (Self-Pickup)"
        });

        if (!validAddress) {
          validAddress = await Address.create({
            firstName,
            lastName,
            email: userDoc.email,
            street: "Manish Super Market Counter (Self-Pickup)",
            city: "Shop Counter Pickup",
            state: "Store Counter",
            zipcode: "380001",
            country: "India",
            phone,
            userId: finalUserId
          });
        }
        addressId = validAddress._id;
      }
    } else {
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
    }

    const orderTime = new Date();

    const order = await Order.create({
      userId: finalUserId,
      items,
      amount,
      address: addressId,
      fulfillmentType: isPickup ? "Pickup" : "Delivery",
      paymentType: "Online",
      isPaid: false,
      status: "Order Placed",
      createdAt: orderTime,
      updatedAt: orderTime
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({
        success: false,
        message: "Online payments (Stripe) are currently disabled. Please select Cash on Delivery (COD)."
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
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      };
    });

    const session = await stripeInstance.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/my-orders`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: finalUserId.toString()
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

    // heal any legacy orders in the background
    healLegacyOrders();

    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }]
    })
      .populate("items.product")
      .populate("address")
      .sort({ createdAt: -1 });

    const processedOrders = orders.map(resolveOrderWithTimestamp);

    return res.json({ success: true, orders: processedOrders });
  } catch (error) {
    console.log("Error in getUserOrder:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    healLegacyOrders();

    const orders = await Order.find({})
      .populate("items.product")
      .populate("address")
      .populate("userId", "name firstName lastName email phone")
      .sort({ createdAt: -1 });

    const processedOrders = orders.map(resolveOrderWithTimestamp);

    return res.json({ success: true, orders: processedOrders });
  } catch (error) {
    console.log("Error in getAllOrders:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Customer 5-minute order cancellation
export const cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const currentUserId = req.user?._id;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Verify ownership
    if (currentUserId && order.userId?.toString() !== currentUserId.toString()) {
      return res.json({ success: false, message: "Unauthorized to cancel this order" });
    }

    if (order.status === "Cancelled") {
      return res.json({ success: false, message: "Order is already cancelled" });
    }

    if (order.status === "Delivered") {
      return res.json({ success: false, message: "Delivered orders cannot be cancelled" });
    }

    // Check order placement timestamp
    let orderTime = order.createdAt;
    if (!orderTime && order._id) {
      try {
        const hex = order._id.toString().substring(0, 8);
        const ts = parseInt(hex, 16) * 1000;
        if (!isNaN(ts) && ts > 0) orderTime = new Date(ts);
      } catch (e) {}
    }
    if (!orderTime) orderTime = new Date();

    const elapsedMs = Date.now() - new Date(orderTime).getTime();
    const fiveMinutesMs = 5 * 60 * 1000;

    if (elapsedMs > fiveMinutesMs) {
      const elapsedMins = Math.floor(elapsedMs / 60000);
      return res.json({
        success: false,
        message: `Cancellation window expired. Orders can only be cancelled within 5 minutes of placing (Order was placed ${elapsedMins} minute${elapsedMins === 1 ? "" : "s"} ago).`
      });
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    order.cancellationReason = reason || "Cancelled by customer within 5-minute window";
    order.updatedAt = new Date();
    await order.save();

    return res.json({
      success: true,
      message: "Order has been successfully cancelled.",
      order
    });
  } catch (error) {
    console.log("Error in cancelOrder:", error.message);
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
