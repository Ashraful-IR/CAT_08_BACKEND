const signOut = async (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out successfully" });
};

module.exports = {
  signOut,
};
