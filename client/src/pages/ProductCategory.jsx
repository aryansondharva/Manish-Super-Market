import React from "react";
import { useAppContext } from "../context/AppContext";
import { useParams } from "react-router-dom";
import ProductsCard from "../components/ProductCard";

function ProductCategory() {
  const { products, categories } = useAppContext();
  const { category } = useParams();

  const searchCategory = (categories || []).find(
    (item) => item.path.toLowerCase() === (category || "").toLowerCase()
  );

  const filteredProducts = products.filter(
    (product) => (product.category || "").toLowerCase() === (category || "").toLowerCase()
  );
  return (
    <div className="mt-16">
      <div className="flex flex-col items-start w-max">
        <p className="text-2xl font-bold text-gray-900">
          {(searchCategory?.name || searchCategory?.text || category || "").toUpperCase()}
        </p>
        <div className="w-16 h-1 bg-primary rounded-full mt-1"></div>
      </div>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
          {filteredProducts.map((product) => (
            <ProductsCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-2xl font-medium text-primary">
            No products found in this category.
          </p>
        </div>
      )}
    </div>
  );
}

export default ProductCategory;
