const socialSignIn = async (req, res) => {
  try {
    const { provider } = req.query;
    if (!provider) {
      return res.status(400).json({ message: "Provider is required" });
    }
    // Simulate OAuth redirect back to the client/frontend
    const redirectUrl = `http://localhost:5002/oauth-callback?provider=${provider}&token=mock-social-token-xyz`;
    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  socialSignIn,
};
