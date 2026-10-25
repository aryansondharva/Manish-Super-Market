import React from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Login = () => {
  const { setShowUserLogin, setUser, axios } = useAppContext();
  const [state, setState] = React.useState("login");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState(import.meta.env.DEV ? "customer@grocery.com" : "");
  const [password, setPassword] = React.useState(import.meta.env.DEV ? "customer123" : "");
  const [loading, setLoading] = React.useState(false);

  const fillDemoCustomer = () => {
    setFirstName("Alex");
    setLastName("Customer");
    setPhone("+1 555-0199");
    setEmail("customer@grocery.com");
    setPassword("customer123");
    toast.success("Filled demo customer credentials!");
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = state === "register" ? "/api/user/register" : "/api/user/login";
      const payload =
        state === "register"
          ? {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: phone.trim(),
              name: `${firstName.trim()} ${lastName.trim()}`,
              email,
              password
            }
          : { email, password };

      const { data } = await axios.post(endpoint, payload);
      if (data.success) {
        toast.success(state === "register" ? "Account created successfully!" : "Logged in successfully!");
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        setUser(data.user);
        setShowUserLogin(false);
      } else {
        toast.error(data.message || "Authentication failed");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={() => setShowUserLogin(false)}
    >
      <form
        onSubmit={onSubmitHandler}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-4 p-6 sm:p-8 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 bg-white max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {state === "login" ? "Welcome Back!" : "Create an Account"}
            </h2>
            <p className="text-xs text-gray-500">
              {state === "login"
                ? "Sign in to place orders and manage your grocery deliveries"
                : "Register for fast grocery delivery at your doorstep"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUserLogin(false)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer p-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {import.meta.env.DEV && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 flex justify-between items-center">
            <div>
              <p className="font-semibold">Demo Customer (Development):</p>
              <p className="font-mono">customer@grocery.com / customer123</p>
            </div>
            <button
              type="button"
              onClick={fillDemoCustomer}
              className="px-2.5 py-1 bg-blue-600 text-white rounded text-[11px] font-medium hover:bg-blue-700 transition cursor-pointer"
            >
              Fill Demo
            </button>
          </div>
        )}

        {state === "register" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  First Name *
                </label>
                <input
                  onChange={(e) => setFirstName(e.target.value)}
                  value={firstName}
                  placeholder="e.g. Alex"
                  className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary text-sm focus:border-primary transition"
                  type="text"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 uppercase">
                  Last Name *
                </label>
                <input
                  onChange={(e) => setLastName(e.target.value)}
                  value={lastName}
                  placeholder="e.g. Smith"
                  className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary text-sm focus:border-primary transition"
                  type="text"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 uppercase">
                Phone Number *
              </label>
              <input
                onChange={(e) => setPhone(e.target.value)}
                value={phone}
                placeholder="e.g. +91 9876543210"
                className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary text-sm focus:border-primary transition"
                type="tel"
                required
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">
            Email Address *
          </label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder="customer@grocery.com"
            className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary text-sm focus:border-primary transition"
            type="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-600 uppercase">
            Password *
          </label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            placeholder="••••••••"
            className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary text-sm focus:border-primary transition"
            type="password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary-600 transition text-white w-full py-2.5 rounded-lg text-sm font-semibold shadow-md cursor-pointer mt-2 disabled:opacity-50"
        >
          {loading ? "Processing..." : state === "register" ? "Create Account" : "Sign In"}
        </button>

        <div className="text-center text-xs text-gray-600 mt-2">
          {state === "register" ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setState("login")}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setState("register")}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
