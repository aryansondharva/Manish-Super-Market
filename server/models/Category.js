import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    text: {
      type: String,
      trim: true,
      default: ""
    },
    path: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    image: {
      type: String,
      default: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400"
    },
    bgColor: {
      type: String,
      default: "#FEF6DA",
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

const Category = mongoose.models.category || mongoose.model("category", categorySchema);

export default Category;
