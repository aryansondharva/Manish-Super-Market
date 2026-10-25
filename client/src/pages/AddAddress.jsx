import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const InputField = ({ type, placeholder, name, handleChange, value, required = true }) => (
  <input
    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none text-gray-700 text-sm focus:border-primary focus:ring-1 focus:ring-primary transition"
    type={type}
    placeholder={placeholder}
    onChange={handleChange}
    name={name}
    value={value}
    required={required}
  />
);

function AddAddress() {
  const { axios, user, navigate } = useAppContext();
  const [loading, setLoading] = useState(false);

  const [address, setAddress] = useState({
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    lastName: user?.lastName || user?.name?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: user?.phone || ""
  });

  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || user.name?.split(" ")[0] || "",
        lastName: prev.lastName || user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || ""
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to save your address");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post("/api/address/add", {
        userId: user._id,
        address
      });
      if (data.success) {
        toast.success("Address saved successfully!");
        navigate("/cart");
      } else {
        toast.error(data.message || "Failed to save address");
      }
    } catch (error) {
      toast.error(error.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/cart");
    }
  }, [user, navigate]);

  return (
    <div className="mt-8 md:mt-12 pb-16 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => navigate("/cart")}
          className="hover:text-primary transition flex items-center gap-1 cursor-pointer"
        >
          ← Back to Cart
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-10 items-start">
        <div className="flex-1 w-full bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Delivery <span className="text-primary">Address</span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Add your shipping destination so we can deliver your groceries to your door.
            </p>
          </div>

          <form onSubmit={onSubmitHandler} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.firstName}
                  name="firstName"
                  type="text"
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.lastName}
                  name="lastName"
                  type="text"
                  placeholder="Last Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.email}
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.phone}
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address *</label>
              <InputField
                handleChange={handleChange}
                value={address.street}
                name="street"
                type="text"
                placeholder="Flat / House No., Building, Street Name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.city}
                  name="city"
                  type="text"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.state}
                  name="state"
                  type="text"
                  placeholder="State / Province"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Zip / Postal Code *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.zipcode}
                  name="zipcode"
                  type="text"
                  placeholder="Zip Code"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Country *</label>
                <InputField
                  handleChange={handleChange}
                  value={address.country}
                  name="country"
                  type="text"
                  placeholder="Country"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-primary text-white py-3 rounded-xl hover:bg-primary-dull transition font-semibold text-sm cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? "Saving Address..." : "Save Delivery Address"}
            </button>
          </form>
        </div>

        <div className="hidden md:flex flex-col items-center justify-center p-6 max-w-xs text-center text-gray-500">
          <img src={assets.add_address_iamge} alt="Add Address" className="w-56 h-auto mb-4" />
          <h3 className="font-semibold text-gray-700 text-sm">Safe & Fast Doorstep Delivery</h3>
          <p className="text-xs text-gray-400 mt-1">
            Your address is saved securely so you can checkout quickly on your future orders.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AddAddress;
