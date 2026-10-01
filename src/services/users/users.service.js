import { getDb } from "../../../db/dbconfig.js";

const updateUserProfile = async (email, updateData, currentUser) => {
  if (email !== currentUser.email) {
    const err = new Error("Forbidden: You cannot update another user's profile");
    err.status = 403;
    throw err;
  }

  const { name, photoURL } = updateData;

  const db = getDb();
  // Better Auth owns this collection (singular "user").
  const usersCollection = db.collection("user");

  const updateFields = {};
  if (name) updateFields.name = name;
  // Better Auth stores the avatar in `image`; the API still accepts `photoURL`.
  if (photoURL) updateFields.image = photoURL;

  if (Object.keys(updateFields).length === 0) {
    throw new Error("No fields provided to update");
  }

  const result = await usersCollection.findOneAndUpdate(
    { email },
    { $set: updateFields },
    { returnDocument: "after" }
  );

  const updatedUser =
    result.value || (await usersCollection.findOne({ email }));

  return {
    message: "Profile updated successfully",
    user: {
      id: updatedUser.id || updatedUser._id?.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      photoURL: updatedUser.image,
    },
  };
};

export { updateUserProfile };
