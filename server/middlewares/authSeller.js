import jwt from "jsonwebtoken";

const authSeller = async (req, res, next) => {
  const sellerToken =
    req.cookies?.sellerToken ||
    req.headers["seller-token"] ||
    req.headers["authorization"]?.replace("Bearer ", "");

  if (!sellerToken) {
    return res.json({ success: false, message: "Not Authorized as Seller/Admin" });
  }

  try {
    const tokenDecode = jwt.verify(
      sellerToken,
      process.env.JWT_SECRET || "grocery_secret_jwt_key_2026_xyz"
    );
    const adminEmail = process.env.SELLER_EMAIL || "admin@grocery.com";
    if (tokenDecode.email === adminEmail) {
      next();
    } else {
      return res.json({ success: false, message: "Not Authorized as Admin" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default authSeller;
