const express = require("express");
const { editUserProfile } = require("../../controllers/users/users.controller");
const { authMiddleware } = require("../../middleware/auth");

const router = express.Router();

router.patch("/:email", authMiddleware, editUserProfile);

module.exports = router;
