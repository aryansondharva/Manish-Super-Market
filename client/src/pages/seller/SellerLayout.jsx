import React from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import { Link, NavLink, Outlet } from "react-router-dom";
import toast from "react-hot-toast";

const SellerLayout = () => {
  const { axios, navigate, setIsSeller } = useAppContext();
  const sidebarLinks = [
    { name: "Add Product", path: "/seller", icon: assets.add_icon },
    {
      name: "Product List",
      path: "/seller/product-list",
      icon: assets.product_list_icon
    },
    { name: "Orders", path: "/seller/orders", icon: assets.order_icon }
  ];

  const logout = async () => {
    try {
      const { data } = await axios.get("/api/seller/logout");
      if (data.success) {
        toast.success(data.message || "Logged out");
        localStorage.removeItem("sellerToken");
        setIsSeller(false);
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Admin Top Header */}
      <header className="flex items-center justify-between px-4 md:px-8 border-b border-gray-200 py-3 bg-white sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/">
            <img src={assets.logo} alt="logo" className="h-8" />
          </Link>
          <span className="hidden sm:inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
            Admin Workspace
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/40 rounded-full hover:bg-primary/10 transition"
          >
            <span>🏪</span>
            <span className="hidden sm:inline">View Live Storefront</span>
            <span className="sm:hidden">Store</span>
          </Link>

          <div className="flex items-center gap-2 border-l border-gray-200 pl-3 md:pl-5">
            <div className="text-right hidden md:block">
              <p className="text-xs font-semibold text-gray-800">Administrator</p>
              <p className="text-[11px] text-gray-500">admin@grocery.com</p>
            </div>
            <button
              onClick={logout}
              className="border border-gray-300 hover:border-red-400 hover:text-red-600 rounded-full text-xs font-medium px-3.5 py-1.5 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content with Sidebar */}
      <div className="flex flex-1">
        <aside className="md:w-64 w-16 border-r border-gray-200 bg-white min-h-[calc(100vh-57px)] pt-4 flex flex-col shrink-0">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:block">
            Catalog & Orders
          </div>
          {sidebarLinks.map((item) => (
            <NavLink
              to={item.path}
              key={item.name}
              end={item.path === "/seller"}
              className={({ isActive }) => `flex items-center py-3 px-4 gap-3 transition-colors
                ${
                  isActive
                    ? "border-r-4 md:border-r-[5px] bg-primary/10 border-primary text-primary font-semibold"
                    : "hover:bg-gray-100/80 border-transparent text-gray-700"
                }`}
            >
              <img src={item?.icon} alt="" className="w-5 h-5 shrink-0" />
              <p className="md:block hidden text-sm">{item.name}</p>
            </NavLink>
          ))}

          <div className="mt-auto p-4 hidden md:block border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500 leading-relaxed">
              💡 <span className="font-semibold text-gray-700">Quick Tip:</span> Any item you add here immediately appears live in the client grocery catalog!
            </p>
          </div>
        </aside>

        <main className="flex-1 bg-white overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
