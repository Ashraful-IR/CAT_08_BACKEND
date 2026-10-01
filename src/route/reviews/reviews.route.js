import express from "express";
import {
  fetchDoctorReviews,
  submitDoctorReview,
} from "../../controllers/reviews/reviews.controller.js";
import { authMiddleware } from "../../middleware/auth.js";

const router = express.Router();

router.get("/:doctorId", fetchDoctorReviews);
router.post("/", authMiddleware, submitDoctorReview);

export default router;
