import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

export const addProduct = async (req, res) => {
  try {
    let productData =
      typeof req.body.productData === "string"
        ? JSON.parse(req.body.productData)
        : req.body.productData || req.body;

    const files = req.files || [];

    let imagesUrl = [];

    // If files are uploaded
    if (files.length > 0) {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        imagesUrl = await Promise.all(
          files.map(async (item) => {
            let result = await cloudinary.uploader.upload(item.path, {
              resource_type: "image"
            });
            return result.secure_url;
          })
        );
      } else {
        const protocol = req.protocol;
        const host = req.get("host");
        imagesUrl = files.map((file) => `${protocol}://${host}/uploads/${file.filename}`);
      }
    }

    // If client provided image URLs in productData
    if (imagesUrl.length === 0 && productData.image) {
      if (Array.isArray(productData.image)) {
        imagesUrl = productData.image.filter(Boolean);
      } else if (typeof productData.image === "string" && productData.image.trim()) {
        imagesUrl = [productData.image.trim()];
      }
    }

    if (imagesUrl.length === 0 && productData.images) {
      if (Array.isArray(productData.images)) {
        imagesUrl = productData.images.filter(Boolean);
      } else if (typeof productData.images === "string" && productData.images.trim()) {
        imagesUrl = [productData.images.trim()];
      }
    }

    // Default grocery image fallback
    if (imagesUrl.length === 0) {
      imagesUrl = [
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400"
      ];
    }

    let descriptionArray = [];
    if (Array.isArray(productData.description)) {
      descriptionArray = productData.description;
    } else if (typeof productData.description === "string") {
      descriptionArray = productData.description
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (descriptionArray.length === 0) {
      descriptionArray = ["Fresh quality grocery item", "Carefully handpicked and packed"];
    }

    const price = Number(productData.price) || 10;
    const offerPrice = Number(productData.offerPrice) || price;

    const newProduct = await Product.create({
      name: productData.name,
      category: productData.category || "Vegetables",
      price,
      offerPrice,
      description: descriptionArray,
      image: imagesUrl,
      inStock: productData.inStock !== undefined ? Boolean(productData.inStock) : true
    });

    res.json({
      success: true,
      message: "Product Added Successfully",
      product: newProduct
    });
  } catch (error) {
    console.log("Error in addProduct:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const productList = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const productById = async (req, res) => {
  try {
    const id = req.body?.id || req.query?.id;
    const product = await Product.findById(id);
    res.json({ success: true, message: product, product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;
    await Product.findByIdAndUpdate(id, { inStock });
    res.json({ success: true, message: "Stock Updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.body;
    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: "Product Deleted Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    let productData =
      typeof req.body.productData === "string"
        ? JSON.parse(req.body.productData)
        : req.body.productData || req.body;

    const id = req.body.id || req.body._id || productData.id || productData._id;

    if (!id) {
      return res.json({ success: false, message: "Product ID is required for editing" });
    }

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.json({ success: false, message: "Product not found" });
    }

    const files = req.files || [];
    let imagesUrl = [];

    if (files.length > 0) {
      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        imagesUrl = await Promise.all(
          files.map(async (item) => {
            let result = await cloudinary.uploader.upload(item.path, {
              resource_type: "image"
            });
            return result.secure_url;
          })
        );
      } else {
        const protocol = req.protocol;
        const host = req.get("host");
        imagesUrl = files.map((file) => `${protocol}://${host}/uploads/${file.filename}`);
      }
    }

    // If client provided image URL
    if (imagesUrl.length === 0 && productData.image) {
      if (Array.isArray(productData.image)) {
        imagesUrl = productData.image.filter(Boolean);
      } else if (typeof productData.image === "string" && productData.image.trim()) {
        imagesUrl = [productData.image.trim()];
      }
    }

    // Keep existing images if no new images uploaded
    if (imagesUrl.length === 0) {
      imagesUrl = existingProduct.image;
    }

    let descriptionArray = existingProduct.description;
    if (productData.description !== undefined) {
      if (Array.isArray(productData.description)) {
        descriptionArray = productData.description;
      } else if (typeof productData.description === "string") {
        descriptionArray = productData.description
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const updateFields = {
      name: productData.name !== undefined ? productData.name.trim() : existingProduct.name,
      category: productData.category !== undefined ? productData.category : existingProduct.category,
      price: productData.price !== undefined ? Number(productData.price) : existingProduct.price,
      offerPrice:
        productData.offerPrice !== undefined
          ? Number(productData.offerPrice)
          : existingProduct.offerPrice,
      description: descriptionArray,
      image: imagesUrl,
      inStock:
        productData.inStock !== undefined
          ? Boolean(productData.inStock)
          : existingProduct.inStock
    };

    const updated = await Product.findByIdAndUpdate(id, updateFields, { new: true });

    return res.json({
      success: true,
      message: `Product "${updated.name}" updated successfully!`,
      product: updated
    });
  } catch (error) {
    console.log("Error in updateProduct:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

