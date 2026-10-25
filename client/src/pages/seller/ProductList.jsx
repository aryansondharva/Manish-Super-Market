import React, { useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

const ALL_CATEGORY_OPTIONS = [
  "Vegetables",
  "Fruits",
  "Drinks",
  "Instant",
  "Dairy",
  "Bakery",
  "Grains"
];

function ProductList() {
  const { products, currency, fetchProducts, axios } = useAppContext();
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "Vegetables",
    price: "",
    offerPrice: "",
    description: "",
    inStock: true,
    image: ""
  });
  const [editFiles, setEditFiles] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const categories = useMemo(() => {
    const list = new Set(ALL_CATEGORY_OPTIONS);
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

  // Start editing product
  const handleStartEdit = (product) => {
    setEditingProduct(product);
    const img = (Array.isArray(product.image) ? product.image[0] : product.image) || "";
    const desc = Array.isArray(product.description)
      ? product.description.join("\n")
      : product.description || "";

    setEditForm({
      name: product.name || "",
      category: product.category || "Vegetables",
      price: product.price || "",
      offerPrice: product.offerPrice || "",
      description: desc,
      inStock: product.inStock !== false,
      image: img
    });
    setEditFiles([]);
  };

  // Save product edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return toast.error("Please enter a product name");
    if (!editForm.price || Number(editForm.price) <= 0) return toast.error("Please enter a valid price");

    try {
      setSavingEdit(true);
      const descLines = editForm.description.trim()
        ? editForm.description.split("\n").map((d) => d.trim()).filter(Boolean)
        : ["Fresh and organic quality product"];

      const payloadData = {
        id: editingProduct._id,
        name: editForm.name.trim(),
        category: editForm.category,
        price: Number(editForm.price),
        offerPrice: Number(editForm.offerPrice) || Number(editForm.price),
        description: descLines,
        inStock: Boolean(editForm.inStock),
        image: editForm.image.trim() ? [editForm.image.trim()] : []
      };

      const formData = new FormData();
      formData.append("productData", JSON.stringify(payloadData));
      formData.append("id", editingProduct._id);

      if (editFiles && editFiles.length > 0) {
        for (let i = 0; i < editFiles.length; i++) {
          formData.append("images", editFiles[i]);
        }
      }

      const { data } = await axios.post("/api/product/update", formData);
      if (data.success) {
        toast.success("🎉 " + (data.message || "Product updated successfully!"));
        setEditingProduct(null);
        await fetchProducts();
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch (error) {
      toast.error(error.message || "Error updating product");
    } finally {
      setSavingEdit(false);
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
              className="absolute right-3 top-2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
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
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-hidden focus:border-primary cursor-pointer"
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
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(product)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-md transition cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Edit Product Details"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDelete(product._id, product.name)}
                            disabled={deletingId === product._id}
                            className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 border border-transparent hover:border-red-200 px-2.5 py-1 rounded-md transition cursor-pointer disabled:opacity-50"
                            title="Delete Product"
                          >
                            {deletingId === product._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => !savingEdit && setEditingProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-xl w-full border border-gray-200 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2.5 py-0.5 bg-primary/10 rounded-full">
                  Admin Edit
                </span>
                <h2 className="text-xl font-bold text-gray-800 mt-1">
                  Edit Product Details
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update product name, prices, category, stock availability, and image.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                disabled={savingEdit}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Fresh Ripe Red Tomatoes 1kg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>

              {/* Category & Stock Toggle Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white cursor-pointer"
                  >
                    {ALL_CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stock Availability
                  </label>
                  <div className="flex items-center gap-3 pt-1.5">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, inStock: !editForm.inStock })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                        editForm.inStock
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-red-50 text-red-700 border-red-300"
                      }`}
                    >
                      {editForm.inStock ? "✓ In Stock" : "✕ Out of Stock"}
                    </button>
                    <span className="text-xs text-gray-400">
                      {editForm.inStock ? "Visible & Purchasable" : "Shown as Out of Stock"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing Row in INR */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Regular MRP ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Offer / Selling Price ({currency})
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.offerPrice}
                    onChange={(e) => setEditForm({ ...editForm, offerPrice: e.target.value })}
                    placeholder="e.g. 80"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              {/* Product Image URL & Preview */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Product Image URL
                </label>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-lg border border-gray-200 p-1 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
                    <img
                      src={editForm.image || assets.upload_area}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = assets.upload_area;
                      }}
                    />
                  </div>
                  <input
                    type="url"
                    value={editForm.image}
                    onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>
              </div>

              {/* Or Upload Image File */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Or Replace with Local Image File
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditFiles(Array.from(e.target.files))}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description (1 bullet per line)
                </label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Fresh farm produce&#10;Handpicked daily&#10;100% Organic"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEdit ? (
                    "Saving Changes..."
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductList;
