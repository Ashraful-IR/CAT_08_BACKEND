const { getUserSession } = require("../../services/auth/session.service");

const getSession = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "No active session" });
    }
    const result = await getUserSession(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSession,
};
