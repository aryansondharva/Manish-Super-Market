import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "user"
    },
    items: [
      {
        product: {
          type: String,
          required: true,
          ref: "product"
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ],
    amount: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      ref: "address"
    },
    fulfillmentType: {
      type: String,
      enum: ["Delivery", "Pickup"],
      default: "Delivery"
    },
    status: {
      type: String,
      default: "Order Placed"
    },
    paymentType: {
      type: String,
      required: true
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String,
      default: ""
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Order = mongoose.models.order || mongoose.model("order", orderSchema);

export default Order;
