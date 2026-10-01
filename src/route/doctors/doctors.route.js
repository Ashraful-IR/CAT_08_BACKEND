import express from "express";
import {
  fetchDoctors,
  fetchTopRated,
  fetchDoctorById,
} from "../../controllers/doctors/doctors.controller.js";

const router = express.Router();

router.get("/top-rated", fetchTopRated);
router.get("/:id", fetchDoctorById);
router.get("/", fetchDoctors);

export default router;
