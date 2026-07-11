const jwt = require("jsonwebtoken");
const { getDb } = require("../../db/dbconfig");
const { ObjectId } = require("mongodb");

const JWT_SECRET = process.env.JWT_SECRET;

const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    cookies[parts[0].trim()] = parts[1] ? parts[1].trim() : "";
  });
  return cookies;
};

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // 1. Try to extract from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. Try to extract from Cookies if not found in header
    if (!token && req.headers.cookie) {
      const cookies = parseCookies(req.headers.cookie);
      token = cookies.token || cookies.session;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Fetch user from DB
    const db = getDb();
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token", error: error.message });
  }
};

module.exports = {
  authMiddleware,
  JWT_SECRET,
};
