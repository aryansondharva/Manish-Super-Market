import express from "express";
import authUser from "../middlewares/authUser.js";
import {
  getAllOrders,
  getUserOrder,
  placeOrderCOD,
  placeOrderStripe,
  updateOrderStatus,
  cancelOrder
} from "../controllers/orderController.js";
import authSeller from "../middlewares/authSeller.js";

const orderRouter = express.Router();

orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.get("/user", authUser, getUserOrder);
orderRouter.get("/seller", authSeller, getAllOrders);
orderRouter.post("/status", authSeller, updateOrderStatus);
orderRouter.post("/cancel", authUser, cancelOrder);
orderRouter.post("/stripe", authUser, placeOrderStripe);

export default orderRouter;
