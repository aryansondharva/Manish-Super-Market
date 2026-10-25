import React, { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

function ProductList() {
  const { products, currency, fetchProducts, axios } = useAppContext();
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => {
    const list = new Set();
    products.forEach((p) => {
      if (p.category) list.add(p.category);
    });
    return ["All", ...Array.from(list)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const totalInStock = useMemo(() => products.filter((p) => p.inStock).length, [products]);
  const totalOutOfStock = useMemo(() => products.filter((p) => !p.inStock).length, [products]);

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
    <div className="flex-1 p-4 md:p-8 min-h-[92vh] overflow-y-auto bg-gray-50/50">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory & Products</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your store's product catalog, instant stock status, and prices in {currency} (INR).
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{products.length}</p>
          </div>
          <span className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            📦
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">In Stock</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{totalInStock}</p>
          </div>
          <span className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl">
            ✓
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Out of Stock</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{totalOutOfStock}</p>
          </div>
          <span className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center text-xl">
            ✕
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-hidden focus:border-primary"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="w-full overflow-hidden rounded-xl bg-white border border-gray-200 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price ({currency})</th>
                <th className="px-5 py-3.5 text-center">Stock Toggle</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No products matched your search or filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
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
                        <div className="max-w-[240px]">
                          <p className="font-medium text-gray-800 truncate" title={product.name}>
                            {product.name}
                          </p>
                          <Link
                            to={`/products/${product?.category?.toLowerCase()}/${product._id}`}
                            className="text-xs text-primary hover:underline font-normal"
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
                          className={`px-3 py-1 text-xs font-semibold rounded-full transition cursor-pointer shadow-2xs ${
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
