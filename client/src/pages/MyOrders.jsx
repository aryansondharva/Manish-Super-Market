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

const getStatusBadge = (status, isPickup) => {
  const s = (status || "").toLowerCase();
  if (s.includes("cancel")) {
    return {
      label: "Cancelled",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
      dotClass: "bg-red-500"
    };
  }
  if (s.includes("delivered") || s.includes("collected") || s.includes("completed")) {
    return {
      label: isPickup ? "Collected" : "Delivered",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      dotClass: "bg-emerald-500"
    };
  }
  if (s.includes("ready") || s.includes("out for delivery")) {
    return {
      label: isPickup ? "Ready for Pickup" : "Out for Delivery",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      dotClass: "bg-blue-500"
    };
  }
  if (s.includes("packing") || s.includes("packed")) {
    return {
      label: "Packing Items",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      dotClass: "bg-indigo-500"
    };
  }
  return {
    label: "Order Placed",
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
  const [expandedOrders, setExpandedOrders] = useState({});

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

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

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
    toast.success("Order ID copied");
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
          Sign In / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 pt-4 px-3 sm:px-6 max-w-2xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-xs text-gray-500">Track and reorder your groceries</p>
        </div>
        <button
          onClick={fetchUserOrders}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* Filter Tabs (Blinkit style pill filters) */}
      <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none text-xs">
        {[
          { id: "all", label: `All (${myOrders.length})` },
          { id: "active", label: "Active" },
          { id: "pickup", label: "Store Pickups" },
          { id: "completed", label: "Delivered" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-full transition whitespace-nowrap cursor-pointer text-xs font-medium ${
              activeTab === tab.id
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading your orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center mt-4 space-y-3 shadow-xs">
          <p className="text-4xl">🛒</p>
          <h3 className="font-bold text-base text-gray-900">No orders here</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            Browse our grocery categories and place your first order!
          </p>
          <Link
            to="/products"
            className="inline-block mt-2 px-5 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          {filteredOrders.map((order, index) => {
            const isPickup = isPickupOrder(order);
            const remainingCancelSecs = getRemainingCancelSeconds(order);
            const canCancel = remainingCancelSecs > 0 && order.status !== "Cancelled" && order.status !== "Delivered";
            const shortId = order._id?.slice(-8).toUpperCase() || "ORD";
            const badge = getStatusBadge(order.status, isPickup);
            const isExpanded = !!expandedOrders[order._id];

            const itemsCount = (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);
            const firstItemName = order.items?.[0]?.product?.name || "Grocery Item";
            const itemNamesPreview = (order.items || []).map((it) => it.product?.name).filter(Boolean).slice(0, 2).join(", ");
            const moreItemsCount = Math.max(0, (order.items || []).length - 2);

            return (
              <div
                key={order._id || index}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:border-gray-300 transition overflow-hidden"
              >
                {/* 1. BLINKIT-STYLE COMPACT CARD BODY */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0 border border-emerald-100">
                        {isPickup ? "🏪" : "🛒"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900 truncate">
                            Manish Super Market
                          </h3>
                          <button
                            onClick={() => copyOrderId(order._id)}
                            className="text-[11px] font-mono text-gray-400 hover:text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                            title="Click to copy ID"
                          >
                            #{shortId}
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {formatOrderDateTime(order)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shrink-0 ${badge.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                      {badge.label}
                    </span>
                  </div>

                  {/* Product Thumbnail Strip & Item Summary */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Product Images Row */}
                      <div className="flex items-center -space-x-2 shrink-0">
                        {(order.items || []).slice(0, 3).map((it, idx) => {
                          const imgSrc =
                            (Array.isArray(it.product?.image) ? it.product?.image[0] : it.product?.image) ||
                            assets.upload_area;
                          return (
                            <img
                              key={idx}
                              src={imgSrc}
                              alt={it.product?.name || "Product"}
                              className="w-12 h-12 rounded-xl object-contain p-1 border border-gray-200 bg-white shadow-2xs"
                              onError={(e) => {
                                e.target.src = assets.upload_area;
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Item Names Text */}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {itemNamesPreview}
                          {moreItemsCount > 0 ? ` +${moreItemsCount} more` : ""}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {itemsCount} {itemsCount === 1 ? "item" : "items"} • {order.paymentType === "COD" ? "Cash on Delivery" : "Paid Online"}
                        </p>
                      </div>
                    </div>

                    {/* Grand Total */}
                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-extrabold text-gray-900 block">
                        {currency}{order.amount}
                      </span>
                    </div>
                  </div>

                  {/* Fulfillment Subline */}
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 rounded-xl text-xs text-gray-600">
                    {isPickup ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-1.5 text-emerald-950 font-medium">
                          <span>🏪</span>
                          <span>Store Counter Pickup</span>
                        </span>
                        <span className="bg-emerald-100 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded text-[11px]">
                          PIN: #{shortId}
                        </span>
                      </div>
                    ) : (
                      <span className="truncate flex items-center gap-1.5 text-gray-700">
                        <span>🚚</span>
                        <span className="truncate">
                          Deliver to:{" "}
                          <strong>
                            {order.address?.street ? `${order.address.street}, ${order.address.city}` : "Home Delivery"}
                          </strong>
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Action Buttons: Cancel, View Details, Reorder */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleExpand(order._id)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer py-1"
                    >
                      <span>{isExpanded ? "Hide Bill ▲" : "View Bill Details ▼"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* 5-Min Cancellation button */}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingId === order._id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          {cancellingId === order._id
                            ? "Cancelling..."
                            : `Cancel (${Math.floor(remainingCancelSecs / 60)}:${(remainingCancelSecs % 60).toString().padStart(2, "0")})`}
                        </button>
                      )}

                      {/* Reorder Button (Blinkit style primary action) */}
                      <button
                        onClick={() => handleReorderAll(order)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <span>🛒</span>
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. EXPANDABLE BILL / RECEIPT DETAILS (Shows only on click) */}
                {isExpanded && (
                  <div className="bg-gray-50/70 border-t border-gray-100 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                    {/* Itemized Rows */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        Itemized Breakdown
                      </h4>
                      <div className="divide-y divide-gray-200/60 bg-white rounded-xl border border-gray-200/80 p-3 space-y-2">
                        {order.items?.map((it, idx) => {
                          const p = it.product;
                          const price = p?.offerPrice || p?.price || 0;
                          const qty = it.quantity || 1;
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs pt-1.5 first:pt-0">
                              <div>
                                <p className="font-semibold text-gray-800">{p?.name || "Product"}</p>
                                <p className="text-gray-400 text-[11px]">Qty: {qty} × {currency}{price}</p>
                              </div>
                              <span className="font-bold text-gray-900">{currency}{price * qty}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white rounded-xl border border-gray-200/80 p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Items Total</span>
                        <span>{currency}{order.amount}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Delivery Fee</span>
                        <span className="text-emerald-600 font-semibold">FREE</span>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-1.5 flex justify-between font-bold text-gray-900 text-sm">
                        <span>Grand Total</span>
                        <span className="text-emerald-700">{currency}{order.amount}</span>
                      </div>
                    </div>

                    {/* Additional Delivery / Pickup Notes */}
                    <p className="text-[11px] text-gray-500 text-center">
                      {isPickup
                        ? `Pickup PIN #${shortId} • Collect from Manish Super Market main counter`
                        : `Delivery to ${order.address?.street || "your registered address"}`}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
