const { getDb } = require("../../../db/dbconfig");
const { ObjectId } = require("mongodb");

const getAllDoctors = async () => {
  const db = getDb();
  const doctors = await db.collection("doctors").find({}).toArray();
  return doctors;
};

const getTopRatedDoctors = async () => {
  const db = getDb();
  // Returns top 3 rated doctors
  const doctors = await db
    .collection("doctors")
    .find({})
    .sort({ rating: -1 })
    .limit(3)
    .toArray();
  return doctors;
};

const getDoctorById = async (id) => {
  const db = getDb();
  let queryId;
  try {
    queryId = new ObjectId(id);
  } catch (err) {
    throw new Error("Invalid Doctor ID format");
  }

  const doctor = await db.collection("doctors").findOne({ _id: queryId });
  if (!doctor) {
    throw new Error("Doctor not found");
  }
  return doctor;
};

module.exports = {
  getAllDoctors,
  getTopRatedDoctors,
  getDoctorById,
};
