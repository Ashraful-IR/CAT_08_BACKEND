const express = require("express");
const { signUpWithEmail } = require("../../controllers/auth/register.controller");

const router = express.Router();

router.post("/sign-up/email", signUpWithEmail);

module.exports = router;