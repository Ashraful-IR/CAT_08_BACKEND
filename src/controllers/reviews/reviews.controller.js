const {
  getReviewsForDoctor,
  createReview,
} = require("../../services/reviews/reviews.service");

const fetchDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const reviews = await getReviewsForDoctor(doctorId);
    return res.status(200).json(reviews);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const submitDoctorReview = async (req, res) => {
  try {
    const { doctorId, appointmentId, rating, comment } = req.body;

    if (!doctorId || !appointmentId || rating === undefined || !comment) {
      return res.status(400).json({ message: "All review fields are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await createReview(req.body, req.user);
    return res.status(201).json(review);
  } catch (error) {
    const status = error.status || 400;
    return res.status(status).json({ message: error.message });
  }
};

module.exports = {
  fetchDoctorReviews,
  submitDoctorReview,
};
