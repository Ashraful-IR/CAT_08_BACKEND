const { updateUserProfile } = require("../../services/users/users.service");

const editUserProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const result = await updateUserProfile(email, req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 400;
    return res.status(status).json({ message: error.message });
  }
};

module.exports = {
  editUserProfile,
};
