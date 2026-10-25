import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

// Deterministic date resolver: uses createdAt, date, or ObjectId timestamp (NEVER Date.now())
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

const formatCurrency = (amount, symbol = "₹") => {
  const num = Number(amount) || 0;
  return `${symbol}${num.toLocaleString("en-IN")}`;
};

// 4-step progress stages
const getProgressStepIndex = (status, isPickup) => {
  if (status === "Cancelled") return -1;
  const s = (status || "").toLowerCase();
  if (s.includes("delivered") || s.includes("collected") || s.includes("completed")) return 4;
  if (s.includes("out for delivery") || s.includes("ready for pickup") || s.includes("ready")) return 3;
  if (s.includes("packing") || s.includes("packed")) return 2;
  return 1; // Order Placed / Confirmed
};

const ORDER_STEPS_DELIVERY = [
  { label: "Order Placed", desc: "We received your order" },
  { label: "Packed at Store", desc: "Items inspected & bagged" },
  { label: "Out for Delivery", desc: "Rider is on the way" },
  { label: "Delivered", desc: "Handed over at doorstep" }
];

const ORDER_STEPS_PICKUP = [
  { label: "Order Placed", desc: "We received your order" },
  { label: "Being Packed", desc: "Gathering fresh items" },
  { label: "Ready for Pickup", desc: "Waiting at shop counter" },
  { label: "Collected", desc: "Handed over to customer" }
];

function MyOrders() {
  const { currency, user, axios, addToCart, navigate } = useAppContext();
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // 1-second live ticker for remaining 5-minute cancellation window
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
    if (!window.confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
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

  // Compute remaining cancellation window in seconds (5 minutes = 300s)
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
    setCopiedId(id);
    toast.success("Order ID copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleReorderItem = (productId, name) => {
    if (!productId) return;
    addToCart(productId);
    toast.success(`Added ${name || "item"} back to cart!`);
  };

  const handleReorderAll = (order) => {
    if (!order.items || order.items.length === 0) return;
    let addedCount = 0;
    order.items.forEach((item) => {
      const pId = item?.product?._id || item?.product;
      if (pId) {
        addToCart(pId);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`Added ${addedCount} items to cart!`);
      navigate("/cart");
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === "active") {
      return myOrders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
    }
    if (activeTab === "completed") {
      return myOrders.filter((o) => o.status === "Delivered");
    }
    if (activeTab === "cancelled") {
      return myOrders.filter((o) => o.status === "Cancelled");
    }
    if (activeTab === "pickup") {
      return myOrders.filter((o) => o.fulfillmentType === "Pickup");
    }
    return myOrders;
  }, [myOrders, activeTab]);

  if (!user) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl shadow-xs">
          📦
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Sign in to view your orders</h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Track active grocery deliveries, store pickups, and past orders with real-time updates.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary-600 transition shadow-md shadow-primary/20"
        >
          Sign In / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-6 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Link to="/" className="hover:text-primary transition">Home</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">My Orders</span>
      </nav>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Order History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track live deliveries, manage store pickups, and review invoices from Manish Super Market.
          </p>
        </div>

        <button
          onClick={fetchUserOrders}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer self-start sm:self-auto"
        >
          <span>↻</span>
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 text-xs font-medium border-b border-slate-100 scrollbar-none">
        {[
          { id: "all", label: `All Orders (${myOrders.length})` },
          { id: "active", label: "In Progress" },
          { id: "pickup", label: "Store Pickups" },
          { id: "completed", label: "Delivered" },
          { id: "cancelled", label: "Cancelled" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 text-white font-semibold shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading your grocery orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center mt-8 space-y-4 shadow-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            🛒
          </div>
          <h3 className="text-lg font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "all"
              ? "You haven't placed any grocery orders yet. Explore our fresh inventory and fill your basket!"
              : `No orders under the '${activeTab}' filter.`}
          </p>
          <Link
            to="/products"
            className="inline-block mt-2 px-6 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary-600 transition shadow-sm"
          >
            Explore Groceries
          </Link>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {filteredOrders.map((order, index) => {
            const isPickup = order.fulfillmentType === "Pickup";
            const remainingCancelSecs = getRemainingCancelSeconds(order);
            const canCancel = remainingCancelSecs > 0 && order.status !== "Cancelled" && order.status !== "Delivered";
            const isCancelled = order.status === "Cancelled";
            const isDelivered = order.status === "Delivered";

            const currentStep = getProgressStepIndex(order.status, isPickup);
            const steps = isPickup ? ORDER_STEPS_PICKUP : ORDER_STEPS_DELIVERY;
            const shortId = order._id?.slice(-8).toUpperCase() || "ORD-000";

            return (
              <div
                key={order._id || index}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition overflow-hidden"
              >
                {/* 1. PROFESSIONAL ORDER HEADER BAR */}
                <div className="bg-slate-50/90 border-b border-slate-200 px-5 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  {/* Left Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Order Placed
                      </span>
                      <span className="text-slate-800 font-medium">
                        {formatOrderDateTime(order)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Total Amount
                      </span>
                      <span className="text-slate-900 font-bold text-sm">
                        {formatCurrency(order.amount, currency)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Fulfillment
                      </span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        {isPickup ? "🏪 Store Pickup" : "🚚 Home Delivery"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Payment Mode
                      </span>
                      <span className="text-slate-700 font-medium">
                        {order.paymentType === "COD" ? "Cash on Delivery" : "Online Payment"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Order ID with Copy & Invoice */}
                  <div className="flex items-center gap-2 self-start md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-slate-200 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-mono">
                        ORDER #MSM-{shortId}
                      </span>
                    </div>
                    <button
                      onClick={() => copyOrderId(order._id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-md transition hover:bg-slate-100 cursor-pointer"
                      title="Copy full Order ID"
                    >
                      {copiedId === order._id ? "✓ Copied" : "Copy ID"}
                    </button>
                  </div>
                </div>

                {/* 2. ORDER STATUS STEPPER (Real E-Commerce Progress Bar) */}
                <div className="px-5 sm:px-6 py-5 border-b border-slate-100">
                  {isCancelled ? (
                    <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0">
                        ✕
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">This order was cancelled</h4>
                        <p className="text-xs text-rose-700 mt-0.5">
                          Order was cancelled during the 5-minute confirmation grace window. No charges will be processed.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Status header with pulse */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            isDelivered ? "bg-emerald-500" : "bg-primary animate-pulse"
                          }`} />
                          <span className="font-bold text-sm text-slate-900">
                            {isDelivered
                              ? (isPickup ? "Collected by Customer" : "Delivered Successfully")
                              : (order.status || "Order Confirmed")}
                          </span>
                        </div>

                        {/* Grace cancellation timer banner if active */}
                        {canCancel && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 hidden sm:inline">Cancellation window:</span>
                            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              ⏱ {Math.floor(remainingCancelSecs / 60)}:{(remainingCancelSecs % 60).toString().padStart(2, "0")} remaining
                            </span>
                            <button
                              onClick={() => handleCancelOrder(order._id)}
                              disabled={cancellingId === order._id}
                              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 font-semibold border border-rose-300 rounded-md transition cursor-pointer text-xs"
                            >
                              {cancellingId === order._id ? "Cancelling..." : "Cancel Order"}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* 4-Step Progress Stepper Visual */}
                      <div className="relative pt-2 pb-1">
                        <div className="grid grid-cols-4 gap-2 relative">
                          {/* Background connecting bar */}
                          <div className="absolute top-4 left-6 right-6 h-1 bg-slate-200 -z-0" />
                          <div
                            className="absolute top-4 left-6 h-1 bg-emerald-500 transition-all duration-500 -z-0"
                            style={{
                              width: `${((Math.max(1, currentStep) - 1) / 3) * 100}%`
                            }}
                          />

                          {steps.map((st, sIdx) => {
                            const stepNumber = sIdx + 1;
                            const isCompleted = currentStep >= stepNumber;
                            const isCurrent = currentStep === stepNumber;

                            return (
                              <div key={sIdx} className="flex flex-col items-center text-center z-10">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                                    isCompleted
                                      ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                                      : isCurrent
                                      ? "bg-primary text-white ring-4 ring-primary/20"
                                      : "bg-white text-slate-400 border-2 border-slate-300"
                                  }`}
                                >
                                  {isCompleted ? "✓" : stepNumber}
                                </div>
                                <span
                                  className={`text-xs mt-2 font-semibold ${
                                    isCompleted || isCurrent ? "text-slate-900" : "text-slate-400"
                                  }`}
                                >
                                  {st.label}
                                </span>
                                <span className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                                  {st.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. ORDER ITEMS LIST */}
                <div className="p-5 sm:p-6 divide-y divide-slate-100">
                  {order.items?.map((item, itemIdx) => {
                    const product = item?.product;
                    const imageSrc =
                      (Array.isArray(product?.image) ? product?.image[0] : product?.image) ||
                      assets.upload_area;
                    const unitPrice = product?.offerPrice || product?.price || 0;
                    const quantity = item?.quantity || 1;
                    const lineTotal = unitPrice * quantity;

                    return (
                      <div
                        key={itemIdx}
                        className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          {/* Product Thumbnail */}
                          <div className="w-16 h-16 bg-slate-50 border border-slate-200/80 rounded-xl p-1.5 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={imageSrc}
                              alt={product?.name || "Product"}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.src = assets.upload_area;
                              }}
                            />
                          </div>

                          {/* Product Info */}
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">
                              {product?.name || "Grocery Item"}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Quantity: <span className="text-slate-800 font-bold">{quantity}</span>
                              <span className="mx-1.5 text-slate-300">•</span>
                              {formatCurrency(unitPrice, currency)} per unit
                            </p>
                          </div>
                        </div>

                        {/* Price & Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                          <span className="font-bold text-slate-900 text-sm">
                            {formatCurrency(lineTotal, currency)}
                          </span>
                          {product?._id && (
                            <button
                              onClick={() => handleReorderItem(product._id, product.name)}
                              className="text-xs text-primary font-semibold hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>↻</span> Buy Again
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4. FULFILLMENT & SUMMARY FOOTER */}
                <div className="bg-slate-50/60 border-t border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  {/* Fulfillment details */}
                  <div className="flex-1">
                    {isPickup ? (
                      <div className="flex items-start gap-3 bg-white border border-emerald-200 rounded-xl p-3.5 max-w-xl">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shrink-0">
                          🏪
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Manish Super Market — Counter Pickup</span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              PIN: #{shortId}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px]">
                            Visit our express checkout counter and provide your Order ID (<strong>#{shortId}</strong>) to pick up your packed items.
                          </p>
                          <p className="text-slate-400 text-[10px] pt-0.5">
                            Timings: Open Daily 8:00 AM – 10:00 PM • Fast 1-minute handover
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-3.5 max-w-xl">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center text-lg shrink-0">
                          📍
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">Delivery Address</span>
                          {order?.address ? (
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              <strong>{order.address.firstName} {order.address.lastName}</strong>
                              {" — "}{order.address.street}, {order.address.city}, {order.address.state} {order.address.zipcode}
                              <br />
                              <span className="text-slate-500 font-medium">Phone: {order.address.phone}</span>
                            </p>
                          ) : (
                            <p className="text-slate-400 italic text-[11px]">Doorstep delivery</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary & Reorder CTA */}
                  <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Grand Total</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        {formatCurrency(order.amount, currency)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleReorderAll(order)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🛒</span>
                      <span>Reorder All</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
