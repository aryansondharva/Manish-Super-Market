import Address from "../models/Address.js";

export const addAddresss = async (req, res) => {
  try {
    const { address, userId } = req.body;
    const finalUserId = userId || req.user?._id;
    if (!finalUserId) {
      return res.json({ success: false, message: "User ID required to save address" });
    }
    const newAddress = await Address.create({ ...address, userId: finalUserId });
    res.json({ success: true, message: "Address added successfully", address: newAddress });
  } catch (error) {
    console.log("Error in addAddress:", error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const getAddress = async (req, res) => {
  try {
    const userId = req.query?.userId || req.user?._id;
    if (!userId) {
      return res.json({ success: true, addresses: [] });
    }
    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error) {
    console.log("Error in getAddress:", error.message);
    return res.json({ success: false, message: error.message });
  }
};
