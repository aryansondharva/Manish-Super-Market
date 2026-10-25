import React, { useState } from "react";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";
import { Link } from "react-router-dom";

// High quality curated grocery images for quick 1-click selection
const sampleGroceryImages = [
  {
    name: "Avocado",
    category: "Fruits",
    url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Strawberries",
    category: "Fruits",
    url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Broccoli",
    category: "Vegetables",
    url: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Fresh Milk",
    category: "Dairy",
    url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Croissant",
    category: "Bakery",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=400"
  },
  {
    name: "Orange Juice",
    category: "Drinks",
    url: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400"
  }
];

function AddProduct() {
  const { axios, fetchProducts, navigate, currency, categories } = useAppContext();

  const [files, setFiles] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Vegetables");
  const [price, setPrice] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [inStock, setInStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);

  const handleSelectSample = (sample) => {
    setImageUrl(sample.url);
    if (!name) setName(`Fresh ${sample.name}`);
    if (sample.category) setCategory(sample.category);
    toast.success(`Selected ${sample.name} image!`);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error("Please enter a product name");
    }
    if (!price || Number(price) <= 0) {
      return toast.error("Please enter a valid price");
    }

    setLoading(true);
    try {
      const descLines = description.trim()
        ? description.split("\n").map((d) => d.trim()).filter(Boolean)
        : ["Fresh and organic quality product", "Locally sourced and carefully inspected"];

      const productData = {
        name: name.trim(),
        description: descLines,
        category,
        price: Number(price),
        offerPrice: Number(offerPrice) || Number(price),
        inStock: Boolean(inStock),
        image: imageUrl.trim() ? [imageUrl.trim()] : []
      };

      const formData = new FormData();
      formData.append("productData", JSON.stringify(productData));

      for (let i = 0; i < files.length; i++) {
        if (files[i]) {
          formData.append("images", files[i]);
        }
      }

      const { data } = await axios.post("/api/product/add", formData);

      if (data.success) {
        toast.success("🎉 " + (data.message || "Product added! Live on storefront."));
        setLastAddedProduct(data.product || productData);
        await fetchProducts();

        setFiles([]);
        setName("");
        setDescription("");
        setPrice("");
        setOfferPrice("");
        setImageUrl("");
        setCategory("Vegetables");
      } else {
        toast.error(data.message || "Failed to add product");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-[92vh] overflow-y-auto p-4 md:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Add New Grocery Product</h1>
        <p className="text-sm text-gray-500">
          Newly added items will automatically appear on the customer storefront and be available for immediate purchase.
        </p>
      </div>

      {lastAddedProduct && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                "{lastAddedProduct.name}" is now live in the store!
              </p>
              <p className="text-xs text-emerald-700">
                Category: {lastAddedProduct.category} | Price: {currency}{lastAddedProduct.offerPrice || lastAddedProduct.price}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition"
            >
              View on Storefront
            </Link>
            <Link
              to="/seller/product-list"
              className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-medium rounded-lg hover:bg-emerald-100 transition"
            >
              All Products List
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={onSubmitHandler} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs">
        {/* Product Images Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Product Images
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Upload custom image files or select a quick 1-click grocery preset image below.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {Array(4)
              .fill("")
              .map((_, index) => (
                <label
                  key={index}
                  htmlFor={`image${index}`}
                  className="relative group border-2 border-dashed border-gray-300 rounded-xl p-1 hover:border-primary cursor-pointer transition w-24 h-24 flex items-center justify-center bg-gray-50 overflow-hidden"
                >
                  <input
                    accept="image/*"
                    type="file"
                    id={`image${index}`}
                    onChange={(e) => {
                      const updateFiles = [...files];
                      updateFiles[index] = e.target.files[0];
                      setFiles(updateFiles);
                    }}
                    hidden
                  />
                  {files[index] ? (
                    <img
                      className="w-full h-full object-cover rounded-lg"
                      src={URL.createObjectURL(files[index])}
                      alt={`upload-${index}`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-primary">
                      <img src={assets.upload_area} alt="upload" className="w-8 h-8 opacity-60" />
                      <span className="text-[10px] mt-1 font-medium">+ Add</span>
                    </div>
                  )}
                </label>
              ))}
          </div>

          {/* Quick presets */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-600 block mb-2">
              Or pick a 1-click Sample Grocery Image:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleGroceryImages.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition cursor-pointer ${
                    imageUrl === sample.url
                      ? "bg-primary text-white border-primary"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <img src={sample.url} alt={sample.name} className="w-4 h-4 rounded-full object-cover" />
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Direct URL */}
          <div className="mt-3">
            <input
              type="url"
              placeholder="Or enter direct Image URL (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-primary"
            />
          </div>
        </div>

        {/* Product Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="product-name">
              Product Name *
            </label>
            <input
              id="product-name"
              type="text"
              placeholder="e.g. Organic Honeycrisp Apples"
              className="w-full outline-none py-2 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary transition"
              required
              onChange={(e) => setName(e.target.value)}
              value={name}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700" htmlFor="category">
                Category *
              </label>
              <Link
                to="/seller/categories"
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>+ Create Category</span>
              </Link>
            </div>
            <select
              id="category"
              className="w-full outline-none py-2 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary bg-white cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {(categories || []).map((item, index) => (
                <option key={item._id || index} value={item.path}>
                  {item.name || item.text || item.path} ({item.path})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prices & Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="product-price">
              Regular Price (₹) *
            </label>
            <input
              id="product-price"
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 150"
              className="w-full outline-none py-2 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary transition"
              required
              onChange={(e) => setPrice(e.target.value)}
              value={price}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700" htmlFor="offer-price">
              Discounted / Selling Price (₹) *
            </label>
            <input
              id="offer-price"
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 120"
              className="w-full outline-none py-2 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary transition"
              required
              onChange={(e) => setOfferPrice(e.target.value)}
              value={offerPrice}
            />
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <label className="text-sm font-semibold text-gray-700 mb-2">
              Stock Status
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary accent-emerald-600"
              />
              <span className={`text-sm font-medium ${inStock ? "text-emerald-700" : "text-gray-400"}`}>
                {inStock ? "Available (In Stock)" : "Out of Stock"}
              </span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700" htmlFor="product-description">
            Product Features & Description (One per line)
          </label>
          <textarea
            id="product-description"
            rows={3}
            className="w-full outline-none py-2 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary resize-y"
            placeholder="100% Organic & pesticide-free&#10;Rich in essential nutrients and antioxidants&#10;Handpicked and packed fresh daily"
            onChange={(e) => setDescription(e.target.value)}
            value={description}
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-primary hover:bg-primary-600 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Adding to Storefront...</span>
              </>
            ) : (
              <>
                <span>➕</span>
                <span>Add Product to Store</span>
              </>
            )}
          </button>

          <Link
            to="/seller/product-list"
            className="px-5 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-sm font-medium transition"
          >
            Manage Product List
          </Link>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;
