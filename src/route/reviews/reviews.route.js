const express = require("express");
const {
  fetchDoctorReviews,
  submitDoctorReview,
} = require("../../controllers/reviews/reviews.controller");
const { authMiddleware } = require("../../middleware/auth");

const router = express.Router();

router.get("/:doctorId", fetchDoctorReviews);
router.post("/", authMiddleware, submitDoctorReview);

module.exports = router;
