import { useState } from "react";
import { Navbar, Footer, Loading } from "./components";
import {
  AddAddress,
  AllProducts,
  Cart,
  Home,
  ProductCategory,
  ProductDetails,
  MyOrders,
  SellerLayout,
  AddProduct,
  ProductList,
  Orders
} from "./pages";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";
import { Login } from "./components";
import SellerLogin from "./components/seller/SellerLogin";

function App() {
  const isSellerPath = useLocation().pathname.includes("seller");
  const [count, setCount] = useState(0);
  const { showUserLogin, isSeller } = useAppContext();
  return (
    <div className="text-default min-h-screen text-gray-700 bg-white">
      <div>
        {isSellerPath ? null : <Navbar />}
        {showUserLogin ? <Login /> : null}
        <Toaster />
        <div
          className={`${isSellerPath ? "" : "px-6 md:px-16 lg:px-24 xl:px-32"}`}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<AllProducts />} />
            <Route path="/products/:category" element={<ProductCategory />} />
            <Route
              path="/products/:category/:id"
              element={<ProductDetails />}
            />
            <Route path="/cart" element={<Cart />} />
            <Route path="/add-address" element={<AddAddress />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/loader" element={<Loading />} />

            <Route
              path="/seller"
              element={isSeller ? <SellerLayout /> : <SellerLogin />}
            >
              <Route index element={isSeller ? <AddProduct /> : null} />
              <Route path="product-list" element={<ProductList />} />
              <Route path="orders" element={<Orders />} />
            </Route>
          </Routes>
        </div>
        {!isSellerPath && <Footer />}
      </div>
    </div>
  );
}

export default App;
