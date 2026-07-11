const {
  getAppointments,
  bookAppointment,
  getMyAppointments,
  updateAppointment,
  deleteAppointment,
} = require("../../services/appointments/appointments.service");

const fetchAppointments = async (req, res) => {
  try {
    const { search, sortBy, order } = req.query;
    const appointments = await getAppointments({ search, sortBy, order });
    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      patientName,
      gender,
      phone,
      appointmentDate,
      appointmentTime,
    } = req.body;

    if (
      !doctorId ||
      !patientName ||
      !gender ||
      !phone ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({ message: "All booking fields are required" });
    }

    const appointment = await bookAppointment(req.body, req.user);
    return res.status(201).json(appointment);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ message: error.message });
  }
};

const fetchMyAppointments = async (req, res) => {
  try {
    const appointments = await getMyAppointments(req.user.email);
    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const editAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await updateAppointment(id, req.body, req.user);
    return res.status(200).json(appointment);
  } catch (error) {
    const status = error.status || 400;
    return res.status(status).json({ message: error.message });
  }
};

const removeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteAppointment(id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 400;
    return res.status(status).json({ message: error.message });
  }
};

module.exports = {
  fetchAppointments,
  createAppointment,
  fetchMyAppointments,
  editAppointment,
  removeAppointment,
};
