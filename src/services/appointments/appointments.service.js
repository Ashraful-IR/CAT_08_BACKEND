const { getDb } = require("../../../db/dbconfig");
const { ObjectId } = require("mongodb");

const getAppointments = async (queryOptions) => {
  const db = getDb();
  const filter = {};

  if (queryOptions.search) {
    filter.doctorName = { $regex: queryOptions.search, $options: "i" };
  }

  const sort = {};
  if (queryOptions.sortBy) {
    const fieldMap = {
      fee: "fee",
      rating: "rating",
      name: "doctorName",
    };
    const sortField = fieldMap[queryOptions.sortBy] || "createdAt";
    sort[sortField] = queryOptions.order === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  return await db.collection("appointments").find(filter).sort(sort).toArray();
};

const bookAppointment = async (appointmentData, currentUser) => {
  const db = getDb();
  const {
    doctorId,
    patientName,
    gender,
    phone,
    appointmentDate,
    appointmentTime,
  } = appointmentData;

  const userEmail = appointmentData.userEmail || currentUser.email;

  // Retrieve doctor details to get fee, rating, and official name
  let doctorObjectId;
  try {
    doctorObjectId = new ObjectId(doctorId);
  } catch (err) {
    throw new Error("Invalid Doctor ID format");
  }

  const doctor = await db.collection("doctors").findOne({ _id: doctorObjectId });
  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // Check for slot conflicts (same doctor, date, and time)
  const existingSlot = await db.collection("appointments").findOne({
    doctorId: doctorId,
    appointmentDate: appointmentDate,
    appointmentTime: appointmentTime,
  });

  if (existingSlot) {
    const conflictErr = new Error("Doctor is already booked at this slot");
    conflictErr.status = 409;
    throw conflictErr;
  }

  const newAppointment = {
    userEmail,
    doctorId,
    doctorName: doctor.name,
    fee: doctor.fee || 0,
    rating: doctor.rating || 0,
    patientName,
    gender,
    phone,
    appointmentDate,
    appointmentTime,
    createdAt: new Date(),
  };

  const result = await db.collection("appointments").insertOne(newAppointment);
  newAppointment.id = result.insertedId.toString();
  newAppointment._id = result.insertedId;

  return newAppointment;
};

const getMyAppointments = async (userEmail) => {
  const db = getDb();
  return await db
    .collection("appointments")
    .find({ userEmail })
    .sort({ appointmentDate: 1 })
    .toArray();
};

const updateAppointment = async (id, updateData, currentUser) => {
  const db = getDb();
  let appointmentObjectId;
  try {
    appointmentObjectId = new ObjectId(id);
  } catch (err) {
    throw new Error("Invalid Appointment ID format");
  }

  const appointment = await db
    .collection("appointments")
    .findOne({ _id: appointmentObjectId });

  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  if (appointment.userEmail !== currentUser.email) {
    const err = new Error("Forbidden: You do not own this appointment");
    err.status = 403;
    throw err;
  }

  const { patientName, gender, phone, appointmentDate, appointmentTime } = updateData;

  const targetDate = appointmentDate || appointment.appointmentDate;
  const targetTime = appointmentTime || appointment.appointmentTime;

  // Check for slot conflict if date/time changes
  if (
    targetDate !== appointment.appointmentDate ||
    targetTime !== appointment.appointmentTime
  ) {
    const existingSlot = await db.collection("appointments").findOne({
      _id: { $ne: appointmentObjectId },
      doctorId: appointment.doctorId,
      appointmentDate: targetDate,
      appointmentTime: targetTime,
    });

    if (existingSlot) {
      const conflictErr = new Error("Doctor is already booked at this slot");
      conflictErr.status = 409;
      throw conflictErr;
    }
  }

  const updatedFields = {
    patientName: patientName || appointment.patientName,
    gender: gender || appointment.gender,
    phone: phone || appointment.phone,
    appointmentDate: targetDate,
    appointmentTime: targetTime,
    updatedAt: new Date(),
  };

  await db
    .collection("appointments")
    .updateOne({ _id: appointmentObjectId }, { $set: updatedFields });

  return {
    ...appointment,
    ...updatedFields,
  };
};

const deleteAppointment = async (id, currentUser) => {
  const db = getDb();
  let appointmentObjectId;
  try {
    appointmentObjectId = new ObjectId(id);
  } catch (err) {
    throw new Error("Invalid Appointment ID format");
  }

  const appointment = await db
    .collection("appointments")
    .findOne({ _id: appointmentObjectId });

  if (!appointment) {
    const err = new Error("Appointment not found");
    err.status = 404;
    throw err;
  }

  if (appointment.userEmail !== currentUser.email) {
    const err = new Error("Forbidden: You do not own this appointment");
    err.status = 403;
    throw err;
  }

  await db.collection("appointments").deleteOne({ _id: appointmentObjectId });
  return { message: "Appointment deleted successfully" };
};

module.exports = {
  getAppointments,
  bookAppointment,
  getMyAppointments,
  updateAppointment,
  deleteAppointment,
};
