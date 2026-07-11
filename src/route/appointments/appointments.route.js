const express = require("express");
const {
  fetchAppointments,
  createAppointment,
  fetchMyAppointments,
  editAppointment,
  removeAppointment,
} = require("../../controllers/appointments/appointments.controller");
const { authMiddleware } = require("../../middleware/auth");

const router = express.Router();

router.get("/mine", authMiddleware, fetchMyAppointments);
router.get("/", fetchAppointments);
router.post("/", authMiddleware, createAppointment);
router.patch("/:id", authMiddleware, editAppointment);
router.delete("/:id", authMiddleware, removeAppointment);

module.exports = router;
