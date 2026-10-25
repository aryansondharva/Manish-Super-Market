import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";

const formatOrderDateTime = (dateStr) => {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};

const ORDER_STATUSES = [
  "Order Placed",
  "Packing",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

const getStatusStyle = (status) => {
  switch (status) {
    case "Delivered":
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    case "Out for Delivery":
      return "bg-purple-50 text-purple-800 border-purple-300";
    case "Packing":
      return "bg-blue-50 text-blue-800 border-blue-300";
    case "Cancelled":
      return "bg-red-50 text-red-800 border-red-300";
    default:
      return "bg-amber-50 text-amber-800 border-amber-300";
  }
};

function Orders() {
  const { currency, axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/order/seller");
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      toast.error(error.message || "Network error loading orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const { data } = await axios.post("/api/order/status", {
        orderId,
        status: newStatus
      });
      if (data.success) {
        toast.success(data.message || `Status updated to ${newStatus}`);
        setOrders((prev) =>
          prev.map((ord) => (ord._id === orderId ? { ...ord, status: newStatus } : ord))
        );
      } else {
        toast.error(data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.message || "Error updating order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleTogglePayment = async (orderId, currentPaidStatus) => {
    try {
      setUpdatingId(orderId);
      const newPaid = !currentPaidStatus;
      const { data } = await axios.post("/api/order/status", {
        orderId,
        isPaid: newPaid
      });
      if (data.success) {
        toast.success(newPaid ? "Marked as Paid!" : "Marked as Payment Pending");
        setOrders((prev) =>
          prev.map((ord) => (ord._id === orderId ? { ...ord, isPaid: newPaid } : ord))
        );
      } else {
        toast.error(data.message || "Failed to update payment status");
      }
    } catch (error) {
      toast.error(error.message || "Error updating payment status");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      filterStatus === "All" || (order.status || "Order Placed") === filterStatus;

    if (!matchesStatus) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const idMatch = (order._id || "").toLowerCase().includes(query);
    const addr = order.address || {};
    const nameMatch = `${addr.firstName || ""} ${addr.lastName || ""}`
      .toLowerCase()
      .includes(query);
    const phoneMatch = (addr.phone || "").toLowerCase().includes(query);
    const itemMatch = (order.items || []).some((i) =>
      (i.product?.name || "").toLowerCase().includes(query)
    );

    return idMatch || nameMatch || phoneMatch || itemMatch;
  });

  // KPI Statistics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const pendingCount = orders.filter(
    (o) => (o.status || "Order Placed") !== "Delivered" && o.status !== "Cancelled"
  ).length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  return (
    <div className="flex-1 p-4 md:p-8 min-h-[92vh] overflow-y-auto bg-gray-50/50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track real-time customer purchases, update fulfillment stages, and monitor payments.
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <span>🔄</span>
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Orders
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {orders.length}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">All customer orders</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Revenue
          </p>
          <p className="text-2xl font-extrabold text-primary mt-1">
            {currency}{totalRevenue}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Gross order value</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active / Pending
          </p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {pendingCount}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Require dispatch & delivery</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Delivered
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {deliveredCount}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Completed deliveries</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by ID, Customer, Phone or Item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-primary transition text-gray-700"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {["All", ...ORDER_STATUSES].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  filterStatus === status
                    ? "bg-primary text-white font-semibold shadow-2xs"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading live orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl">
          <img
            src={assets.box_icon}
            alt="box"
            className="w-12 h-12 mx-auto opacity-30 mb-3"
          />
          <p className="text-gray-700 font-semibold">No orders matching your criteria</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery || filterStatus !== "All"
              ? "Try resetting your search query or status filter."
              : "When customers place orders via COD or Card, they appear here live."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const addr = order.address || {};
            const isUpdating = updatingId === order._id;

            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-2xs transition hover:shadow-md space-y-4"
              >
                {/* Order Top Bar: ID, Date, Amount, Status & Payment */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-gray-100 gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg shrink-0">
                      📦
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium">Order ID:</span>
                        <span className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          #{order._id?.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span>🕒 Ordered At:</span>
                        <span className="font-semibold text-gray-700">
                          {formatOrderDateTime(order.createdAt)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 font-medium">Stage:</span>
                      <select
                        disabled={isUpdating}
                        value={order.status || "Order Placed"}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition ${getStatusStyle(
                          order.status || "Order Placed"
                        )}`}
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st} className="bg-white text-gray-800">
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Payment Badge Toggle */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleTogglePayment(order._id, order.isPaid)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        order.isPaid
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                      }`}
                      title="Click to toggle payment received status"
                    >
                      <span>{order.isPaid ? "✅ Paid" : "⏳ Pending"}</span>
                      <span className="text-[10px] opacity-60">({order.paymentType || "COD"})</span>
                    </button>

                    {/* Total Amount Badge */}
                    <div className="px-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-right">
                      <span className="text-xs text-gray-400 block text-[10px]">Total</span>
                      <span className="text-base font-extrabold text-primary">
                        {currency}{order.amount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle: Items Purchased & Delivery Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  {/* Items List */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Ordered Grocery Items ({order.items?.length || 0})
                    </p>
                    <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-2">
                      {order.items?.map((item, idx) => {
                        const product = item?.product;
                        const imageSrc =
                          (Array.isArray(product?.image) ? product?.image[0] : product?.image) ||
                          assets.upload_area;

                        return (
                          <div key={idx} className="flex items-center justify-between py-2 text-xs">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={imageSrc}
                                alt={product?.name || "Product"}
                                className="w-9 h-9 object-contain rounded p-0.5 border border-gray-100 bg-gray-50 shrink-0"
                                onError={(e) => {
                                  e.target.src = assets.upload_area;
                                }}
                              />
                              <div>
                                <p className="font-semibold text-gray-800">
                                  {product?.name || "Grocery Item"}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {currency}{product?.offerPrice || product?.price || 0} each
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-gray-900">
                                × {item.quantity}
                              </span>
                              <p className="text-[11px] font-semibold text-primary">
                                {currency}{(product?.offerPrice || product?.price || 0) * (item?.quantity || 1)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real Delivery Address & Customer Info */}
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 text-xs space-y-1.5 h-fit">
                    <p className="font-bold uppercase tracking-wider text-gray-500 text-[11px] mb-2">
                      📍 Real Delivery Destination
                    </p>

                    {addr.street ? (
                      <>
                        <p className="font-bold text-sm text-gray-900">
                          👤 {addr.firstName} {addr.lastName}
                        </p>
                        <p className="text-gray-700 leading-relaxed">
                          🏠 {addr.street}, {addr.city}
                        </p>
                        <p className="text-gray-700">
                          🌐 {addr.state} - <span className="font-mono font-semibold">{addr.zipcode}</span>, {addr.country || "India"}
                        </p>
                        <div className="pt-2 border-t border-gray-200 mt-2 flex flex-wrap gap-3 text-[11px]">
                          <span className="text-gray-800 font-semibold">
                            📞 Phone: <span className="text-primary font-bold">{addr.phone}</span>
                          </span>
                          {addr.email && (
                            <span className="text-gray-500">
                              ✉️ {addr.email}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 italic py-2">
                        No address provided for this order.
                      </div>
                    )}
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

export default Orders;
