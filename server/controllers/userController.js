import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const getJwtSecret = () => process.env.JWT_SECRET || "grocery_secret_jwt_key_2026_xyz";

const formatUserResponse = (user) => {
  const parts = (user.name || "").trim().split(" ");
  const fallbackFirst = parts[0] || "";
  const fallbackLast = parts.slice(1).join(" ") || "";

  return {
    _id: user._id,
    email: user.email,
    name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    firstName: user.firstName || fallbackFirst,
    lastName: user.lastName || fallbackLast,
    phone: user.phone || "",
    cartItems: user.cartItems || {}
  };
};

export const register = async (req, res) => {
  try {
    const { name, firstName, lastName, phone, email, password } = req.body;
    if ((!name && (!firstName || !lastName)) || !email || !password) {
      return res.json({ success: false, message: "Missing required registration details" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists with this email" });
    }

    const fName = (firstName || name?.split(" ")[0] || "").trim();
    const lName = (lastName || name?.split(" ").slice(1).join(" ") || "").trim();
    const fullName = name ? name.trim() : `${fName} ${lName}`.trim();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: fullName,
      firstName: fName,
      lastName: lName,
      phone: (phone || "").trim(),
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
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.log("register error:", error.message);
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
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.log("login error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { firstName, lastName, phone } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.json({
        success: false,
        message: "First Name, Last Name, and Phone Number are all required."
      });
    }

    const cleanPhone = phone.trim();
    if (cleanPhone.length < 7) {
      return res.json({
        success: false,
        message: "Please enter a valid phone number (at least 7 digits)."
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: cleanPhone,
        name: `${firstName.trim()} ${lastName.trim()}`
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully!",
      user: formatUserResponse(updatedUser)
    });
  } catch (error) {
    console.log("updateProfile error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

export const isAuth = async (req, res) => {
  try {
    return res.json({ success: true, user: formatUserResponse(req.user) });
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
    console.log("logout error:", error.message);
    res.json({ success: false, message: error.message });
  }
};
