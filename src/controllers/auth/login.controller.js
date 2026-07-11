const { loginUser } = require("../../services/auth/login.service");

const signInWithEmail = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await loginUser(req.body);

    // Set cookie for session persistence (e.g. for Postman or frontend)
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: false, // set to true if HTTPS
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json(result);
  } catch (error) {
    const status = error.message.includes("Invalid") ? 401 : 500;
    return res.status(status).json({
      message: error.message,
    });
  }
};

module.exports = {
  signInWithEmail,
};