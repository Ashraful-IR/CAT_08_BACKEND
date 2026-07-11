const bcrypt = require("bcryptjs");
const { getDb } = require("../../../db/dbconfig");

const registerUser = async (userData) => {
  const { name, email, password, photoURL } = userData;

  // Regex: min 6 chars, 1 uppercase, 1 lowercase
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{6,}$/;

  if (!passwordRegex.test(password)) {
    throw new Error(
      "Password must satisfy min 6 chars, 1 uppercase, 1 lowercase."
    );
  }

  const db = getDb();
  const usersCollection = db.collection("users");

  // Check if email already exists
  const existingUser = await usersCollection.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Save user to database
  const newUser = {
    name,
    email,
    photoURL,
    password: hashedPassword,
    createdAt: new Date(),
  };

  const result = await usersCollection.insertOne(newUser);

  return {
    message: "User registered successfully",
    user: {
      id: result.insertedId.toString(),
      name,
      email,
      photoURL,
    },
  };
};

module.exports = {
  registerUser,
};