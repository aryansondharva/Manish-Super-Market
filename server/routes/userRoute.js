import express from "express";
import {
  isAuth,
  login,
  logOut,
  register,
  updateProfile
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";

const userRouter = express.Router();
userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/update-profile", authUser, updateProfile);
userRouter.get("/is-auth", authUser, isAuth);
userRouter.get("/logout", authUser, logOut);

export default userRouter;
