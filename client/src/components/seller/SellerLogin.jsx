import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

function SellerLogin() {
  const { isSeller, setIsSeller, navigate, axios } = useAppContext();

  const [email, setEmail] = useState(import.meta.env.DEV ? "admin@grocery.com" : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "10J@n2007" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSeller) {
      navigate("/seller");
    }
  }, [isSeller]);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/seller/login", {
        email,
        password
      });
      if (data.success) {
        toast.success(data.message || "Logged in as Admin");
        if (data.token) {
          localStorage.setItem("sellerToken", data.token);
        }
        setIsSeller(true);
        navigate("/seller");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      toast.error(error.message || "Network Error: Could not reach backend server");
    } finally {
      setLoading(false);
    }
  };

  return (
    !isSeller && (
      <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col gap-5 p-8 sm:p-10 w-full max-w-md rounded-2xl shadow-xl border border-gray-200 bg-white"
        >
          <div className="text-center space-y-1">
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider">
              Management Portal
            </span>
            <h1 className="text-2xl font-bold text-gray-800">
              Admin & Seller Login
            </h1>
            <p className="text-xs text-gray-500">
              Log in to add grocery items, update stock, and manage orders
            </p>
          </div>

          {import.meta.env.DEV && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex justify-between items-center">
              <div>
                <p className="font-semibold">Default Admin Credentials (Dev only):</p>
                <p>Email: <span className="font-mono">admin@grocery.com</span></p>
                <p>Password: <span className="font-mono">10J@n2007</span></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail("admin@grocery.com");
                  setPassword("10J@n2007");
                  toast.success("Credentials filled!");
                }}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-medium rounded text-xs transition cursor-pointer"
              >
                Autofill
              </button>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@grocery.com"
              className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary text-sm focus:border-primary transition"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="border border-gray-300 rounded-lg w-full p-2.5 pr-10 outline-primary text-sm focus:border-primary transition"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm cursor-pointer select-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary-600 text-white font-medium w-full py-2.5 rounded-lg transition duration-200 cursor-pointer shadow-md text-sm mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Login to Admin Dashboard"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-gray-500 hover:text-gray-800 hover:underline cursor-pointer"
            >
              ← Back to Customer Storefront
            </button>
          </div>
        </form>
      </div>
    )
  );
}

export default SellerLogin;
