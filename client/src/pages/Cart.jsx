import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
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
    setUser,
    setCartItems,
    setShowUserLogin
  } = useAppContext();

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddress, setShowAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentOption, setPaymentOption] = useState("COD");
  const [loading, setLoading] = useState(false);

  // Profile completion state & modal
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: ""
  });

  const isProfileComplete = () => {
    if (!user) return false;
    const fName = (user.firstName || user.name?.split(" ")[0] || "").trim();
    const lName = (user.lastName || user.name?.split(" ").slice(1).join(" ") || "").trim();
    const phone = (user.phone || "").trim();
    return Boolean(fName && lName && phone);
  };

  useEffect(() => {
    if (user) {
      const fName = user.firstName || user.name?.split(" ")[0] || "";
      const lName = user.lastName || user.name?.split(" ").slice(1).join(" ") || "";
      setProfileData({
        firstName: fName,
        lastName: lName,
        phone: user.phone || ""
      });
    }
  }, [user]);

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
        setAddresses([]);
        setSelectedAddress(null);
      }
    } catch (error) {
      console.log("getUserAddress note:", error.message);
      setAddresses([]);
      setSelectedAddress(null);
    }
  };

  useEffect(() => {
    getCart();
  }, [products, cartItems]);

  useEffect(() => {
    if (user && user._id) {
      getUserAddress();
    } else {
      setAddresses([]);
      setSelectedAddress(null);
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileData.firstName?.trim() || !profileData.lastName?.trim() || !profileData.phone?.trim()) {
      return toast.error("First Name, Last Name, and Phone Number are all required.");
    }

    if (profileData.phone.trim().length < 7) {
      return toast.error("Please enter a valid phone number (at least 7 digits)");
    }

    try {
      setSavingProfile(true);
      const { data } = await axios.post("/api/user/update-profile", {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        phone: profileData.phone.trim()
      });

      if (data.success && data.user) {
        setUser(data.user);
        setShowProfileModal(false);
        toast.success("Profile updated! Now select or add your delivery address.");
        if (!selectedAddress && addresses.length === 0) {
          navigate("/add-address");
        }
      } else {
        toast.error(data.message || "Failed to save profile");
      }
    } catch (error) {
      toast.error(error.message || "Error saving profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const placeOrder = async () => {
    try {
      if (cartArray.length === 0) {
        return toast.error("Your cart is empty. Please add items to buy.");
      }
      if (!user) {
        setShowUserLogin(true);
        return toast.error("Please log in to complete your purchase");
      }
      if (!isProfileComplete()) {
        setShowProfileModal(true);
        return toast.error("Please complete your profile (First & Last Name, Phone Number) before placing your order");
      }
      if (!selectedAddress) {
        toast.error("Please add and select a delivery address before placing your order");
        navigate("/add-address");
        return;
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
          if (data.requireProfile) {
            setShowProfileModal(true);
          } else if (data.requireAddress) {
            navigate("/add-address");
          }
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
          if (data.requireProfile) {
            setShowProfileModal(true);
          } else if (data.requireAddress) {
            navigate("/add-address");
          }
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <img src={assets.nav_cart_icon} alt="empty cart" className="w-10 opacity-40" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Your Shopping Cart is Empty</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-sm">
          Looks like you haven't added any fresh groceries or snacks yet.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="mt-6 px-8 py-3 bg-primary hover:bg-primary-dull text-white font-semibold rounded-full transition shadow-md cursor-pointer"
        >
          Explore Fresh Groceries
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-10 mt-10 pb-20">
      {/* Cart Items List */}
      <div className="flex-1">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            Shopping Cart{" "}
            <span className="text-sm font-normal text-gray-500">
              ({getCartCount()} Items)
            </span>
          </h1>
          <button
            onClick={() => setCartItems({})}
            className="text-xs text-red-500 hover:text-red-700 font-semibold transition cursor-pointer"
          >
            Clear Cart
          </button>
        </div>

        <div className="divide-y divide-gray-100 mt-2">
          {cartArray.map((product, index) => {
            const itemPrice = product.offerPrice || product.price;
            const lineTotal = itemPrice * product.quantity;

            return (
              <div
                key={index}
                className="py-4 flex items-center justify-between gap-4"
              >
                <div
                  className="flex items-center gap-4 cursor-pointer flex-1 min-w-0"
                  onClick={() => {
                    navigate(
                      `/products/${product?.category?.toLowerCase()}/${product._id}`
                    );
                    window.scrollTo(0, 0);
                  }}
                >
                  <img
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg p-1 border border-gray-100 bg-gray-50/50 shrink-0"
                    src={product.image?.[0]}
                    alt={product.name}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-primary font-medium uppercase tracking-wider">
                      {product.category}
                    </p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {currency}
                      {itemPrice} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <button
                      onClick={() => updateCartItem(product._id, product.quantity - 1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold transition text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-semibold text-gray-800 select-none">
                      {product.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItem(product._id, product.quantity + 1)}
                      className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 font-bold transition text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <p className="font-bold text-gray-800 text-sm sm:text-base">
                      {currency}
                      {lineTotal}
                    </p>
                  </div>

                  <button
                    onClick={() => removeCartItem(product._id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition cursor-pointer"
                    title="Remove item"
                  >
                    <img
                      src={assets.remove_icon}
                      alt="remove"
                      className="w-4 h-4"
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

        {/* User Profile Status Check (Requirement 1: First, Last Name and Phone) */}
        {user && (
          <div className="mb-5">
            {!isProfileComplete() ? (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-blue-950">
                    <span>⚠️</span> Complete Profile (Required)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(true)}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md text-[11px] transition cursor-pointer"
                  >
                    Complete Now
                  </button>
                </div>
                <p className="text-[11px] text-blue-800">
                  First & last name and phone number are required before ordering.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-900">
                    👤 {user.firstName || user.name?.split(" ")[0]} {user.lastName || user.name?.split(" ").slice(1).join(" ")}
                  </p>
                  <p className="text-gray-500 text-[11px] mt-0.5">📞 {user.phone}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(true)}
                  className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Delivery Address (Requirement 2: Address Required) */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Delivery Address *
            </p>
            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddress(!showAddress)}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Change
              </button>
            )}
          </div>

          {selectedAddress ? (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
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
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-dashed border-amber-300 text-xs text-amber-900 space-y-2 text-center">
              <p className="font-semibold">📍 Delivery Address Required</p>
              <p className="text-[11px] text-amber-800">
                Please add your delivery address to place your grocery order.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!isProfileComplete()) {
                    setShowProfileModal(true);
                  } else {
                    navigate("/add-address");
                  }
                }}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dull transition cursor-pointer text-xs shadow-2xs"
              >
                + Add Delivery Address
              </button>
            </div>
          )}

          {showAddress && (
            <div className="mt-2 p-2 bg-white border border-gray-200 rounded-xl shadow-lg space-y-1 text-xs">
              {addresses.map((address, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedAddress(address);
                    setShowAddress(false);
                  }}
                  className={`p-2 rounded-lg cursor-pointer transition text-gray-700 ${
                    selectedAddress?._id === address._id ? "bg-primary/10 border border-primary/30" : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-gray-800">
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

      {/* Complete Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
                  Step 1 of 2: Required
                </span>
                <h2 className="text-xl font-bold text-gray-800 mt-1">
                  Complete Your Profile
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your first name, last name, and phone number are required before placing an order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.firstName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, firstName: e.target.value })
                    }
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileData.lastName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, lastName: e.target.value })
                    }
                    placeholder="e.g. Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Used by our delivery team for doorstep verification & SMS updates.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full mt-2 py-3 bg-primary text-white font-semibold text-sm rounded-xl hover:bg-primary-dull transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {savingProfile ? "Saving Profile..." : "Save Profile & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
