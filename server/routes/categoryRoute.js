import express from "express";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController.js";

const categoryRouter = express.Router();

categoryRouter.get("/list", getCategories);
categoryRouter.post("/add", upload.single("image"), authSeller, addCategory);
categoryRouter.post("/update", upload.single("image"), authSeller, updateCategory);
categoryRouter.post("/delete", authSeller, deleteCategory);

export default categoryRouter;
