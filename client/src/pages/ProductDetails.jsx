import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductsCard from "../components/ProductCard";

function ProductDetails() {
  const { products, navigate, currency, addToCart } = useAppContext();
  const { id } = useParams();

  const [relatedProducts, setRelatedProducts] = useState([]);
  const [thumbnail, setThumbnail] = useState(null);

  const product = products.find((item) => item._id === id);

  useEffect(() => {
    if (product && products.length > 0) {
      const filtered = products.filter(
        (item) =>
          item._id !== product._id &&
          item.category?.toLowerCase() === product.category?.toLowerCase()
      );
      setRelatedProducts(filtered.slice(0, 5));
    }
  }, [product, products]);

  useEffect(() => {
    if (product) {
      const primaryImage =
        (Array.isArray(product.image) ? product.image[0] : product.image) ||
        assets.upload_area;
      setThumbnail(primaryImage);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
        <p className="text-gray-500 text-sm mb-6">
          The requested grocery item could not be found or may have been removed.
        </p>
        <Link
          to="/products"
          className="px-6 py-2.5 bg-primary text-white font-medium rounded-full text-sm shadow-md"
        >
          Browse All Groceries
        </Link>
      </div>
    );
  }

  const imagesList = Array.isArray(product.image) && product.image.length > 0
    ? product.image
    : [thumbnail || assets.upload_area];

  return (
    <div className="mt-8 pb-20">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mb-6">
        <Link to="/" className="hover:text-primary transition">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary transition">Groceries</Link>
        <span>/</span>
        <Link
          to={`/products/${product.category?.toLowerCase()}`}
          className="hover:text-primary capitalize transition"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-primary font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="flex flex-col md:flex-row gap-10 lg:gap-14 bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xs">
        {/* Images Column */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 shrink-0 items-start">
          {imagesList.length > 1 && (
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto max-w-full sm:max-w-24">
              {imagesList.map((img, index) => (
                <div
                  key={index}
                  onClick={() => setThumbnail(img)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 border rounded-xl p-1 overflow-hidden cursor-pointer bg-white transition ${
                    thumbnail === img ? "border-primary ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.src = assets.upload_area; }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="w-full sm:w-80 md:w-96 h-72 sm:h-96 border border-gray-200 rounded-2xl p-4 flex items-center justify-center bg-gray-50/50 overflow-hidden">
            <img
              src={thumbnail || assets.upload_area}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => { e.target.src = assets.upload_area; }}
            />
          </div>
        </div>

        {/* Product Information Column */}
        <div className="flex-1 text-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full uppercase tracking-wider">
                {product.category}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                product.inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                {product.inStock ? "✓ In Stock" : "✕ Out of Stock"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-amber-400 text-sm">★★★★★</span>
              <span className="text-xs text-gray-500 font-medium">4.8 (120+ reviews)</span>
            </div>

            <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-primary">
                {currency}{product.offerPrice || product.price}
              </span>
              {product.price > product.offerPrice && (
                <span className="text-base text-gray-400 line-through">
                  MRP: {currency}{product.price}
                </span>
              )}
              <span className="text-xs text-emerald-700 font-semibold ml-auto">
                Inclusive of all taxes
              </span>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-2">
                About this item
              </h3>
              <ul className="space-y-1.5 text-gray-600 text-sm">
                {Array.isArray(product.description) ? (
                  product.description.map((desc, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{desc}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{product.description || "Fresh and farm-picked grocery item."}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              disabled={!product.inStock}
              onClick={() => addToCart(product._id)}
              className="w-full sm:w-1/2 py-3.5 px-6 font-semibold bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <img src={assets.cart_icon} alt="cart" className="w-4 h-4 opacity-70" />
              <span>Add to Cart</span>
            </button>
            <button
              disabled={!product.inStock}
              onClick={() => {
                addToCart(product._id);
                navigate("/cart");
              }}
              className="w-full sm:w-1/2 py-3.5 px-6 font-bold bg-primary hover:bg-primary-600 text-white rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>⚡ Buy Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Similar {product.category}</h2>
              <p className="text-xs text-gray-500">You might also like these fresh options</p>
            </div>
            <Link
              to={`/products/${product.category?.toLowerCase()}`}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View All {product.category} →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedProducts.map((prod) => (
              <ProductsCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetails;
