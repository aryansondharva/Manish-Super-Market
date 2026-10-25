import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import connectDB from "./configs/db.js";
import "dotenv/config";
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import connectCloudinary from "./configs/cloudinary.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";
import { stripeWebhooks } from "./controllers/orderController.js";
import Product from "./models/Product.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

const app = express();
const port = process.env.PORT || 4000;

// Ensure uploads folder exists
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

await connectDB();
await connectCloudinary();

// Seed initial grocery products and demo customer if needed
const seedInitialData = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("Database has no products. Seeding initial grocery items...");
      const initialItems = [
        {
          name: "Fresh Organic Potato 1kg",
          category: "Vegetables",
          price: 30,
          offerPrice: 24,
          image: [
            "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Fresh farm-harvested potatoes", "Rich in dietary fiber and potassium", "Ideal for daily cooking and roasting"],
          inStock: true
        },
        {
          name: "Ripe Red Tomatoes 1kg",
          category: "Vegetables",
          price: 45,
          offerPrice: 38,
          image: [
            "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Naturally ripened juicy tomatoes", "Rich in Lycopene and Vitamin C", "Perfect for salads, gravies, and soups"],
          inStock: true
        },
        {
          name: "Fresh Crisp Carrots 500g",
          category: "Vegetables",
          price: 35,
          offerPrice: 28,
          image: [
            "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Sweet and crunchy garden carrots", "High in Beta-carotene and Vitamin A", "Excellent for juicing and cooking"],
          inStock: true
        },
        {
          name: "Royal Gala Apples 1kg",
          category: "Fruits",
          price: 120,
          offerPrice: 99,
          image: [
            "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Crisp and sweet gala apples", "Packed with antioxidants and fiber", "Great healthy snack for all ages"],
          inStock: true
        },
        {
          name: "Fresh Robusta Bananas 1 Dozen",
          category: "Fruits",
          price: 50,
          offerPrice: 42,
          image: [
            "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Sweet and energy-rich bananas", "Rich in potassium and vitamins", "Natural immunity booster"],
          inStock: true
        },
        {
          name: "Fresh Whole Milk 1L",
          category: "Dairy",
          price: 35,
          offerPrice: 32,
          image: [
            "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Pure pasteurized homogenized whole milk", "Rich in calcium and protein", "Essential for daily nutrition"],
          inStock: true
        },
        {
          name: "Artisan Whole Wheat Bread 400g",
          category: "Bakery",
          price: 40,
          offerPrice: 35,
          image: [
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Freshly baked 100% whole wheat bread", "No artificial preservatives", "Soft texture and rich fiber"],
          inStock: true
        },
        {
          name: "Natural Cold-Pressed Orange Juice 500ml",
          category: "Drinks",
          price: 60,
          offerPrice: 49,
          image: [
            "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["100% freshly squeezed orange juice", "No added sugar or artificial flavor", "Refreshing burst of natural vitamin C"],
          inStock: true
        },
        {
          name: "Premium Basmati Rice 1kg",
          category: "Grains",
          price: 110,
          offerPrice: 89,
          image: [
            "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Long grain aromatic basmati rice", "Aged to perfection for exquisite flavor", "Ideal for biryani and pulao"],
          inStock: true
        },
        {
          name: "Classic Instant Masala Noodles 4-Pack",
          category: "Instant",
          price: 55,
          offerPrice: 48,
          image: [
            "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=400"
          ],
          description: ["Delicious and quick instant spiced noodles", "Ready in under 3 minutes", "Packed with authentic herbs and spices"],
          inStock: true
        }
      ];
      await Product.insertMany(initialItems);
      console.log(`Successfully seeded ${initialItems.length} grocery products!`);
    }

    // Seed demo customer if not exists
    const demoCustomer = await User.findOne({ email: "customer@grocery.com" });
    if (!demoCustomer) {
      const hashedPassword = await bcrypt.hash("customer123", 10);
      await User.create({
        name: "Alex Customer",
        email: "customer@grocery.com",
        password: hashedPassword,
        cartItems: {}
      });
      console.log("Demo customer account seeded (customer@grocery.com / customer123)");
    }
  } catch (error) {
    console.log("Data seeding note:", error.message);
  }
};

await seedInitialData();

app.use("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);
app.get("/", (req, res) => res.send("Manish Super Store API is Working"));

app.use(express.json());
app.use(cookieParser());

// Static folder for uploaded images
app.use("/uploads", express.static(uploadsDir));

// Dynamic CORS allowing all origins in development
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      callback(null, true);
    }
  })
);

app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});
