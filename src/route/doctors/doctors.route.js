const express = require("express");
const {
  fetchDoctors,
  fetchTopRated,
  fetchDoctorById,
} = require("../../controllers/doctors/doctors.controller");

const router = express.Router();

router.get("/top-rated", fetchTopRated);
router.get("/:id", fetchDoctorById);
router.get("/", fetchDoctors);

module.exports = router;
