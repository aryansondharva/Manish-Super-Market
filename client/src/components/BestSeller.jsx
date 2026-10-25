import React, { useMemo } from "react";
import ProductsCard from "./ProductCard";
import { useAppContext } from "../context/AppContext";

export default function BestSeller() {
  const { products } = useAppContext();

  // Smart Ranking Algorithm:
  // 1. Milk products on top (#1 daily staple everyone purchases)
  // 2. Daily Dairy essentials (Paneer, Curd, Butter, Cheese)
  // 3. Most purchased / ordered products next
  // 4. In stock items preferred
  const sortedBestSellers = useMemo(() => {
    const list = [...products];

    const isMilkOrDailyDairy = (p) => {
      const name = (p.name || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      if (name.includes("milk") || name.includes("doodh") || name.includes("amul milk")) return 1000;
      if (cat === "dairy" || name.includes("paneer") || name.includes("butter") || name.includes("cheese") || name.includes("curd")) return 800;
      return 0;
    };

    return list
      .sort((a, b) => {
        const priorityA = isMilkOrDailyDairy(a);
        const priorityB = isMilkOrDailyDairy(b);

        // 1. Milk & Dairy on the top side
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }

        // 2. Order by actual purchases / sales count
        const salesA = a.purchaseCount || 0;
        const salesB = b.purchaseCount || 0;
        if (salesA !== salesB) {
          return salesB - salesA;
        }

        // 3. In stock preference
        if (a.inStock !== b.inStock) {
          return a.inStock ? -1 : 1;
        }

        return 0;
      })
      .slice(0, 10);
  }, [products]);

  return (
    <div className="mt-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 bg-primary/10 rounded-full inline-block">
            🥛 Daily Staples & Top Sellers
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mt-1">
            Milk, Dairy & Most Purchased
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Fresh milk & dairy products placed first for quick daily purchase, followed by customer favorites.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-4">
        {sortedBestSellers.map((product, index) => (
          <ProductsCard product={product} key={product._id || index} />
        ))}
      </div>
    </div>
  );
}
