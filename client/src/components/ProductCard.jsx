import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const ProductsCard = ({ product }) => {
  const { currency, addToCart, removeCartItem, cartItems, navigate } =
    useAppContext();

  const isInStock = product?.inStock !== false;

  return (
    product && (
      <div
        className="relative border border-gray-500/20 rounded-md md:px-4 px-2.5 py-2.5 bg-white w-full min-w-0 flex flex-col justify-between group/card hover:shadow-sm transition"
        onClick={() => {
          navigate(
            `/products/${product?.category.toLowerCase()}/${product._id}`
          );
          scrollTo(0, 0);
        }}
      >
        {/* Badges: Out of stock or Daily Milk or Popular */}
        {!isInStock ? (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded-md tracking-wide shadow-xs uppercase">
            Out of Stock
          </span>
        ) : product?.name?.toLowerCase().includes("milk") || product?.category?.toLowerCase() === "dairy" ? (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-blue-600/95 text-white text-[10px] font-bold rounded-md tracking-wide shadow-2xs flex items-center gap-1">
            <span>🥛</span> Daily Essential
          </span>
        ) : product?.purchaseCount > 0 ? (
          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-amber-500/95 text-white text-[10px] font-bold rounded-md tracking-wide shadow-2xs flex items-center gap-1">
            <span>🔥</span> Top Pick
          </span>
        ) : null}

        <div className="group cursor-pointer flex items-center justify-center px-2 py-2 relative">
          <img
            className={`group-hover:scale-105 transition max-w-28 md:max-w-40 h-28 md:h-36 object-contain ${
              !isInStock ? "opacity-75 grayscale-30" : ""
            }`}
            src={product.image[0]}
            alt={product.name}
          />
        </div>
        <div className="text-gray-500/60 text-sm">
          <p className="text-xs">{product.category}</p>
          <p className="text-gray-700 font-medium text-base md:text-lg truncate w-full">
            {product.name}
          </p>
          <div className="flex items-center gap-0.5">
            {Array(5)
              .fill("")
              .map((_, i) => (
                <img
                  key={i}
                  src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                  alt=""
                  className="md:w-3.5 w-3"
                />
              ))}
            <p className="text-xs ml-0.5">(4)</p>
          </div>
          <div className="flex items-end justify-between mt-3 gap-1">
            <p className="md:text-xl text-sm sm:text-base font-medium text-primary">
              {currency}{product.offerPrice}{" "}
              <span className="text-gray-500/60 md:text-sm text-xs line-through">
                {currency}
                {product.price}
              </span>
            </p>
            <div
              className="text-primary shrink-0"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              {!isInStock ? (
                <span className="inline-block px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded select-none">
                  Out of Stock
                </span>
              ) : !cartItems[product._id] ? (
                <button
                  className="flex items-center justify-center gap-1 bg-primary/10 border border-primary/40 md:w-[80px] w-[58px] sm:w-[64px] h-[32px] sm:h-[34px] rounded cursor-pointer hover:bg-primary/20 transition text-xs sm:text-sm font-medium"
                  onClick={() => addToCart(product._id)}
                >
                  <img src={assets.cart_icon} alt="cart_icon" className="w-3.5 sm:w-4" />
                  Add
                </button>
              ) : (
                <div className="flex items-center justify-center gap-1 sm:gap-2 md:w-20 w-16 h-[32px] sm:h-[34px] bg-primary/25 rounded select-none text-xs sm:text-sm font-semibold">
                  <button
                    onClick={() => {
                      removeCartItem(product._id);
                    }}
                    className="cursor-pointer text-md px-1.5 sm:px-2 h-full"
                  >
                    -
                  </button>
                  <span className="w-4 sm:w-5 text-center">
                    {cartItems[product._id]}
                  </span>
                  <button
                    onClick={() => addToCart(product._id)}
                    className="cursor-pointer text-md px-1.5 sm:px-2 h-full"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ProductsCard;
