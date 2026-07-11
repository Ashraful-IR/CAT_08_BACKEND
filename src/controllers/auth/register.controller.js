const { registerUser } = require("../../services/auth/register.service");

const signUpWithEmail = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, photoURL } = req.body;

    if (!name || !email || !password || !confirmPassword || !photoURL) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const result = await registerUser(req.body);

    return res.status(201).json(result);
  } catch (error) {
    const status = error.message.includes("All fields") || 
                   error.message.includes("Password must satisfy") || 
                   error.message.includes("Email already") 
                   ? 400 : 500;
    return res.status(status).json({
      message: error.message,
    });
  }
};

module.exports = {
  signUpWithEmail,
};