import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
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

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "Delivered":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Out for Delivery":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Packing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
};

function MyOrders() {
  const { currency, user, axios } = useAppContext();
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-gray-800">Sign in to view your orders</h2>
        <p className="text-xs text-gray-500 mt-2 mb-6">
          Track active grocery deliveries and view purchase history by logging in.
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-primary text-white font-semibold text-xs rounded-full hover:bg-primary-dull transition shadow-sm"
        >
          Go to Home & Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 md:mt-12 pb-24 max-w-4xl mx-auto">
      <div className="pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time tracking of your grocery deliveries and order details.
          </p>
        </div>
        <button
          onClick={fetchUserOrders}
          className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          🔄 Refresh Orders
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading your orders...</div>
      ) : myOrders.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl mt-6">
          <img src={assets.box_icon} alt="box" className="w-12 h-12 mx-auto opacity-30 mb-3" />
          <h3 className="font-semibold text-gray-700">No orders placed yet</h3>
          <p className="text-xs text-gray-400 mt-1 mb-5">
            Your shopping basket is ready. Pick fresh groceries and place your first order!
          </p>
          <Link
            to="/products"
            className="px-5 py-2 bg-primary text-white text-xs font-semibold rounded-full shadow-xs"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {myOrders.map((order, index) => (
            <div
              key={order._id || index}
              className="border border-gray-200 bg-white rounded-2xl p-5 sm:p-6 shadow-xs overflow-hidden transition hover:shadow-md"
            >
              {/* Order Header */}
              <div className="flex flex-wrap justify-between items-start pb-4 border-b border-gray-100 text-xs gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Order ID:</span>
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                      #{order._id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <span>🕒 Placed:</span>
                    <span className="font-medium text-gray-700">
                      {formatOrderDateTime(order.createdAt)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full font-medium text-[11px]">
                    {order.paymentType === "COD" ? "💵 Cash on Delivery" : "💳 Online Payment"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full font-semibold border text-xs ${getStatusBadgeClass(
                      order.status || "Order Placed"
                    )}`}
                  >
                    ● {order.status || "Order Placed"}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-100 my-2">
                {order.items?.map((item, itemIdx) => {
                  const product = item?.product;
                  const imageSrc =
                    (Array.isArray(product?.image) ? product?.image[0] : product?.image) ||
                    assets.upload_area;

                  return (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-xl p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          <img
                            src={imageSrc}
                            alt={product?.name || "Product"}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = assets.upload_area;
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">
                            {product?.name || "Grocery Item"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Quantity: <span className="text-gray-800 font-bold">× {item?.quantity || 1}</span>
                            {" "}• {currency}{product?.offerPrice || product?.price || 0} each
                          </p>
                        </div>
                      </div>

                      <p className="font-bold text-sm text-gray-900">
                        {currency}
                        {(product?.offerPrice || product?.price || 0) * (item?.quantity || 1)}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Delivery Address & Order Footer */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="text-gray-600 space-y-0.5">
                  <p className="font-semibold text-gray-800">📍 Delivering to:</p>
                  {order?.address ? (
                    <p className="text-gray-600 text-[11px]">
                      <span className="font-medium text-gray-800">
                        {order.address.firstName} {order.address.lastName}
                      </span>
                      {" • "}
                      {order.address.street}, {order.address.city}, {order.address.state} {order.address.zipcode}
                      {" • 📞 "}
                      <span className="font-medium">{order.address.phone}</span>
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-[11px]">Saved Delivery Address</p>
                  )}
                </div>

                <div className="text-left sm:text-right shrink-0 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
                  <span className="text-gray-500 text-[11px] block">Grand Total</span>
                  <span className="font-extrabold text-base text-primary">
                    {currency}{order.amount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;
