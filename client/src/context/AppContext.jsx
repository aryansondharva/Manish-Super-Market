import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts, categories as defaultCategories } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// Ensure auth tokens are sent in headers for cross-domain Vercel deployment
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const sellerToken = localStorage.getItem("sellerToken");
  if (token && !config.headers["token"]) {
    config.headers["token"] = token;
  }
  if (sellerToken && !config.headers["seller-token"]) {
    config.headers["seller-token"] = sellerToken;
  }
  return config;
});

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY || "₹";

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(null);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/category/list");
      if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.log("fetchCategories note:", error.message);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      } else if (data.success && data.products.length === 0) {
        setProducts([]);
      } else {
        toast.error(data.message || "Failed to fetch products");
      }
    } catch (error) {
      console.log("fetchProducts error:", error.message);
      if (products.length === 0) {
        setProducts(dummyProducts);
      }
    }
  };

  const fetchSeller = async () => {
    try {
      const { data } = await axios.get("/api/seller/is-auth");
      if (data.success) {
        setIsSeller(true);
      } else {
        setIsSeller(false);
      }
    } catch (error) {
      setIsSeller(false);
    }
  };

  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success && data.user) {
        setUser(data.user);
        if (data.user.cartItems) {
          setCartItems(data.user.cartItems);
        }
      }
    } catch (error) {
      setUser(null);
    }
  };

  const addToCart = (itemId) => {
    const product = products.find((p) => p._id === itemId);
    if (product && product.inStock === false) {
      toast.error("Sorry, this item is currently out of stock!", { id: "stock-toast" });
      return;
    }

    let cartData = structuredClone(cartItems || {});
    if (cartData[itemId]) {
      cartData[itemId] += 1;
    } else {
      cartData[itemId] = 1;
    }
    setCartItems(cartData);
    toast.success("Added to cart", { id: "cart-toast" });
  };

  const updateCartItem = (itemId, quantity) => {
    let cartData = structuredClone(cartItems || {});
    if (quantity <= 0) {
      delete cartData[itemId];
    } else {
      cartData[itemId] = quantity;
    }
    setCartItems(cartData);
    toast.success("Cart Updated", { id: "cart-toast" });
  };

  const removeCartItem = (itemId) => {
    let cartData = structuredClone(cartItems || {});
    if (cartData[itemId]) {
      cartData[itemId] -= 1;
      if (cartData[itemId] <= 0) {
        delete cartData[itemId];
      }
    }
    setCartItems(cartData);
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        totalCount += cartItems[item];
      }
    }
    return totalCount;
  };

  const getCartAmmount = () => {
    let totalAmmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      if (itemInfo && cartItems[items] > 0) {
        const itemPrice = itemInfo.offerPrice !== undefined ? itemInfo.offerPrice : itemInfo.price;
        totalAmmount += itemPrice * cartItems[items];
      }
    }
    return Math.floor(totalAmmount * 100) / 100;
  };

  useEffect(() => {
    fetchUser();
    fetchProducts();
    fetchCategories();
    fetchSeller();
  }, []);

  useEffect(() => {
    const updateCart = async () => {
      try {
        if (user && user._id) {
          await axios.post("/api/cart/update", {
            userId: user._id,
            cartItems
          });
        }
      } catch (error) {
        console.log("Cart update sync note:", error.message);
      }
    };
    if (user && user._id) {
      updateCart();
    }
  }, [cartItems]);

  const value = {
    navigate,
    user,
    setUser,
    setIsSeller,
    isSeller,
    showUserLogin,
    setShowUserLogin,
    currency,
    addToCart,
    updateCartItem,
    removeCartItem,
    cartItems,
    products,
    categories,
    setCategories,
    fetchCategories,
    searchQuery,
    setSearchQuery,
    getCartAmmount,
    getCartCount,
    fetchProducts,
    setCartItems,
    fetchSeller,
    axios
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
