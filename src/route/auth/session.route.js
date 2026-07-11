const express = require("express");
const { getSession } = require("../../controllers/auth/session.controller");
const { signOut } = require("../../controllers/auth/logout.controller");
const { socialSignIn } = require("../../controllers/auth/social.controller");
const { authMiddleware } = require("../../middleware/auth");

const router = express.Router();

router.get("/session", authMiddleware, getSession);
router.post("/sign-out", signOut);
router.get("/sign-in/social", socialSignIn);

module.exports = router;
