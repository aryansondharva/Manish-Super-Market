import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import ProductsCard from "../components/ProductCard";
import { categories } from "../assets/assets";

function AllProducts() {
  const { products, searchQuery, setSearchQuery } = useAppContext();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    let result = products;

    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery && typeof searchQuery === "string" && searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }

    setFilteredProducts(result);
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="mt-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Grocery Products</h1>
          <p className="text-xs text-gray-500 mt-1">
            Browse our complete selection of fresh, organic, and packaged groceries ({filteredProducts.length} items)
          </p>
        </div>

        {/* Search bar inside page for mobile & quick search */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Filter by name..."
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3.5 py-2 border border-gray-300 rounded-xl outline-primary bg-white focus:border-primary shadow-2xs"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            selectedCategory === "All"
              ? "bg-primary text-white shadow-xs"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All Items ({products.length})
        </button>
        {categories.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(cat.path)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat.path
                ? "bg-primary text-white shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.text || cat.path}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
          {filteredProducts.map((product) => (
            <ProductsCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="p-16 text-center bg-white border border-gray-200 rounded-2xl">
          <p className="text-gray-700 font-semibold text-lg">No grocery items match your search</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Try resetting your search query or selecting a different category.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default AllProducts;
