import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

function MyOrders() {
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currency, axios, user, setShowUserLogin } = useAppContext();

  const fetchMyOrders = async () => {
    try {
      if (!user || !user._id) {
        setLoading(false);
        return;
      }
      const { data } = await axios.get("/api/order/user", {
        params: {
          userId: user._id
        }
      });
      if (data.success && Array.isArray(data.orders)) {
        setMyOrders(data.orders);
      }
    } catch (error) {
      console.log("fetchMyOrders error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchMyOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Please Sign In to View Your Orders</h2>
        <p className="text-gray-500 text-sm mb-6">
          Track active grocery orders and view your purchase history.
        </p>
        <button
          onClick={() => setShowUserLogin(true)}
          className="px-6 py-2.5 bg-primary text-white font-semibold rounded-full text-sm shadow-md cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="mt-12 pb-20 max-w-4xl">
      <div className="flex flex-col items-start mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Grocery Orders</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review your current deliveries, past orders, and payment statuses.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading your orders...</div>
      ) : myOrders.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl">
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
        <div className="space-y-6">
          {myOrders.map((order, index) => (
            <div
              key={order._id || index}
              className="border border-gray-200 bg-white rounded-2xl p-5 shadow-xs overflow-hidden"
            >
              <div className="flex flex-wrap justify-between items-center pb-4 border-b border-gray-100 text-xs gap-3">
                <div>
                  <span className="text-gray-400">Order ID: </span>
                  <span className="font-mono font-semibold text-gray-800">{order._id}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                    {order.paymentType || "COD"}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-medium ${
                      order.status === "Delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.status || "Order Placed"}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-gray-100 my-2">
                {order.items?.map((item, itemIdx) => {
                  const product = item?.product;
                  const imageSrc =
                    (Array.isArray(product?.image) ? product?.image[0] : product?.image) ||
                    assets.upload_area;

                  return (
                    <div
                      key={itemIdx}
                      className="flex items-center justify-between py-3.5 gap-4"
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
                          <p className="text-xs text-gray-400">
                            Qty: <span className="text-gray-700 font-medium">{item?.quantity || 1}</span>
                          </p>
                        </div>
                      </div>

                      <p className="font-bold text-sm text-gray-800">
                        {currency}
                        {(product?.offerPrice || product?.price || 0) * (item?.quantity || 1)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>Date: {new Date(order.createdAt || Date.now()).toLocaleDateString()}</span>
                <div>
                  <span className="text-gray-500 font-normal">Total Paid / Due: </span>
                  <span className="font-bold text-base text-primary">
                    {currency}
                    {order.amount}
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
