const {
  getAllDoctors,
  getTopRatedDoctors,
  getDoctorById,
} = require("../../services/doctors/doctors.service");

const fetchDoctors = async (req, res) => {
  try {
    const doctors = await getAllDoctors();
    return res.status(200).json(doctors);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const fetchTopRated = async (req, res) => {
  try {
    const doctors = await getTopRatedDoctors();
    return res.status(200).json(doctors);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const fetchDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await getDoctorById(id);
    return res.status(200).json(doctor);
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 400;
    return res.status(status).json({ message: error.message });
  }
};

module.exports = {
  fetchDoctors,
  fetchTopRated,
  fetchDoctorById,
};
