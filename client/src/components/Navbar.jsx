import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const {
    user,
    setUser,
    setShowUserLogin,
    navigate,
    setSearchQuery,
    searchQuery,
    getCartCount,
    axios
  } = useAppContext();

  const logout = async () => {
    try {
      const { data } = await axios.get("/api/user/logout");
      if (data.success) {
        toast.success(data.message || "Logged out");
        localStorage.removeItem("token");
        setUser(null);
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0 && window.location.pathname !== "/products") {
      navigate("/products");
    }
  };

  return (
    <nav className="w-full flex items-center justify-between px-4 sm:px-6 md:px-16 lg:px-24 xl:px-32 py-2 sm:py-3 border-b border-gray-200 bg-white sticky top-0 z-40 shadow-xs transition-all">
      <NavLink to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
        <img className="h-12 sm:h-16 md:h-20 w-auto object-contain cursor-pointer transition-transform hover:scale-102" src={assets.logo} alt="Manish Super Market" />
      </NavLink>

      <div className="hidden sm:flex items-center gap-6 lg:gap-8 font-medium text-sm text-gray-700">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "text-primary font-semibold" : "hover:text-primary transition"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            isActive ? "text-primary font-semibold" : "hover:text-primary transition"
          }
        >
          All Groceries
        </NavLink>

        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 py-1 rounded-full focus-within:border-primary transition w-64">
          <input
            className="py-1 w-full bg-transparent outline-none placeholder-gray-400 text-sm"
            type="text"
            placeholder="Search groceries..."
            value={searchQuery || ""}
            onChange={handleSearchChange}
          />
          <img src={assets.search_icon} alt="search" className="w-4 h-4 opacity-60" />
        </div>

        {/* Cart Icon */}
        <div
          onClick={() => navigate("/cart")}
          className="relative cursor-pointer p-1 hover:opacity-80 transition"
          title="Shopping Cart"
        >
          <img src={assets.nav_cart_icon} alt="cart" className="w-6 opacity-80" />
          <button className="absolute -top-1.5 -right-2 text-xs font-semibold text-white bg-primary w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-xs">
            {getCartCount()}
          </button>
        </div>

        {!user ? (
          <button
            className="cursor-pointer px-6 py-2 bg-primary hover:bg-primary-600 transition text-white rounded-full text-sm font-medium shadow-xs"
            onClick={() => {
              setOpen(false);
              setShowUserLogin(true);
            }}
          >
            Login
          </button>
        ) : (
          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-2">
              <img src={assets.profile_icon} alt="profile" className="w-9 h-9 rounded-full border border-gray-300" />
              <span className="text-sm font-medium text-gray-700 max-w-24 truncate">{user.name || "Customer"}</span>
            </div>
            <ul className="hidden group-hover:block absolute top-9 right-0 bg-white shadow-lg border border-gray-200 py-2 w-36 rounded-lg text-sm z-40">
              <li
                onClick={() => navigate("/my-orders")}
                className="p-2 px-4 hover:bg-primary/10 cursor-pointer text-gray-700"
              >
                My Orders
              </li>
              <li
                onClick={logout}
                className="p-2 px-4 hover:bg-red-50 text-red-600 cursor-pointer border-t border-gray-100"
              >
                Logout
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Mobile Right Icons */}
      <div className="flex items-center gap-4 sm:hidden">
        <div
          onClick={() => navigate("/cart")}
          className="relative cursor-pointer"
        >
          <img src={assets.nav_cart_icon} alt="cart" className="w-6 opacity-80" />
          <button className="absolute -top-1.5 -right-2 text-xs font-semibold text-white bg-primary w-[18px] h-[18px] rounded-full flex items-center justify-center">
            {getCartCount()}
          </button>
        </div>

        <button
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          className="p-1"
        >
          <img src={assets.menu_icon} alt="menu" className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div className="absolute top-[65px] left-0 w-full bg-white shadow-xl py-5 flex flex-col items-start gap-3 px-6 text-sm sm:hidden border-b border-gray-200 z-50">
          <input
            className="py-2 px-3 w-full border border-gray-300 rounded-lg outline-none placeholder-gray-400 text-sm"
            type="text"
            placeholder="Search groceries..."
            value={searchQuery || ""}
            onChange={handleSearchChange}
          />
          <NavLink to="/" onClick={() => setOpen(false)} className="w-full py-1 font-medium">
            Home
          </NavLink>
          <NavLink to="/products" onClick={() => setOpen(false)} className="w-full py-1 font-medium">
            All Groceries
          </NavLink>
          {user && (
            <NavLink to="/my-orders" onClick={() => setOpen(false)} className="w-full py-1 font-medium">
              My Orders
            </NavLink>
          )}

          {!user ? (
            <button
              onClick={() => {
                setOpen(false);
                setShowUserLogin(true);
              }}
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary-600 transition text-white rounded-full text-sm font-medium w-full text-center"
            >
              Login
            </button>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="cursor-pointer px-6 py-2 mt-2 bg-gray-100 hover:bg-gray-200 text-red-600 rounded-full text-sm font-medium w-full text-center"
            >
              Logout ({user.name || "Customer"})
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
