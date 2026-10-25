import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET || "grocery_secret_jwt_key_2026_xyz";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      cartItems: {}
    });
    const token = jwt.sign({ id: user._id }, getJwtSecret(), {
      expiresIn: "7d"
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        cartItems: user.cartItems || {}
      }
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password are required"
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: false,
        message: "Invalid email or password"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id }, getJwtSecret(), {
      expiresIn: "7d"
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        cartItems: user.cartItems || {}
      }
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const isAuth = async (req, res) => {
  try {
    return res.json({ success: true, user: req.user });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
    });
    return res.json({ success: true, message: "Logged Out Successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
