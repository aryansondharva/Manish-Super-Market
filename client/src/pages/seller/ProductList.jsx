import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

function ProductList() {
  const { products, currency, fetchProducts, axios } = useAppContext();
  const [deletingId, setDeletingId] = useState(null);

  const toggleStock = async (id, inStock) => {
    try {
      const { data } = await axios.post("/api/product/stock", { id, inStock });
      if (data.success) {
        await fetchProducts();
        toast.success(data.message || "Stock Updated");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    setDeletingId(id);
    try {
      const { data } = await axios.post("/api/product/delete", { id });
      if (data.success) {
        toast.success(data.message || "Product deleted");
        await fetchProducts();
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 min-h-[92vh] overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Product Inventory</h1>
          <p className="text-xs text-gray-500 mt-1">
            Total {products.length} products listed. Toggle stock availability or remove items.
          </p>
        </div>
        <Link
          to="/seller"
          className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>Add New Product</span>
        </Link>
      </div>

      <div className="w-full overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5 text-center">In Stock</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No products found. Click "Add New Product" to list groceries.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const imageSrc =
                    (Array.isArray(product.image) ? product.image[0] : product.image) ||
                    assets.upload_area;

                  return (
                    <tr key={product._id} className="hover:bg-gray-50/70 transition">
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg border border-gray-200 p-1 flex items-center justify-center bg-white overflow-hidden shrink-0">
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.target.src = assets.upload_area;
                            }}
                          />
                        </div>
                        <div className="max-w-[220px]">
                          <p className="font-medium text-gray-800 truncate" title={product.name}>
                            {product.name}
                          </p>
                          <Link
                            to={`/products/${product?.category?.toLowerCase()}/${product._id}`}
                            className="text-xs text-primary hover:underline"
                            target="_blank"
                          >
                            View in store ↗
                          </Link>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                          {product.category}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-medium text-gray-800">
                        <span>
                          {currency}
                          {product.offerPrice || product.price}
                        </span>
                        {product.price > product.offerPrice && (
                          <span className="text-xs text-gray-400 line-through ml-1.5">
                            {currency}
                            {product.price}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleStock(product._id, !product.inStock)}
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition cursor-pointer ${
                            product.inStock
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {product.inStock ? "✓ In Stock" : "✕ Out of Stock"}
                        </button>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          disabled={deletingId === product._id}
                          className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded transition cursor-pointer disabled:opacity-50"
                          title="Delete Product"
                        >
                          {deletingId === product._id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductList;
