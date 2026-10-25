import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import ProductsCard from "../components/ProductCard";

function AllProducts() {
  const { products, searchQuery, setSearchQuery } = useAppContext();
  const [sortBy, setSortBy] = useState("smart"); // "smart" | "popular" | "price-low" | "price-high"

  const isMilkOrDailyDairy = (p) => {
    const name = (p.name || "").toLowerCase();
    const cat = (p.category || "").toLowerCase();
    if (name.includes("milk") || name.includes("doodh") || name.includes("amul milk")) return 1000;
    if (cat === "dairy" || name.includes("paneer") || name.includes("butter") || name.includes("cheese") || name.includes("curd")) return 800;
    return 0;
  };

  const processedProducts = useMemo(() => {
    let list = [...products];

    // Filter by search query if any
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((product) =>
        (product.name || "").toLowerCase().includes(q) ||
        (product.category || "").toLowerCase().includes(q)
      );
    }

    // Sort according to selected algorithm
    list.sort((a, b) => {
      if (sortBy === "smart") {
        // Milk on top first
        const pA = isMilkOrDailyDairy(a);
        const pB = isMilkOrDailyDairy(b);
        if (pA !== pB) return pB - pA;

        // Then purchase count
        const sA = a.purchaseCount || 0;
        const sB = b.purchaseCount || 0;
        if (sA !== sB) return sB - sA;

        // In stock preference
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return 0;
      }

      if (sortBy === "popular") {
        const sA = a.purchaseCount || 0;
        const sB = b.purchaseCount || 0;
        if (sA !== sB) return sB - sA;
        if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
        return 0;
      }

      if (sortBy === "price-low") {
        const priceA = a.offerPrice || a.price || 0;
        const priceB = b.offerPrice || b.price || 0;
        return priceA - priceB;
      }

      if (sortBy === "price-high") {
        const priceA = a.offerPrice || a.price || 0;
        const priceB = b.offerPrice || b.price || 0;
        return priceB - priceA;
      }

      return 0;
    });

    return list;
  }, [products, searchQuery, sortBy]);

  return (
    <div className="mt-12 pb-24 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold uppercase tracking-tight text-gray-800">
              All Products
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {processedProducts.length} Items
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Milk and daily dairy essentials placed on top, followed by most purchased groceries.
          </p>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium bg-white focus:outline-hidden focus:border-primary cursor-pointer shadow-2xs"
          >
            <option value="smart">🥛 Milk & Daily Essentials (Default)</option>
            <option value="popular">🔥 Most Purchased</option>
            <option value="price-low">💰 Price: Low to High</option>
            <option value="price-high">💎 Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6">
        {processedProducts.map((product, index) => (
          <ProductsCard key={product._id || index} product={product} />
        ))}
      </div>
    </div>
  );
}

export default AllProducts;
