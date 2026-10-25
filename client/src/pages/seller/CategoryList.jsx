import React, { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";

const PRESET_COLORS = [
  { name: "Gold Butter", hex: "#FEF6DA" },
  { name: "Peach Rose", hex: "#FEE0E0" },
  { name: "Fresh Mint", hex: "#E1F5EC" },
  { name: "Sky Azure", hex: "#E0F6FE" },
  { name: "Lavender", hex: "#F1E3F9" },
  { name: "Citrus Lime", hex: "#F0F5DE" },
  { name: "Soft Apricot", hex: "#FEE6CD" },
  { name: "Pure White", hex: "#FFFFFF" }
];

const PRESET_IMAGES = [
  { label: "Dairy & Milk", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400" },
  { label: "Fresh Vegetables", url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400" },
  { label: "Fresh Fruits", url: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=400" },
  { label: "Cold Drinks", url: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400" },
  { label: "Instant Foods", url: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=400" },
  { label: "Bakery & Breads", url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400" },
  { label: "Grains & Pulses", url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400" },
  { label: "Snacks & Munchies", url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400" },
  { label: "Spices & Masala", url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400" }
];

const CategoryList = () => {
  const { categories, fetchCategories, products, axios } = useAppContext();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [description, setDescription] = useState("");
  const [bgColor, setBgColor] = useState("#FEF6DA");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const resetForm = () => {
    setName("");
    setPath("");
    setDescription("");
    setBgColor("#FEF6DA");
    setImageUrl("");
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingId(cat._id);
    setName(cat.name || cat.text || "");
    setPath(cat.path || "");
    setDescription(cat.description || "");
    setBgColor(cat.bgColor || "#FEF6DA");
    setImageUrl(cat.image || "");
    setImagePreview(cat.image || "");
    setImageFile(null);
    setShowModal(true);
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!editingId) {
      // Auto-suggest slug
      const slug = val
        .trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .replace(/\s+/g, "_");
      setPath(slug);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Category name is required.");
    }
    if (!path.trim()) {
      return toast.error("Category path / slug is required.");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("text", name.trim());
      formData.append("path", path.trim());
      formData.append("bgColor", bgColor);
      formData.append("description", description.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      } else if (imageUrl) {
        formData.append("imageUrl", imageUrl.trim());
      }

      if (editingId) {
        formData.append("id", editingId);
        const { data } = await axios.post("/api/category/update", formData);
        if (data.success) {
          toast.success(data.message || "Category updated successfully!");
          setShowModal(false);
          resetForm();
          fetchCategories();
        } else {
          toast.error(data.message || "Failed to update category");
        }
      } else {
        const { data } = await axios.post("/api/category/add", formData);
        if (data.success) {
          toast.success(data.message || "Category created successfully!");
          setShowModal(false);
          resetForm();
          fetchCategories();
        } else {
          toast.error(data.message || "Failed to create category");
        }
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!cat._id) {
      return toast.error("Default presets can only be managed after saving in database.");
    }

    const count = products.filter(
      (p) => p.category?.toLowerCase() === cat.path?.toLowerCase()
    ).length;

    const confirmMsg = count > 0
      ? `Are you sure you want to delete '${cat.name || cat.text}'? Note: ${count} products are currently linked to this category.`
      : `Are you sure you want to delete category '${cat.name || cat.text}'?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const { data } = await axios.post("/api/category/delete", { id: cat._id });
      if (data.success) {
        toast.success(data.message || "Category deleted successfully!");
        fetchCategories();
      } else {
        toast.error(data.message || "Failed to delete category");
      }
    } catch (error) {
      toast.error(error.message || "Error deleting category");
    }
  };

  const filteredCategories = (categories || []).filter((cat) => {
    const q = searchFilter.toLowerCase();
    const cName = (cat.name || cat.text || "").toLowerCase();
    const cPath = (cat.path || "").toLowerCase();
    return cName.includes(q) || cPath.includes(q);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
              Store Catalog
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-medium">
              {categories.length} Total Categories
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            Category Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create, customize, and manage grocery categories displayed on the customer storefront.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-600 text-white font-medium text-sm rounded-xl shadow-md transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <span className="text-lg leading-none">+</span>
          <span>Create New Category</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search categories by name or slug..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary transition"
          />
          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
        </div>
        <p className="text-xs text-gray-500 font-medium self-end sm:self-center">
          Showing {filteredCategories.length} of {categories.length} categories
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredCategories.map((cat, index) => {
          const linkedCount = products.filter(
            (p) => p.category?.toLowerCase() === cat.path?.toLowerCase()
          ).length;

          return (
            <div
              key={cat._id || index}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              {/* Visual Card Banner (Matches Customer Home appearance) */}
              <div
                className="p-5 flex flex-col items-center justify-center relative transition"
                style={{ backgroundColor: cat.bgColor || "#FEF6DA" }}
              >
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/60 text-white text-[10px] font-semibold rounded-md backdrop-blur-xs">
                  /{cat.path}
                </span>

                <div className="w-24 h-24 flex items-center justify-center my-2">
                  <img
                    src={cat.image}
                    alt={cat.name || cat.text}
                    className="max-h-20 max-w-20 object-contain group-hover:scale-110 transition duration-300 drop-shadow-sm"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
                    }}
                  />
                </div>

                <div
                  className="w-4 h-4 rounded-full border border-white/80 absolute top-2.5 right-2.5 shadow-xs"
                  style={{ backgroundColor: cat.bgColor || "#FEF6DA" }}
                  title={`Color: ${cat.bgColor || "#FEF6DA"}`}
                />
              </div>

              {/* Details & Actions */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-tight">
                    {cat.name || cat.text}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                      📦 {linkedCount} {linkedCount === 1 ? "Product" : "Products"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition cursor-pointer flex-1 text-center"
                  >
                    Edit
                  </button>
                  {cat._id && (
                    <button
                      onClick={() => handleDelete(cat)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer text-center"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
          <p className="text-4xl">📂</p>
          <h3 className="text-lg font-bold text-gray-800">No categories found</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            {searchFilter
              ? `No categories matching "${searchFilter}". Try clearing your search.`
              : "Get started by creating your first custom category for Manish Super Market!"}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-600 transition cursor-pointer"
          >
            + Create New Category
          </button>
        </div>
      )}

      {/* Create / Edit Category Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingId ? "Edit Category" : "Create New Category"}
                </h2>
                <p className="text-xs text-gray-500">
                  Configure category appearance and linking for customer navigation
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spices & Seasoning"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary transition"
                />
              </div>

              {/* Path / URL Slug */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category Slug / Path *
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-primary transition">
                  <span className="px-3 py-2.5 bg-gray-100 text-gray-500 text-xs font-mono border-r border-gray-300">
                    /products/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Spices"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    className="w-full px-3 py-2 text-sm outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  This identifier links products to this category in the dropdown and URL.
                </p>
              </div>

              {/* Background Color Picker & Presets */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Card Theme / Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    placeholder="#FEF6DA"
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
                {/* Preset swatches */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      type="button"
                      key={preset.hex}
                      onClick={() => setBgColor(preset.hex)}
                      className={`px-2.5 py-1 text-[11px] rounded-md font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                        bgColor.toLowerCase() === preset.hex.toLowerCase()
                          ? "border-primary ring-1 ring-primary font-bold"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-black/20" style={{ backgroundColor: preset.hex }} />
                      <span className="text-gray-800">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Selection / Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category Image
                </label>

                {/* Upload File Input */}
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-primary rounded-xl cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition text-sm text-gray-600">
                    <img src={assets.upload_area} alt="upload" className="w-5 h-5 object-contain opacity-70" />
                    <span>Upload image from computer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {imagePreview && (
                    <div
                      className="w-16 h-16 rounded-xl border border-gray-200 p-1 flex items-center justify-center shrink-0"
                      style={{ backgroundColor: bgColor }}
                    >
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-12 max-w-12 object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* OR Custom URL */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-gray-500 font-medium">Or paste image URL:</span>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImagePreview(e.target.value);
                      setImageFile(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-primary transition"
                  />
                </div>

                {/* Preset Fast Selection */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-gray-500 font-medium">Or pick from standard supermarket presets:</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 border border-gray-100 rounded-lg bg-gray-50">
                    {PRESET_IMAGES.map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => {
                          setImageUrl(preset.url);
                          setImagePreview(preset.url);
                          setImageFile(null);
                        }}
                        className="px-2 py-1 bg-white border border-gray-200 hover:border-primary rounded text-[11px] text-gray-700 transition cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Short Description (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Authentic aromatic Indian spices and daily cooking herbs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary transition resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-semibold text-sm rounded-xl transition cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
