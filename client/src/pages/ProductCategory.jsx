import React from "react";
import { useAppContext } from "../context/AppContext";
import { useParams, Link } from "react-router-dom";
import { categories } from "../assets/assets";
import ProductsCard from "../components/ProductCard";

function ProductCategory() {
  const { products } = useAppContext();
  const { category } = useParams();

  const searchCategory = categories.find(
    (item) => item.path.toLowerCase() === category?.toLowerCase()
  );

  const filteredProducts = products.filter(
    (product) => product.category?.toLowerCase() === category?.toLowerCase()
  );

  return (
    <div className="mt-12 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {searchCategory ? searchCategory.text : category}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing {filteredProducts.length} items in this category
          </p>
        </div>
        <Link to="/products" className="text-xs font-semibold text-primary hover:underline">
          ← View All Categories
        </Link>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
          {filteredProducts.map((product) => (
            <ProductsCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-2xl text-center">
          <p className="text-lg font-semibold text-gray-700">
            No products found in this category yet.
          </p>
          <p className="text-xs text-gray-400 mt-1 mb-4">
            Admins can add new items to this category from the Admin Panel.
          </p>
          <Link
            to="/seller"
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg"
          >
            + Add Item as Admin
          </Link>
        </div>
      )}
    </div>
  );
}

export default ProductCategory;
