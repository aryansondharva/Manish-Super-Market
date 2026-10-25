import React, { useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Login = () => {
  const { setShowUserLogin, setUser, axios } = useAppContext();
  const [state, setState] = useState("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(import.meta.env.DEV ? "customer@grocery.com" : "");
  const [password, setPassword] = useState(import.meta.env.DEV ? "Customer@123" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Strong Password Criteria Validation
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
    };
  }, [password]);

  const passwordScore = useMemo(() => {
    return Object.values(passwordCriteria).filter(Boolean).length;
  }, [passwordCriteria]);

  const isPasswordStrong = passwordScore === 5;

  const fillDemoCustomer = () => {
    setFirstName("Alex");
    setLastName("Customer");
    setPhone("+1 555-0199");
    setEmail("customer@grocery.com");
    setPassword("Customer@123");
    toast.success("Filled demo customer credentials!");
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (state === "register" && !isPasswordStrong) {
      if (!passwordCriteria.minLength) {
        return toast.error("Password must be at least 8 characters long.");
      }
      if (!passwordCriteria.upper) {
        return toast.error("Password must contain at least one uppercase letter (A-Z).");
      }
      if (!passwordCriteria.lower) {
        return toast.error("Password must contain at least one lowercase letter (a-z).");
      }
      if (!passwordCriteria.number) {
        return toast.error("Password must contain at least one number (0-9).");
      }
      if (!passwordCriteria.special) {
        return toast.error("Password must contain at least one special character (!@#$%^&*).");
      }
    }

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
        className="flex flex-col gap-4 p-6 sm:p-8 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 bg-white max-h-[92vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {state === "login" ? "Welcome Back!" : "Create an Account"}
            </h2>
            <p className="text-xs text-gray-500">
              {state === "login"
                ? "Sign in to place orders and manage your grocery deliveries"
                : "Register with a secure password for doorstep delivery"}
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
              <p className="font-mono">customer@grocery.com / Customer@123</p>
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
            {state === "login" ? "Email Address or Phone *" : "Email Address *"}
          </label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            placeholder={state === "login" ? "customer@grocery.com or phone" : "customer@grocery.com"}
            className="border border-gray-300 rounded-lg w-full p-2.5 outline-primary text-sm focus:border-primary transition"
            type={state === "login" ? "text" : "email"}
            required
          />
        </div>

        {/* Password Input with Show/Hide toggle */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-gray-600 uppercase">
              Password *
            </label>
            {state === "register" && (
              <span
                className={`text-[11px] font-bold ${
                  passwordScore <= 2
                    ? "text-red-500"
                    : passwordScore <= 4
                    ? "text-amber-500"
                    : "text-emerald-600"
                }`}
              >
                {password.length === 0
                  ? ""
                  : passwordScore <= 2
                  ? "Weak Password"
                  : passwordScore <= 4
                  ? "Moderate Password"
                  : "✓ Strong Password"}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              placeholder="••••••••"
              className="border border-gray-300 rounded-lg w-full p-2.5 pr-10 outline-primary text-sm focus:border-primary transition"
              type={showPassword ? "text" : "password"}
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

          {/* Strong Password Live Meter & Criteria Checklist */}
          {state === "register" && (
            <div className="pt-1.5 space-y-2">
              {/* 5-bar Strength Progress Meter */}
              <div className="flex gap-1.5 h-1.5 w-full">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      passwordScore >= lvl
                        ? passwordScore <= 2
                          ? "bg-red-500"
                          : passwordScore <= 4
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Requirement Badges */}
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] space-y-1">
                <p className="font-semibold text-gray-600 text-[10px] uppercase tracking-wider mb-1">
                  Strong Password Requirements:
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-gray-500">
                  <span className={passwordCriteria.minLength ? "text-emerald-600 font-semibold" : ""}>
                    {passwordCriteria.minLength ? "✓" : "✕"} 8+ characters
                  </span>
                  <span className={passwordCriteria.upper ? "text-emerald-600 font-semibold" : ""}>
                    {passwordCriteria.upper ? "✓" : "✕"} 1 uppercase (A-Z)
                  </span>
                  <span className={passwordCriteria.lower ? "text-emerald-600 font-semibold" : ""}>
                    {passwordCriteria.lower ? "✓" : "✕"} 1 lowercase (a-z)
                  </span>
                  <span className={passwordCriteria.number ? "text-emerald-600 font-semibold" : ""}>
                    {passwordCriteria.number ? "✓" : "✕"} 1 number (0-9)
                  </span>
                  <span className={passwordCriteria.special ? "text-emerald-600 font-semibold" : ""}>
                    {passwordCriteria.special ? "✓" : "✕"} 1 special symbol (@#$)
                  </span>
                </div>
              </div>
            </div>
          )}
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
