const { getDb } = require("../../../db/dbconfig");

const updateUserProfile = async (email, updateData, currentUser) => {
  if (email !== currentUser.email) {
    const err = new Error("Forbidden: You cannot update another user's profile");
    err.status = 403;
    throw err;
  }

  const { name, photoURL } = updateData;

  const db = getDb();
  const usersCollection = db.collection("users");

  const updateFields = {};
  if (name) updateFields.name = name;
  if (photoURL) updateFields.photoURL = photoURL;

  if (Object.keys(updateFields).length === 0) {
    throw new Error("No fields provided to update");
  }

  const result = await usersCollection.findOneAndUpdate(
    { email },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  const updatedUser = result.value || await usersCollection.findOne({ email });

  return {
    message: "Profile updated successfully",
    user: {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      photoURL: updatedUser.photoURL,
    },
  };
};

module.exports = {
  updateUserProfile,
};
