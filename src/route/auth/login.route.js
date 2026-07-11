const express = require("express");
const { signUpWithEmail } = require("../../controllers/auth/register.controller");
const { signInWithEmail } = require("../../controllers/auth/login.controller");

const router = express.Router();

router.post("/sign-in/email", signInWithEmail);

module.exports = router;