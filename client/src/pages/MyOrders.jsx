import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// Deterministic date resolver
const getOrderDate = (order) => {
  if (!order) return null;
  if (order.createdAt) return new Date(order.createdAt);
  if (order.date) return new Date(order.date);
  if (order._id) {
    try {
      const hex = order._id.toString().substring(0, 8);
      const ts = parseInt(hex, 16) * 1000;
      if (!isNaN(ts) && ts > 0) return new Date(ts);
    } catch (e) {}
  }
  return null;
};

const formatOrderDateTime = (order) => {
  const d = getOrderDate(order);
  if (!d || isNaN(d.getTime())) return "Recently Placed";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const isPickupOrder = (order) => {
  if (!order) return false;
  if (order.fulfillmentType === "Pickup") return true;
  const street = (order.address?.street || "").toLowerCase();
  const city = (order.address?.city || "").toLowerCase();
  const name = (order.address?.firstName || "").toLowerCase();
  return (
    street.includes("pickup") ||
    street.includes("counter") ||
    city.includes("counter") ||
    name.includes("pickup") ||
    name.includes("counter")
  );
};

const getStatusDetails = (status, isPickup) => {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) {
    return {
      title: "Order Cancelled",
      subtitle: "This order was cancelled within the confirmation window",
      icon: "✕",
      iconClass: "border-rose-400 bg-rose-50 text-rose-600",
      badgeColor: "text-rose-600 bg-rose-50"
    };
  }
  if (s.includes("delivered") || s.includes("collected") || s.includes("completed")) {
    return {
      title: isPickup ? "Order Collected" : "Delivered Successfully",
      subtitle: isPickup ? "Handed over at Manish Super Market" : "Delivered to your doorstep",
      icon: "✓",
      iconClass: "border-emerald-500 bg-emerald-50 text-emerald-600",
      badgeColor: "text-emerald-700 bg-emerald-50"
    };
  }
  if (s.includes("ready") || s.includes("out for delivery")) {
    return {
      title: isPickup ? "Ready for Pickup!" : "Out for Delivery",
      subtitle: isPickup ? "Waiting for you at the store counter" : "Our delivery rider is on the way",
      icon: isPickup ? "🏪" : "🚚",
      iconClass: "border-blue-500 bg-blue-50 text-blue-600",
      badgeColor: "text-blue-700 bg-blue-50"
    };
  }
  return {
    title: "Your Order is Successful",
    subtitle: isPickup ? "We are packing your items at the store" : "We have received your order",
    icon: "✓",
    iconClass: "border-emerald-500 bg-emerald-50 text-emerald-600",
    badgeColor: "text-emerald-700 bg-emerald-50"
  };
};

function MyOrders() {
  const { currency, user, axios, addToCart, navigate } = useAppContext();
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("all");

  // Live 1-second ticker for 5-minute cancellation window
  useEffect(() => {
    const ticker = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  const fetchUserOrders = async () => {
    try {
      if (!user || !user._id) return;
      const { data } = await axios.get("/api/order/user", {
        params: { userId: user._id }
      });
      if (data.success) {
        setMyOrders(data.orders || []);
      } else {
        toast.error(data.message || "Failed to load orders");
      }
    } catch (error) {
      console.log("fetchUserOrders note:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchUserOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Cancel order within 5 minutes
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }
    setCancellingId(orderId);
    try {
      const { data } = await axios.post("/api/order/cancel", { orderId });
      if (data.success) {
        toast.success("Order cancelled successfully");
        setMyOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: "Cancelled" } : o))
        );
      } else {
        toast.error(data.message || "Could not cancel order");
      }
    } catch (error) {
      toast.error(error.message || "Failed to cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  const getRemainingCancelSeconds = (order) => {
    if (order.status === "Cancelled" || order.status === "Delivered") return 0;
    const orderDate = getOrderDate(order);
    if (!orderDate) return 0;
    const elapsedMs = currentTime - orderDate.getTime();
    const fiveMinMs = 5 * 60 * 1000;
    const remainingMs = fiveMinMs - elapsedMs;
    return Math.max(0, Math.floor(remainingMs / 1000));
  };

  const copyOrderId = (id) => {
    navigator.clipboard.writeText(id);
    toast.success("Order ID copied to clipboard!");
  };

  const handleReorderAll = (order) => {
    if (!order.items || order.items.length === 0) return;
    let count = 0;
    order.items.forEach((item) => {
      const pId = item?.product?._id || item?.product;
      if (pId) {
        addToCart(pId);
        count++;
      }
    });
    if (count > 0) {
      toast.success(`Added ${count} items to cart!`);
      navigate("/cart");
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === "active") {
      return myOrders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
    }
    if (activeTab === "pickup") {
      return myOrders.filter((o) => isPickupOrder(o));
    }
    if (activeTab === "completed") {
      return myOrders.filter((o) => o.status === "Delivered");
    }
    return myOrders;
  }, [myOrders, activeTab]);

  if (!user) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto px-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
          🛍️
        </div>
        <h2 className="text-xl font-bold text-gray-900">Sign in to view orders</h2>
        <p className="text-xs text-gray-500 mt-1 mb-6">
          Track live grocery deliveries and store pickups anytime.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-primary text-white font-semibold text-xs rounded-xl shadow-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-4 px-3 sm:px-6 bg-gray-50/60">
      <div className="max-w-md mx-auto space-y-4">
        {/* Mobile Top Navigation Header */}
        <div className="flex items-center justify-between pt-2 pb-1">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-gray-700 font-semibold text-sm hover:text-primary transition"
          >
            <span className="text-lg leading-none">‹</span>
            <span>My Orders</span>
          </Link>
          <button
            onClick={fetchUserOrders}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>↻</span> Refresh
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {[
            { id: "all", label: `All (${myOrders.length})` },
            { id: "active", label: "Active" },
            { id: "pickup", label: "Store Pickups" },
            { id: "completed", label: "Delivered" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs transition cursor-pointer shrink-0 font-medium ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders Feed */}
        {loading ? (
          <div className="py-20 text-center text-xs text-gray-400">Loading your orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-200/80 shadow-xs space-y-3 mt-4">
            <p className="text-4xl">🛒</p>
            <h3 className="font-bold text-base text-gray-800">No orders here</h3>
            <p className="text-xs text-gray-500">Pick fresh groceries and place your order today!</p>
            <Link
              to="/products"
              className="inline-block mt-2 px-5 py-2 bg-primary text-white text-xs font-semibold rounded-full shadow-xs"
            >
              Shop Groceries
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map((order, index) => {
              const isPickup = isPickupOrder(order);
              const remainingCancelSecs = getRemainingCancelSeconds(order);
              const canCancel = remainingCancelSecs > 0 && order.status !== "Cancelled" && order.status !== "Delivered";
              const shortId = order._id?.slice(-8).toUpperCase() || "ORD";
              const statusInfo = getStatusDetails(order.status, isPickup);

              const subtotal = (order.items || []).reduce((acc, it) => {
                const p = it.product;
                const price = p?.offerPrice || p?.price || 0;
                return acc + price * (it.quantity || 1);
              }, 0);

              return (
                <div
                  key={order._id || index}
                  className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-6 space-y-5 transition hover:shadow-md"
                >
                  {/* 1. HERO SUCCESS / STATUS BADGE (Matches Mobile App Reference) */}
                  <div className="text-center space-y-2 pt-1">
                    <div
                      className={`w-14 h-14 rounded-full border-2 flex items-center justify-center mx-auto text-2xl font-bold transition ${statusInfo.iconClass}`}
                    >
                      {statusInfo.icon}
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        {statusInfo.title}
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {statusInfo.subtitle}
                      </p>
                    </div>

                    <div className="pt-0.5">
                      <button
                        onClick={() => copyOrderId(order._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-mono font-medium text-gray-600 transition border border-gray-200 cursor-pointer"
                        title="Click to copy Order ID"
                      >
                        <span>Order ID:</span>
                        <strong className="text-primary font-semibold">#{shortId}</strong>
                        <span className="text-[10px] text-gray-400">📋</span>
                      </button>
                    </div>
                  </div>

                  {/* Clean Divider */}
                  <div className="border-t border-gray-100" />

                  {/* 2. ESTIMATED DELIVERY / STORE PICKUP STRIP */}
                  <div className="flex items-center gap-2.5 text-xs text-gray-600">
                    <span className="text-base">{isPickup ? "🏪" : "🚚"}</span>
                    <span className="font-medium text-gray-800">
                      {isPickup
                        ? "Store Pickup at Manish Super Market"
                        : "Estimated Delivery: Today, within 20-30 mins"}
                    </span>
                  </div>

                  {/* 3. HIGHLIGHT CARD (Store Pickup PIN or Delivery Address) */}
                  {isPickup ? (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 text-emerald-950 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                          Pickup Counter PIN
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-mono font-bold text-xs rounded-full shadow-2xs">
                          #{shortId}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800/90 leading-relaxed pt-0.5">
                        Please present your PIN <strong>#{shortId}</strong> at the Manish Super Market counter to collect your order.
                      </p>
                    </div>
                  ) : (
                    order?.address && (
                      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 text-xs text-blue-900 space-y-0.5">
                        <span className="font-bold text-blue-950 block">Delivery Address</span>
                        <p className="text-blue-800 leading-snug">
                          {order.address.street}, {order.address.city}
                        </p>
                        <p className="text-blue-600 text-[11px]">
                          Contact: {order.address.phone}
                        </p>
                      </div>
                    )
                  )}

                  {/* 4. ITEMS LIST */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Ordered Items
                    </h4>
                    <div className="space-y-2.5">
                      {order.items?.map((item, itemIdx) => {
                        const product = item?.product;
                        const imageSrc =
                          (Array.isArray(product?.image) ? product?.image[0] : product?.image) ||
                          assets.upload_area;
                        const unitPrice = product?.offerPrice || product?.price || 0;
                        const quantity = item?.quantity || 1;

                        return (
                          <div
                            key={itemIdx}
                            className="flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={imageSrc}
                                alt={product?.name || "Grocery"}
                                className="w-11 h-11 rounded-xl object-contain p-1 border border-gray-100 bg-gray-50 shrink-0"
                                onError={(e) => {
                                  e.target.src = assets.upload_area;
                                }}
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">
                                  {product?.name || "Grocery Item"}
                                </p>
                                <p className="text-gray-500 text-[11px]">
                                  Qty: {quantity} • {currency}{unitPrice} each
                                </p>
                              </div>
                            </div>
                            <span className="font-bold text-gray-900 shrink-0">
                              {currency}{unitPrice * quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. PRICE SUMMARY (Itemized Breakdown matching Reference) */}
                  <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
                    <h4 className="font-bold text-gray-900 text-xs">Price Summary</h4>

                    <div className="flex justify-between text-gray-600">
                      <span>Item Total</span>
                      <span>{currency}{subtotal}</span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Charges</span>
                      <span className="text-emerald-600 font-semibold">FREE</span>
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                      <span>Grand Total</span>
                      <span className="text-base text-primary font-extrabold">
                        {currency}{order.amount}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-400 pt-0.5">
                      <span>Payment Method</span>
                      <span className="font-medium text-gray-600">
                        {order.paymentType === "COD" ? "Cash on Delivery" : "Online Payment"}
                      </span>
                    </div>
                  </div>

                  {/* 6. MOBILE ACTIONS: CANCEL (5 MIN) & REORDER */}
                  <div className="pt-2 space-y-2">
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-2xl border border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>✕ Cancel Order</span>
                        <span className="bg-rose-200/70 px-2 py-0.5 rounded-full font-mono text-[10px]">
                          {Math.floor(remainingCancelSecs / 60)}:{(remainingCancelSecs % 60).toString().padStart(2, "0")} left
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => handleReorderAll(order)}
                      className="w-full py-3 bg-primary hover:bg-primary-600 text-white font-semibold text-xs rounded-2xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>🛒</span>
                      <span>Reorder Items</span>
                    </button>
                  </div>

                  {/* Timestamp footer */}
                  <p className="text-[10px] text-gray-400 text-center pt-1">
                    Placed on {formatOrderDateTime(order)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrders;
