import express from "express";
import {
  fetchAppointments,
  createAppointment,
  fetchMyAppointments,
  editAppointment,
  removeAppointment,
} from "../../controllers/appointments/appointments.controller.js";
import { authMiddleware } from "../../middleware/auth.js";

const router = express.Router();

router.get("/mine", authMiddleware, fetchMyAppointments);
router.get("/", fetchAppointments);
router.post("/", authMiddleware, createAppointment);
router.patch("/:id", authMiddleware, editAppointment);
router.delete("/:id", authMiddleware, removeAppointment);

export default router;
