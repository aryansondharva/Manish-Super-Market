import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";

function Orders() {
  const { currency, axios } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/api/order/seller");
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="flex-1 p-4 md:p-8 min-h-[92vh] overflow-y-auto">
      <div className="pb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Orders</h1>
        <p className="text-xs text-gray-500 mt-1">
          Review and track all orders placed by customers across the platform.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center bg-white border border-gray-200 rounded-2xl">
          <img src={assets.box_icon} alt="box" className="w-12 h-12 mx-auto opacity-30 mb-3" />
          <p className="text-gray-600 font-medium">No customer orders placed yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Orders placed via Cash on Delivery or Online will be listed here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div
              key={order._id || index}
              className="flex flex-col lg:flex-row lg:items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-xs gap-5"
            >
              <div className="flex gap-4">
                <img
                  className="w-12 h-12 object-contain bg-gray-50 p-2 rounded-lg border border-gray-100 shrink-0"
                  src={assets.box_icon}
                  alt="boxIcon"
                />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-400">
                    Order ID: <span className="font-mono text-gray-700">{order._id}</span>
                  </p>
                  {order.items?.map((item, itemIdx) => (
                    <p key={itemIdx} className="text-sm font-medium text-gray-800">
                      {item?.product?.name || "Grocery Item"}{" "}
                      <span className="text-primary font-semibold">× {item?.quantity}</span>
                    </p>
                  ))}
                  <p className="text-xs text-gray-400">
                    Placed: {new Date(order?.createdAt || Date.now()).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-800">Delivery Address:</p>
                {order?.address ? (
                  <>
                    <p>
                      {order.address.firstName} {order.address.lastName}
                    </p>
                    <p>
                      {order.address.street}, {order.address.city}
                    </p>
                    <p>
                      {order.address.state} {order.address.zipcode}, {order.address.country}
                    </p>
                    <p>📞 {order.address.phone}</p>
                  </>
                ) : (
                  <p className="italic text-gray-400">Standard Delivery Address</p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs text-gray-400">Total Amount</p>
                  <p className="font-bold text-lg text-primary">
                    {currency}
                    {order.amount}
                  </p>
                </div>

                <div className="text-xs space-y-1">
                  <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                    {order.paymentType || "COD"}
                  </span>
                  <span
                    className={`block px-2.5 py-1 rounded-full font-medium ${
                      order.isPaid
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.isPaid ? "Paid" : "Payment Pending"}
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

export default Orders;
