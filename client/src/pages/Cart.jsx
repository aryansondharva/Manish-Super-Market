import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets, dummyAddress } from "../assets/assets";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    removeCartItem,
    getCartCount,
    updateCartItem,
    navigate,
    getCartAmmount,
    axios,
    user,
    setCartItems,
    setShowUserLogin
  } = useAppContext();

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentOption, setPaymentOption] = useState("COD");
  const [loading, setLoading] = useState(false);

  const getCart = () => {
    let tempArray = [];
    for (const key in cartItems) {
      if (cartItems[key] > 0) {
        const product = products.find((item) => item._id === key);
        if (product) {
          tempArray.push({
            ...product,
            quantity: cartItems[key]
          });
        }
      }
    }
    setCartArray(tempArray);
  };

  const getUserAddress = async () => {
    try {
      if (!user || !user._id) return;
      const { data } = await axios.get("/api/address/get", {
        params: {
          userId: user._id
        }
      });
      if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
        setAddresses(data.addresses);
        setSelectedAddress(data.addresses[0]);
      } else {
        // If no addresses in DB yet, fallback to dummyAddress
        setAddresses(dummyAddress);
        setSelectedAddress(dummyAddress[0]);
      }
    } catch (error) {
      console.log("getUserAddress note:", error.message);
      setAddresses(dummyAddress);
      setSelectedAddress(dummyAddress[0]);
    }
  };

  useEffect(() => {
    getCart();
  }, [products, cartItems]);

  useEffect(() => {
    if (user && user._id) {
      getUserAddress();
    } else {
      setAddresses(dummyAddress);
      setSelectedAddress(dummyAddress[0]);
    }
  }, [user]);

  const placeOrder = async () => {
    try {
      if (cartArray.length === 0) {
        return toast.error("Your cart is empty. Please add items to buy.");
      }
      if (!user) {
        setShowUserLogin(true);
        return toast.error("Please log in to complete your purchase");
      }
      if (!selectedAddress) {
        return toast.error("Please select a delivery address");
      }

      setLoading(true);

      const addressPayload = selectedAddress._id ? selectedAddress._id : selectedAddress;

      if (paymentOption === "COD") {
        const { data } = await axios.post("/api/order/cod", {
          userId: user._id,
          items: cartArray.map((item) => ({
            product: item._id,
            quantity: item.quantity
          })),
          address: addressPayload
        });

        if (data.success) {
          toast.success("🎉 " + (data.message || "Order Placed Successfully!"));
          setCartItems({});
          navigate("/my-orders");
        } else {
          toast.error(data.message || "Failed to place order");
        }
      } else {
        const { data } = await axios.post("/api/order/stripe", {
          userId: user._id,
          items: cartArray.map((item) => ({
            product: item._id,
            quantity: item.quantity
          })),
          address: addressPayload
        });

        if (data.success && data.url) {
          window.location.replace(data.url);
        } else {
          toast.error(data.message || "Online checkout unavailable, please select COD");
        }
      }
    } catch (error) {
      toast.error(error.message || "Error placing order");
    } finally {
      setLoading(false);
    }
  };

  if (cartArray.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
          <img src={assets.nav_cart_icon} alt="empty cart" className="w-10 opacity-40" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Your Shopping Cart is Empty</h2>
        <p className="text-gray-500 text-sm mt-1 mb-6 max-w-sm">
          Looks like you haven't added any groceries to your basket yet. Explore fresh vegetables, fruits, dairy, and more!
        </p>
        <Link
          to="/products"
          className="px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-medium rounded-full text-sm shadow-md transition"
        >
          Explore All Groceries
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-12 pb-20">
      {/* Cart Items List */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Shopping Cart{" "}
            <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full ml-2">
              {getCartCount()} Items
            </span>
          </h1>
          <button
            onClick={() => setCartItems({})}
            className="text-xs text-red-500 hover:underline cursor-pointer"
          >
            Clear Cart
          </button>
        </div>

        <div className="hidden sm:grid grid-cols-[3fr_1fr_1fr] text-gray-400 text-xs font-semibold uppercase tracking-wider pb-3 border-b border-gray-200">
          <p className="text-left">Product</p>
          <p className="text-center">Subtotal</p>
          <p className="text-center">Remove</p>
        </div>

        <div className="divide-y divide-gray-100">
          {cartArray.map((product, index) => {
            const imageSrc =
              (Array.isArray(product.image) ? product.image[0] : product.image) ||
              assets.upload_area;

            return (
              <div
                key={product._id || index}
                className="grid grid-cols-1 sm:grid-cols-[3fr_1fr_1fr] items-center py-4 gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="cursor-pointer w-20 h-20 flex items-center justify-center border border-gray-200 rounded-xl p-1 bg-white shrink-0 overflow-hidden"
                    onClick={() => {
                      navigate(
                        `/products/${(product.category || "vegetables").toLowerCase()}/${product._id}`
                      );
                      window.scrollTo(0, 0);
                    }}
                  >
                    <img
                      className="w-full h-full object-contain"
                      src={imageSrc}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = assets.upload_area;
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm md:text-base">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 capitalize mb-1">
                      Category: {product.category}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Qty:</span>
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          type="button"
                          onClick={() => updateCartItem(product._id, product.quantity - 1)}
                          className="px-2 py-0.5 hover:bg-gray-100 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 font-medium">{product.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartItem(product._id, product.quantity + 1)}
                          className="px-2 py-0.5 hover:bg-gray-100 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">
                        (${product.offerPrice || product.price} each)
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-center font-bold text-gray-800 text-sm md:text-base">
                  {currency}
                  {Math.round((product.offerPrice || product.price) * product.quantity * 100) / 100}
                </p>

                <div className="text-center">
                  <button
                    className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition cursor-pointer"
                    onClick={() => removeCartItem(product._id)}
                    title="Remove Item"
                  >
                    <img
                      src={assets.remove_icon}
                      alt="remove"
                      className="inline-block w-5 h-5"
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            navigate("/products");
            window.scrollTo(0, 0);
          }}
          className="group cursor-pointer inline-flex items-center mt-6 gap-2 text-primary font-semibold text-sm hover:underline"
        >
          <img
            src={assets.arrow_right_icon_colored}
            alt="arrow"
            className="group-hover:-translate-x-1 transition rotate-180 w-4 h-4"
          />
          Continue Shopping
        </button>
      </div>

      {/* Order Summary & Checkout Sidebar */}
      <div className="lg:w-[380px] w-full bg-white p-6 rounded-2xl border border-gray-200 shadow-xs h-fit">
        <h2 className="text-xl font-bold text-gray-800">Order Summary</h2>
        <hr className="border-gray-100 my-4" />

        {/* Delivery Address */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Delivery Address
            </p>
            <button
              onClick={() => setShowAddress(!showAddress)}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              Change
            </button>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
            {selectedAddress ? (
              <>
                <p className="font-semibold text-gray-800">
                  {selectedAddress.firstName} {selectedAddress.lastName}
                </p>
                <p>
                  {selectedAddress.street}, {selectedAddress.city}
                </p>
                <p>
                  {selectedAddress.state} {selectedAddress.zipcode}, {selectedAddress.country}
                </p>
                <p className="mt-1 text-gray-500">📞 {selectedAddress.phone}</p>
              </>
            ) : (
              <p className="text-gray-400">No address selected</p>
            )}
          </div>

          {showAddress && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded-xl shadow-lg space-y-1 text-xs">
              {addresses.map((address, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedAddress(address);
                    setShowAddress(false);
                  }}
                  className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition text-gray-700"
                >
                  <p className="font-medium">
                    {address.firstName} {address.lastName}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    {address.street}, {address.city}
                  </p>
                </div>
              ))}
              <div
                onClick={() => navigate("/add-address")}
                className="text-primary text-center font-medium cursor-pointer p-2 hover:bg-primary/10 rounded-lg border-t border-gray-100"
              >
                + Add New Address
              </div>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="mb-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Payment Method
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentOption("COD")}
              className={`p-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer ${
                paymentOption === "COD"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              💵 Cash on Delivery
            </button>
            <button
              type="button"
              onClick={() => setPaymentOption("Online")}
              className={`p-3 text-xs font-semibold rounded-xl border transition text-center cursor-pointer ${
                paymentOption === "Online"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              💳 Online / Card
            </button>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Pricing Calculation */}
        <div className="text-sm text-gray-600 mt-4 space-y-2.5">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-gray-800">
              {currency}
              {getCartAmmount()}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Estimated Delivery</span>
            <span className="text-emerald-600 font-semibold">FREE (30 Mins)</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Estimated Tax (2%)</span>
            <span>
              {currency}
              {Math.round((getCartAmmount() * 0.02) * 100) / 100}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Grand Total:</span>
            <span className="text-primary">
              {currency}
              {Math.round((getCartAmmount() + getCartAmmount() * 0.02) * 100) / 100}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          disabled={loading}
          onClick={placeOrder}
          className="w-full py-3.5 mt-6 cursor-pointer bg-primary hover:bg-primary-600 text-white font-bold rounded-xl transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            "Placing Order..."
          ) : paymentOption === "COD" ? (
            <>
              <span>📦</span>
              <span>Confirm & Place Order (COD)</span>
            </>
          ) : (
            <>
              <span>💳</span>
              <span>Proceed to Payment</span>
            </>
          )}
        </button>

        {!user && (
          <p className="text-[11px] text-center text-amber-700 bg-amber-50 p-2 rounded-lg mt-3">
            ℹ️ You will be asked to sign in or create an account to confirm delivery.
          </p>
        )}
      </div>
    </div>
  );
};

export default Cart;
