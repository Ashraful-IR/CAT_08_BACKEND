const dns = require("dns");
dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
  "0.0.0.0",
  "1.1.1.1",
  "103.129.238.255",
  "192.168.1.1",
]);
const express = require("express");
//Database connection
const { connectdb } = require("./db/dbconfig");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT;

//user registration
app.post("/api/auth/sign-up/email", (req, res) => {
  const { name, email, password, confirmPassword, photoURL } = req.body;
  if (!name || !email || !password || !confirmPassword || !photoURL) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }
  // Here you would typically save the user to the database
  res.status(201).json({ message: "User registered successfully" });
});

//user login
app.post("/api/auth/sign-in/email", (req, res) => {
  const { email, password } = req.body; 
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  else {
    // Here you would typically check the user's credentials against the database
    res.status(200).json({ message: "User logged in successfully" });
  }
});




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
