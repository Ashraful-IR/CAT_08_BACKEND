const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../../../db/dbconfig");
const { JWT_SECRET } = require("../../middleware/auth");

const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const db = getDb();
  const usersCollection = db.collection("users");

  // Check if user exists with the provided email
  const user = await usersCollection.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify the password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate a token for the user
  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    message: "User logged in successfully",
    token,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
    },
  };
};

module.exports = {
  loginUser,
};