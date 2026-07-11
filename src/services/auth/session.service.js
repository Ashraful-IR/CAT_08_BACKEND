const { getDb } = require("../../../db/dbconfig");
const { ObjectId } = require("mongodb");

const getUserSession = async (userId) => {
  const db = getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
  if (!user) {
    throw new Error("User not found");
  }
  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      photoURL: user.photoURL,
    },
  };
};

module.exports = {
  getUserSession,
};
