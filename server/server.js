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
import categoryRouter from "./routes/categoryRoute.js";
import { seedInitialCategories } from "./controllers/categoryController.js";
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

connectCloudinary().catch((err) => console.log("Cloudinary setup note:", err.message));
connectDB()
  .then(() => seedInitialData())
  .catch((err) => console.log("Initial DB connection note:", err.message));

// Seed initial grocery products and demo customer if needed
const seedInitialData = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("Database has no products. Seeding 469 catalog grocery items...");
      let initialItems = [];
      const catalogPath = path.resolve("data", "products469.json");
      if (fs.existsSync(catalogPath)) {
        initialItems = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
      }
      if (initialItems.length > 0) {
        await Product.insertMany(initialItems);
        console.log(`Successfully seeded ${initialItems.length} catalog products!`);
      }
    }

    // Seed demo customer if not exists
    const demoCustomer = await User.findOne({ email: "customer@grocery.com" });
    const strongDemoPass = await bcrypt.hash("Customer@123", 10);
    if (!demoCustomer) {
      await User.create({
        name: "Alex Customer",
        email: "customer@grocery.com",
        password: strongDemoPass,
        cartItems: {}
      });
      console.log("Demo customer account seeded (customer@grocery.com / Customer@123)");
    } else {
      // Ensure demo account has the strong password
      await User.findByIdAndUpdate(demoCustomer._id, { password: strongDemoPass });
    }

    // Ensure initial categories are available in database
    await seedInitialCategories();
  } catch (error) {
    console.log("Data seeding note:", error.message);
  }
};

app.use("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);
app.get("/", (req, res) => res.send("Manish Super Market API is Working"));

app.use(express.json());
app.use(cookieParser());

// Static folder for uploaded images
app.use("/uploads", express.static(uploadsDir));

// Dynamic CORS allowing all origins in development and production
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      callback(null, true);
    }
  })
);

// Ensure database is ready before processing API routes (vital for Vercel serverless cold starts)
app.use(async (req, res, next) => {
  if (req.path === "/" || req.path.startsWith("/uploads")) {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Database connection failed. Please ensure MongoDB Atlas Network Access allows 0.0.0.0/0 and MONGODB_URI is correctly configured.",
      error: error.message
    });
  }
});

app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}`);
  });
}

export default app;
