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

export const normalizePhone = (phone) => {
  if (!phone) return "";
  return phone.toString().replace(/[\s\-()]/g, "").trim();
};

export const validateStrongPassword = (password) => {
  if (!password || typeof password !== "string") {
    return "Password is required.";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter (A-Z).";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter (a-z).";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one digit (0-9).";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return "Password must contain at least one special symbol (!@#$%^&* etc.).";
  }
  return null;
};

export const register = async (req, res) => {
  try {
    const { name, firstName, lastName, phone, email, password } = req.body;
    if ((!name && (!firstName || !lastName)) || !email || !password) {
      return res.json({ success: false, message: "Missing required registration details" });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return res.json({ success: false, message: "Please enter a valid email address." });
    }

    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 7) {
      return res.json({ success: false, message: "Please enter a valid phone number (at least 7 digits)." });
    }

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      return res.json({ success: false, message: passwordError });
    }

    // Check unique email
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.json({ success: false, message: "An account already exists with this email address." });
    }

    // Check unique phone number
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.json({ success: false, message: "An account already exists with this phone number." });
    }

    const fName = (firstName || name?.split(" ")[0] || "").trim();
    const lName = (lastName || name?.split(" ").slice(1).join(" ") || "").trim();
    const fullName = name ? name.trim() : `${fName} ${lName}`.trim();

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: fullName,
      firstName: fName,
      lastName: lName,
      phone: cleanPhone,
      email: cleanEmail,
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
    if (error.code === 11000) {
      const isPhone = error.message.includes("phone") || (error.keyPattern && error.keyPattern.phone);
      return res.json({
        success: false,
        message: isPhone
          ? "An account already exists with this phone number."
          : "An account already exists with this email address."
      });
    }
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
        message: "Email/Phone and password are required"
      });
    }

    const identifier = (email || "").trim();
    const cleanEmail = identifier.toLowerCase();
    const cleanPhone = normalizePhone(identifier);

    // Support logging in with either unique email or unique phone number
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        ...(cleanPhone && cleanPhone.length >= 7 ? [{ phone: cleanPhone }] : [])
      ]
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid email/phone or password"
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email/phone or password" });
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
    const { firstName, lastName, phone, email } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.json({
        success: false,
        message: "First Name, Last Name, and Phone Number are all required."
      });
    }

    const cleanPhone = normalizePhone(phone);
    if (cleanPhone.length < 7) {
      return res.json({
        success: false,
        message: "Please enter a valid phone number (at least 7 digits)."
      });
    }

    // Check if another account is already using this phone number
    const existingPhoneUser = await User.findOne({
      phone: cleanPhone,
      _id: { $ne: userId }
    });
    if (existingPhoneUser) {
      return res.json({
        success: false,
        message: "This phone number is already registered to another account."
      });
    }

    const updateData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: cleanPhone,
      name: `${firstName.trim()} ${lastName.trim()}`
    };

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const existingEmailUser = await User.findOne({
        email: cleanEmail,
        _id: { $ne: userId }
      });
      if (existingEmailUser) {
        return res.json({
          success: false,
          message: "This email address is already registered to another account."
        });
      }
      updateData.email = cleanEmail;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
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
    if (error.code === 11000) {
      const isPhone = error.message.includes("phone") || (error.keyPattern && error.keyPattern.phone);
      return res.json({
        success: false,
        message: isPhone
          ? "An account already exists with this phone number."
          : "An account already exists with this email address."
      });
    }
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
