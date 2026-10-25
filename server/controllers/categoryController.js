import { v2 as cloudinary } from "cloudinary";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

// Initial default categories for Manish Super Market
export const initialDefaultCategories = [
  {
    text: "Chocolates & Sweets",
    name: "Chocolates & Sweets",
    path: "Chocolates",
    image: "https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FDF2F8",
    description: "Premium Cadbury Silk, dark chocolates, wafers & sweets"
  },
  {
    text: "Cold Drinks & Sodas",
    name: "Cold Drinks & Sodas",
    path: "Drinks",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400",
    bgColor: "#F0F5DE",
    description: "Chilled soft drinks, juices, energy drinks & mineral waters"
  },
  {
    text: "Dairy Products",
    name: "Dairy Products",
    path: "Dairy",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEE6CD",
    description: "Farm-fresh milk, butter, cheese blocks, paneer & curd"
  },
  {
    text: "Ice Creams & Frozen",
    name: "Ice Creams & Frozen",
    path: "Ice Cream",
    image: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=400",
    bgColor: "#EFF6FF",
    description: "Amul TriCones, chocobars, kulfis, sundaes & tubs"
  },
  {
    text: "Cleaning & Household",
    name: "Cleaning & Household",
    path: "Cleaning",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&q=80&w=400",
    bgColor: "#F0FDF4",
    description: "Harpic, Lizol, Vim dishwash, Domex & Colin cleaners"
  },
  {
    text: "Personal & Hair Care",
    name: "Personal & Hair Care",
    path: "Personal Care",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FAF5FF",
    description: "Shampoos, conditioners, hair colours, body washes & skincare"
  },
  {
    text: "Spices, Masalas & Pantry",
    name: "Spices, Masalas & Pantry",
    path: "Spices",
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEF3C7",
    description: "Everest blended masalas, achar spices, pure flours & honey"
  },
  {
    text: "Groceries & Cooking Oils",
    name: "Groceries & Cooking Oils",
    path: "Grocery",
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FFF7ED",
    description: "Refined cooking oils, whole wheat atta, grains & crunchy snacks"
  },
  {
    text: "Instant Food & Desserts",
    name: "Instant Food & Desserts",
    path: "Instant",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=400",
    bgColor: "#E1F5EC",
    description: "Gits dessert mixes, gulab jamun, quick snacks & ready meals"
  },
  {
    text: "Electrical & Lights",
    name: "Electrical & Lights",
    path: "Electrical",
    image: "https://images.unsplash.com/photo-1550524514-4b533f81e3a9?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEF9C3",
    description: "Wipro LED bulbs, emergency lights, festive string lights & candles"
  },
  {
    text: "Organic Veggies",
    name: "Organic Veggies",
    path: "Vegetables",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEF6DA",
    description: "Farm-fresh organic leafy vegetables and greens"
  },
  {
    text: "Fresh Fruits",
    name: "Fresh Fruits",
    path: "Fruits",
    image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=400",
    bgColor: "#FEE0E0",
    description: "Sweet, juicy seasonal and imported fresh fruits"
  },
  {
    text: "Bakery & Breads",
    name: "Bakery & Breads",
    path: "Bakery",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400",
    bgColor: "#E0F6FE",
    description: "Whole wheat breads, morning muffins, and fresh buns"
  }
];

export const seedInitialCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(initialDefaultCategories);
      console.log(`Seeded ${initialDefaultCategories.length} default categories!`);
    }
  } catch (error) {
    console.log("Category seeding note:", error.message);
  }
};

// GET /api/category/list
export const getCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ createdAt: 1 });
    if (!categories || categories.length === 0) {
      await seedInitialCategories();
      categories = await Category.find().sort({ createdAt: 1 });
    }
    return res.json({ success: true, categories });
  } catch (error) {
    console.log("getCategories error:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

// POST /api/category/add (authSeller)
export const addCategory = async (req, res) => {
  try {
    const { name, text, path: rawPath, bgColor, description, imageUrl } = req.body;

    const categoryName = (name || text || "").trim();
    if (!categoryName) {
      return res.json({ success: false, message: "Category name is required" });
    }

    // Auto-generate or sanitize path/slug
    let cleanPath = (rawPath || categoryName)
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .replace(/\s+/g, "_");

    if (!cleanPath) {
      cleanPath = `Category_${Date.now()}`;
    }

    // Check if category already exists with same path or name
    const existing = await Category.findOne({
      $or: [
        { path: new RegExp(`^${cleanPath}$`, "i") },
        { name: new RegExp(`^${categoryName}$`, "i") }
      ]
    });

    if (existing) {
      return res.json({
        success: false,
        message: `Category '${categoryName}' or path '${cleanPath}' already exists.`
      });
    }

    let image = imageUrl ? imageUrl.trim() : "";

    // If an image file was uploaded
    if (req.file) {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image"
        });
        image = uploadResult.secure_url;
      } else {
        const protocol = req.protocol;
        const host = req.get("host");
        image = `${protocol}://${host}/uploads/${req.file.filename}`;
      }
    }

    if (!image) {
      image = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
    }

    const newCategory = await Category.create({
      name: categoryName,
      text: (text || categoryName).trim(),
      path: cleanPath,
      image,
      bgColor: (bgColor || "#FEF6DA").trim(),
      description: (description || "").trim()
    });

    return res.json({
      success: true,
      message: `Category '${newCategory.name}' created successfully!`,
      category: newCategory
    });
  } catch (error) {
    console.log("addCategory error:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

// POST /api/category/update (authSeller)
export const updateCategory = async (req, res) => {
  try {
    const { id, name, text, path: rawPath, bgColor, description, imageUrl } = req.body;

    if (!id) {
      return res.json({ success: false, message: "Category ID is required" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    if (name) category.name = name.trim();
    if (text) category.text = text.trim();
    if (bgColor) category.bgColor = bgColor.trim();
    if (description !== undefined) category.description = description.trim();

    if (rawPath) {
      const cleanPath = rawPath
        .toString()
        .trim()
        .replace(/[^a-zA-Z0-9_\-\s]/g, "")
        .replace(/\s+/g, "_");

      if (cleanPath && cleanPath !== category.path) {
        const duplicate = await Category.findOne({
          path: cleanPath,
          _id: { $ne: id }
        });
        if (duplicate) {
          return res.json({ success: false, message: "Category path is already in use by another category" });
        }
        category.path = cleanPath;
      }
    }

    if (req.file) {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
          resource_type: "image"
        });
        category.image = uploadResult.secure_url;
      } else {
        const protocol = req.protocol;
        const host = req.get("host");
        category.image = `${protocol}://${host}/uploads/${req.file.filename}`;
      }
    } else if (imageUrl && imageUrl.trim()) {
      category.image = imageUrl.trim();
    }

    await category.save();

    return res.json({
      success: true,
      message: "Category updated successfully!",
      category
    });
  } catch (error) {
    console.log("updateCategory error:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

// POST /api/category/delete (authSeller)
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.json({ success: false, message: "Category ID is required" });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    // Optional warning or check for associated products
    const productCount = await Product.countDocuments({
      category: { $regex: new RegExp(`^${category.path}$`, "i") }
    });

    await Category.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Category '${category.name}' deleted successfully.${
        productCount > 0 ? ` Note: ${productCount} products are tagged with this category.` : ""
      }`
    });
  } catch (error) {
    console.log("deleteCategory error:", error.message);
    return res.json({ success: false, message: error.message });
  }
};
