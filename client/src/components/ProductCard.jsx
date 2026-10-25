import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductsCard = ({ product }) => {
  const { currency, addToCart, removeCartItem, cartItems, navigate } =
    useAppContext();

  if (!product) return null;

  const imageSrc =
    (Array.isArray(product.image) ? product.image[0] : product.image) ||
    assets.upload_area;

  return (
    <div
      className="border border-gray-200 hover:border-primary/40 rounded-2xl p-3 md:p-4 bg-white shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between cursor-pointer group"
      onClick={() => {
        navigate(
          `/products/${(product?.category || "vegetables").toLowerCase()}/${product._id}`
        );
        window.scrollTo(0, 0);
      }}
    >
      <div>
        <div className="relative w-full h-36 md:h-40 flex items-center justify-center p-2 bg-gray-50/60 rounded-xl overflow-hidden mb-3">
          <img
            className="group-hover:scale-105 transition-transform duration-300 max-h-full max-w-full object-contain"
            src={imageSrc}
            alt={product.name}
            onError={(e) => {
              e.target.src = assets.upload_area;
            }}
          />
          {!product.inStock && (
            <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>

        <div className="text-gray-500 text-xs">
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
            {product.category}
          </span>
          <p className="text-gray-800 font-semibold text-sm md:text-base mt-1.5 line-clamp-1 group-hover:text-primary transition" title={product.name}>
            {product.name}
          </p>

          <div className="flex items-center gap-1 mt-1">
            <span className="text-amber-400 text-xs">★★★★☆</span>
            <span className="text-[11px] text-gray-400">(4.8)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
        <div>
          <p className="text-base md:text-lg font-bold text-gray-900">
            {currency}
            {product.offerPrice || product.price}
          </p>
          {product.price > product.offerPrice && (
            <p className="text-xs text-gray-400 line-through">
              {currency}
              {product.price}
            </p>
          )}
        </div>

        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {!product.inStock ? (
            <button
              disabled
              className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg cursor-not-allowed"
            >
              Unavailable
            </button>
          ) : !cartItems[product._id] ? (
            <button
              className="flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/30 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              onClick={() => addToCart(product._id)}
            >
              <img src={assets.cart_icon} alt="cart_icon" className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-2 py-1 select-none shadow-xs text-xs font-bold">
              <button
                onClick={() => removeCartItem(product._id)}
                className="hover:opacity-80 px-1 cursor-pointer"
                title="Decrease"
              >
                −
              </button>
              <span className="min-w-4 text-center">{cartItems[product._id]}</span>
              <button
                onClick={() => addToCart(product._id)}
                className="hover:opacity-80 px-1 cursor-pointer"
                title="Increase"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsCard;
