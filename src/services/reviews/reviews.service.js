const { getDb } = require("../../../db/dbconfig");
const { ObjectId } = require("mongodb");

const getReviewsForDoctor = async (doctorId) => {
  const db = getDb();
  return await db.collection("reviews").find({ doctorId }).toArray();
};

const createReview = async (reviewData, currentUser) => {
  const db = getDb();
  const { doctorId, appointmentId, rating, comment } = reviewData;

  // Validate appointmentId and doctorId format
  let appointmentObjectId;
  let doctorObjectId;
  try {
    appointmentObjectId = new ObjectId(appointmentId);
    doctorObjectId = new ObjectId(doctorId);
  } catch (err) {
    throw new Error("Invalid Appointment or Doctor ID format");
  }

  // 1. Verify the appointment exists, belongs to current user, and is for this doctor
  const appointment = await db.collection("appointments").findOne({
    _id: appointmentObjectId,
    doctorId: doctorId,
    userEmail: currentUser.email,
  });

  if (!appointment) {
    const err = new Error("No matching appointment booking found for this doctor");
    err.status = 400;
    throw err;
  }

  // 2. Prevent multiple reviews for the same appointment booking
  const existingReview = await db.collection("reviews").findOne({
    appointmentId: appointmentId,
  });

  if (existingReview) {
    const err = new Error("You have already reviewed this appointment booking");
    err.status = 400;
    throw err;
  }

  // 3. Create review
  const newReview = {
    doctorId,
    appointmentId,
    rating: Number(rating),
    comment,
    userEmail: currentUser.email,
    userName: currentUser.name,
    userPhotoURL: currentUser.photoURL,
    createdAt: new Date(),
  };

  const result = await db.collection("reviews").insertOne(newReview);
  newReview.id = result.insertedId.toString();
  newReview._id = result.insertedId;

  // 4. Dynamically update the doctor's average rating
  try {
    const reviews = await db.collection("reviews").find({ doctorId }).toArray();
    const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Number((sumRatings / reviews.length).toFixed(1));

    await db.collection("doctors").updateOne(
      { _id: doctorObjectId },
      { $set: { rating: avgRating } }
    );
  } catch (err) {
    console.error("Failed to update doctor average rating:", err);
  }

  return newReview;
};

module.exports = {
  getReviewsForDoctor,
  createReview,
};
