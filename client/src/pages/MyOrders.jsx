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
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const getStatusBadge = (status, isPickup) => {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) {
    return {
      text: "Cancelled",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      dotClass: "bg-rose-500"
    };
  }
  if (s.includes("delivered") || s.includes("collected") || s.includes("completed")) {
    return {
      text: isPickup ? "Collected" : "Delivered",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dotClass: "bg-emerald-500"
    };
  }
  if (s.includes("ready") || s.includes("out for delivery")) {
    return {
      text: isPickup ? "Ready for Pickup" : "Out for Delivery",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      dotClass: "bg-blue-500"
    };
  }
  if (s.includes("packing") || s.includes("packed")) {
    return {
      text: "Packing Items",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      dotClass: "bg-indigo-500"
    };
  }
  return {
    text: "Order Placed",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    dotClass: "bg-amber-500"
  };
};

function MyOrders() {
  const { currency, user, axios, addToCart, navigate } = useAppContext();
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("all");

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
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }
    setCancellingId(orderId);
    try {
      const { data } = await axios.post("/api/order/cancel", { orderId });
      if (data.success) {
        toast.success("Order cancelled");
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
    toast.success("Order ID copied");
  };

  const handleReorderAll = (order) => {
    if (!order.items || order.items.length === 0) return;
    let added = 0;
    order.items.forEach((item) => {
      const pId = item?.product?._id || item?.product;
      if (pId) {
        addToCart(pId);
        added++;
      }
    });
    if (added > 0) {
      toast.success(`Added ${added} items to cart!`);
      navigate("/cart");
    }
  };

  const filteredOrders = useMemo(() => {
    if (activeTab === "active") {
      return myOrders.filter((o) => o.status !== "Delivered" && o.status !== "Cancelled");
    }
    if (activeTab === "pickup") {
      return myOrders.filter((o) => o.fulfillmentType === "Pickup");
    }
    if (activeTab === "completed") {
      return myOrders.filter((o) => o.status === "Delivered");
    }
    return myOrders;
  }, [myOrders, activeTab]);

  if (!user) {
    return (
      <div className="py-20 text-center max-w-sm mx-auto px-4">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
          📦
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to view orders</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Track grocery deliveries and store pickups anytime.
        </p>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 bg-primary text-white font-semibold text-xs rounded-xl shadow-xs"
        >
          Sign In / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-4 max-w-3xl mx-auto px-3 sm:px-6">
      {/* Page Title & Refresh */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">My Orders</h1>
          <p className="text-xs text-slate-500">Track and manage your grocery orders</p>
        </div>
        <button
          onClick={fetchUserOrders}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Simplified Mobile-Friendly Tabs */}
      <div className="flex items-center gap-1.5 py-3 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: "all", label: `All (${myOrders.length})` },
          { id: "active", label: "Active" },
          { id: "pickup", label: "Store Pickups" },
          { id: "completed", label: "Delivered" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 bg-slate-100 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center mt-4 space-y-2">
          <p className="text-3xl">🛒</p>
          <h3 className="font-semibold text-sm text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-500">Pick fresh groceries and place your order today!</p>
          <Link
            to="/products"
            className="inline-block mt-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          {filteredOrders.map((order, index) => {
            const isPickup = order.fulfillmentType === "Pickup";
            const remainingCancelSecs = getRemainingCancelSeconds(order);
            const canCancel = remainingCancelSecs > 0 && order.status !== "Cancelled" && order.status !== "Delivered";
            const shortId = order._id?.slice(-8).toUpperCase() || "ORD";
            const badge = getStatusBadge(order.status, isPickup);

            return (
              <div
                key={order._id || index}
                className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden"
              >
                {/* 1. CLEAN TOP HEADER */}
                <div className="p-3.5 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold text-xs border ${badge.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                      {badge.text}
                    </span>

                    {/* Order ID */}
                    <button
                      onClick={() => copyOrderId(order._id)}
                      className="font-mono text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] cursor-pointer"
                      title="Click to copy Order ID"
                    >
                      #{shortId} 📋
                    </button>
                  </div>

                  {/* Order Date */}
                  <span className="text-[11px] text-slate-500 shrink-0">
                    {formatOrderDateTime(order)}
                  </span>
                </div>

                {/* 2. ORDER ITEMS LIST (Simple & Compact) */}
                <div className="p-3.5 sm:p-4 divide-y divide-slate-100">
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
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imageSrc}
                            alt={product?.name || "Product"}
                            className="w-12 h-12 object-contain rounded-lg p-1 border border-slate-100 bg-slate-50 shrink-0"
                            onError={(e) => {
                              e.target.src = assets.upload_area;
                            }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-semibold text-slate-900 truncate">
                              {product?.name || "Grocery Item"}
                            </h4>
                            <p className="text-slate-500 text-[11px]">
                              Qty: <strong className="text-slate-700">{quantity}</strong> × {currency}{unitPrice}
                            </p>
                          </div>
                        </div>

                        <span className="font-bold text-slate-900 shrink-0">
                          {currency}{lineTotal}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 3. STORE PICKUP / DELIVERY 1-LINE INFO */}
                <div className="px-3.5 sm:px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-600">
                  {isPickup ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-medium text-emerald-900">
                        <span>🏪</span>
                        <span>Shop Counter Pickup • <strong>Manish Super Market</strong></span>
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px] shrink-0">
                        PIN: #{shortId}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 truncate text-[11px]">
                      <span>📍</span>
                      <span className="truncate">
                        Delivery to:{" "}
                        {order?.address ? (
                          <strong>
                            {order.address.street}, {order.address.city} ({order.address.phone})
                          </strong>
                        ) : (
                          "Home Address"
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. FOOTER: TOTAL & CLEAN ACTIONS */}
                <div className="p-3.5 sm:p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      {order.paymentType === "COD" ? "Cash on Delivery" : "Paid Online"}
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      {currency}{order.amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 5-Min Cancellation button */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {cancellingId === order._id
                          ? "Cancelling..."
                          : `Cancel (${Math.floor(remainingCancelSecs / 60)}:${(remainingCancelSecs % 60).toString().padStart(2, "0")})`}
                      </button>
                    )}

                    {/* Reorder Button */}
                    <button
                      onClick={() => handleReorderAll(order)}
                      className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Reorder
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
