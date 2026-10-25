import mongoose from "mongoose";

const getMongoUri = () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables! Please add MONGODB_URI in your Vercel/server environment settings."
    );
  }

  // Handle existing db name or query parameters
  if (uri.includes("mongodb+srv://") || uri.includes("mongodb://")) {
    // If uri already includes grocerydelivery or a db name
    if (uri.includes("/grocerydelivery")) {
      return uri;
    }
    if (uri.includes("?")) {
      const [base, query] = uri.split("?");
      const cleanBase = base.endsWith("/") ? base : `${base}/`;
      return `${cleanBase}grocerydelivery?${query}`;
    }
    return uri.endsWith("/") ? `${uri}grocerydelivery` : `${uri}/grocerydelivery`;
  }

  return uri;
};

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2 && cachedPromise) {
    return cachedPromise;
  }

  try {
    const mongoUri = getMongoUri();
    mongoose.connection.on("connected", () => {
      console.log("Database Connected successfully to MongoDB Atlas");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err.message);
    });

    cachedPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
      bufferCommands: true,
    });

    await cachedPromise;
    return mongoose.connection;
  } catch (error) {
    cachedPromise = null;
    console.error("Critical MongoDB connection failure:", error.message);
    throw error;
  }
};

export default connectDB;
