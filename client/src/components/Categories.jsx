import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

export default function Categories() {
  const { navigate, categories } = useAppContext();
  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl font-medium">Categories</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 mt-6 gap-6">
        {(categories || []).map((category, index) => (
          <div
            key={category._id || index}
            className="group cursor-pointer py-5 px-3 gap-2 rounded-lg flex flex-col justify-center items-center text-center transition hover:shadow-xs"
            style={{ background: category.bgColor || "#FEF6DA" }}
            onClick={() => {
              navigate(`/products/${category.path.toLowerCase()}`);
              scrollTo(0, 0);
            }}
          >
            <img
              src={category.image}
              alt={category.name || category.text}
              className="group-hover:scale-108 transition max-w-24 max-h-24 object-contain"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
              }}
            />
            <p className="text-sm font-medium text-gray-800 line-clamp-1">{category.name || category.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
