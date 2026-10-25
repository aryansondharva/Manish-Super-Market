import express from "express";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";
import {
  addProduct,
  changeStock,
  productById,
  productList,
  deleteProduct,
  updateProduct
} from "../controllers/productController.js";

const productRouter = express.Router();

productRouter.post("/add", upload.array("images", 6), authSeller, addProduct);
productRouter.post("/update", upload.array("images", 6), authSeller, updateProduct);
productRouter.get("/list", productList);
productRouter.get("/id", productById);
productRouter.post("/id", productById);
productRouter.post("/stock", authSeller, changeStock);
productRouter.post("/delete", authSeller, deleteProduct);

export default productRouter;
