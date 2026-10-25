import React from "react";
import ProductsCard from "./ProductCard";
import { useAppContext } from "../context/AppContext";
import { Link } from "react-router-dom";

export default function BestSeller() {
  const { products } = useAppContext();
  const displayProducts = products.filter((p) => p.inStock).slice(0, 10);

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
            Fresh Arrivals & Best Sellers
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Top daily essentials, farm-fresh produce, and household favorites
          </p>
        </div>
        <Link
          to="/products"
          className="text-xs md:text-sm font-semibold text-primary hover:underline"
        >
          View All ({products.length}) →
        </Link>
      </div>

      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
          {displayProducts.map((product) => (
            <ProductsCard product={product} key={product._id} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-500 text-sm">Loading grocery items...</p>
        </div>
      )}
    </div>
  );
}
