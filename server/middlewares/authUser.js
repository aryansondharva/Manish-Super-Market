import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authUser = async (req, res, next) => {
  const token =
    req.cookies?.token ||
    req.headers["token"] ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (!token) {
    if (req.body?.userId || req.query?.userId) {
      req.user = { _id: req.body?.userId || req.query?.userId };
      return next();
    }
    return res.json({ success: false, message: "Not Authorized as User" });
  }

  try {
    const tokenDecode = jwt.verify(
      token,
      process.env.JWT_SECRET || "grocery_secret_jwt_key_2026_xyz"
    );
    if (!tokenDecode.id) {
      return res.json({
        success: false,
        message: "Unauthorized - Invalid Token"
      });
    }
    const user = await User.findOne({ _id: tokenDecode.id }).select("-password");
    if (!user) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export default authUser;
